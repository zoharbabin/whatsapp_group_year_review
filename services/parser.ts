
import { Message, ParticipantStats, ChatAnalysis, SharedLink, InteractionGraph, ConversationKiller } from '../types';
import { STOP_WORDS } from '../constants';
import SparkMD5 from 'spark-md5';

// Helper to anonymize names
const funNicknames = [
  "Sparkling Unicorn", "Happy Panda", "Dancing Cactus", "Space Cadet", "Disco Potato",
  "Ninja Turtle", "Glitter Bomb", "Wise Owl", "Chill Penguin", "Spicy Taco",
  "Rocket Man", "Cyber Punk", "Party Parrot", "Cool Cat", "Magic Dragon"
];

const nameMap = new Map<string, string>();
let nicknameIndex = 0;

const getNickname = (originalName: string): string => {
  const cleanName = originalName.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim();
  if (!nameMap.has(cleanName)) {
    if (nicknameIndex < funNicknames.length) {
      nameMap.set(cleanName, funNicknames[nicknameIndex++]);
    } else {
      nameMap.set(cleanName, `Anonymous ${nicknameIndex++}`);
    }
  }
  return nameMap.get(cleanName) || cleanName;
};

export const generateFileHash = (content: string): string => {
  return SparkMD5.hash(content.substring(0, 50000)); // Optimize hashing by only hashing first 50k chars
};

// Async parser to prevent blocking the main thread
export const parseChatAsync = async (text: string, anonymize: boolean = false): Promise<ChatAnalysis> => {
  const lines = text.split(/\r?\n/);
  const messages: Message[] = [];
  
  // Regex pre-compiled
  const lineRegex = /^[\u200E\u200F]*\[?(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})[,\s\u202F]+(\d{1,2}:\d{2}(?::\d{2})?)(?:[\s\u202F]?([APap][Mm]))?\]?[\s\u200E\u200F~]*(.*?):[\s\u200E\u200F]*(.*)$/;
  const dateSplitRegex = /[\/\.-]/;

  let currentMessage: Message | null = null;
  const BATCH_SIZE = 3000; // Process 3000 lines before yielding

  // --- PHASE 1: Raw Parsing ---
  for (let i = 0; i < lines.length; i++) {
    if (i % BATCH_SIZE === 0) await new Promise(resolve => setTimeout(resolve, 0));

    const line = lines[i];
    const cleanLineStart = line.replace(/^[\u200E\u200F\u202A-\u202E]+/, '');
    const match = cleanLineStart.match(lineRegex);

    if (match) {
      if (currentMessage) messages.push(currentMessage);

      const [_, dateStr, timeStr, ampm, senderRaw, contentRaw] = match;
      let sender = senderRaw.trim();
      if (sender.startsWith('~')) sender = sender.substring(1).trim();
      
      if (anonymize) sender = getNickname(sender);

      const dateParts = dateStr.split(dateSplitRegex);
      let day, month, year;
      const p1 = parseInt(dateParts[0]);
      const p2 = parseInt(dateParts[1]);
      
      if (p1 > 12) { day = p1; month = p2 - 1; } else { day = p1; month = p2 - 1; }
      year = parseInt(dateParts[2]);
      if (year < 100) year += 2000;

      let [hours, minutes, seconds] = timeStr.split(':').map(Number);
      if (ampm) {
        const isPM = ampm.toUpperCase() === 'PM';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }

      const dateObj = new Date(year, month, day, hours, minutes, seconds || 0);
      let isMedia = false;
      let mediaType: Message['mediaType'] = undefined;
      let content = contentRaw.trim();
      const lowerContent = content.toLowerCase();

      if (lowerContent.includes('<attached:')) {
         isMedia = true;
         if (lowerContent.includes('photo') || lowerContent.includes('jpg')) mediaType = 'image';
         else if (lowerContent.includes('video')) mediaType = 'video';
         else if (lowerContent.includes('audio')) mediaType = 'audio';
         else mediaType = 'unknown';
         content = "Media Attached"; 
      }
      else if (lowerContent.includes('omitted')) { 
        isMedia = true; 
        if (lowerContent.includes('image')) mediaType = 'image';
        else if (lowerContent.includes('video')) mediaType = 'video';
        else if (lowerContent.includes('audio')) mediaType = 'audio';
        else if (lowerContent.includes('sticker')) mediaType = 'sticker';
      }

      if (content.includes('<This message was edited>')) {
          content = content.replace(/<This message was edited>/gi, '').trim();
      }

      currentMessage = { date: dateObj, sender, content, isMedia, mediaType };
    } else {
      if (currentMessage) currentMessage.content += '\n' + line;
    }
  }

  if (currentMessage) messages.push(currentMessage);

  const cleanMessages: Message[] = [];
  const totalMsgs = messages.length;
  
  for (let i = 0; i < totalMsgs; i++) {
      if (i % BATCH_SIZE === 0) await new Promise(resolve => setTimeout(resolve, 0));
      const msg = messages[i];
      const c = msg.content.toLowerCase();
      
      // Basic filtering of export artifacts
      if (c.includes('end-to-end encrypted') || c.includes('created this group')) continue;
      if (c.length < 60 && (c.includes('added') || c.includes('left') || c.includes('removed'))) continue;
      
      cleanMessages.push(msg);
  }

  // CRITICAL FIX: SORT MESSAGES CHRONOLOGICALLY
  // WhatsApp exports can sometimes be out of order depending on the device/backup
  cleanMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

  // --- PHASE 2: Analysis ---
  const participantsMap = new Map<string, ParticipantStats>();
  const timelineMap = new Map<string, number>();
  const wordCounts = new Map<string, number>();
  const emojiCounts = new Map<string, number>();
  const mediaStatsMap = new Map<string, number>();
  const hourlyActivity = new Array(24).fill(0);
  const linkStatsMap = new Map<string, { count: number, senders: Map<string, number>, context: string[] }>();
  const domainCountMap = new Map<string, number>();
  const interactions = new Map<string, number>();
  const participantList = new Set<string>();

  const latencyTracker = new Map<string, number[]>();
  const burstTracker = new Map<string, number[]>();
  const conversationKillers: ConversationKiller[] = [];
  
  let currentBurstSender = '';
  let currentBurstCount = 0;
  let prevMsgTime = cleanMessages.length > 0 ? cleanMessages[0].date.getTime() : 0;

  const urlRegex = /(?:(?:https?:\/\/)|(?:www\.))[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const wordSplitRegex = /[\s,.;:!?"'()\[\]{}*~`\-_|\\/<>]+/;
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
  const numericRegex = /^\d+$/;

  const cleanLen = cleanMessages.length;
  
  for (let index = 0; index < cleanLen; index++) {
    if (index % BATCH_SIZE === 0) await new Promise(resolve => setTimeout(resolve, 0));

    const msg = cleanMessages[index];
    participantList.add(msg.sender);
    const hour = msg.date.getHours();
    hourlyActivity[hour]++;

    if (!participantsMap.has(msg.sender)) {
      participantsMap.set(msg.sender, {
        name: msg.sender, messageCount: 0, wordCount: 0, mediaCount: 0, reactionScore: 0, topEmojis: {},
        avgReplyTimeSeconds: 0, avgBurstLength: 0, conversationKills: 0
      });
    }
    const stats = participantsMap.get(msg.sender)!;
    stats.messageCount++;

    if (msg.sender === currentBurstSender) {
        currentBurstCount++;
    } else {
        if (currentBurstSender) {
            if (!burstTracker.has(currentBurstSender)) burstTracker.set(currentBurstSender, []);
            burstTracker.get(currentBurstSender)!.push(currentBurstCount);
        }
        currentBurstSender = msg.sender;
        currentBurstCount = 1;
    }

    const timeDiffSeconds = (msg.date.getTime() - prevMsgTime) / 1000;
    if (timeDiffSeconds < 3600 && timeDiffSeconds > 0) {
        if (!latencyTracker.has(msg.sender)) latencyTracker.set(msg.sender, []);
        latencyTracker.get(msg.sender)!.push(timeDiffSeconds);
    }

    if (index < cleanLen - 1) {
        const nextMsg = cleanMessages[index + 1];
        const silenceDurationMs = nextMsg.date.getTime() - msg.date.getTime();
        
        // INTELLIGENT KILLER DETECTION
        // 1. Must be > 4 hours silence
        // 2. Must happen during "waking hours" (8am - 10pm) to avoid sleeping silences
        // 3. Must NOT be a system message (security code, etc)
        // 4. Must NOT be a media message
        if (silenceDurationMs > 14400000 && hour >= 8 && hour <= 22) {
             const lowerC = msg.content.toLowerCase();
             const isSystem = lowerC.includes('security code') || 
                              lowerC.includes('waiting for this message') ||
                              lowerC.includes('this message was deleted') ||
                              lowerC.includes('encryption') || 
                              lowerC.includes('changed the subject') ||
                              lowerC.includes('changed the group') ||
                              lowerC.includes('joined using this group');
             
             if (!msg.isMedia && !isSystem && msg.content.length > 3) {
                 const silenceHours = silenceDurationMs / (1000 * 60 * 60);
                 stats.conversationKills++;
                 
                 // Capture context: The message BEFORE the killer
                 const contextMsg = index > 0 ? `${cleanMessages[index-1].sender}: "${cleanMessages[index-1].content.substring(0, 50)}..."` : "No prior context";

                 conversationKillers.push({
                     sender: msg.sender,
                     content: msg.content,
                     date: msg.date,
                     silenceDurationHours: parseFloat(silenceHours.toFixed(1)),
                     context: contextMsg // Save context for AI
                 });
             }
        }
    }
    prevMsgTime = msg.date.getTime();

    if (msg.isMedia) {
      stats.mediaCount++;
      const type = msg.mediaType || 'unknown';
      mediaStatsMap.set(type, (mediaStatsMap.get(type) || 0) + 1);
    } else {
      const links = msg.content.match(urlRegex);
      if (links) {
        for (const link of links) {
          const cleanLink = link.replace(/\/$/, '');
          if (!linkStatsMap.has(cleanLink)) {
            linkStatsMap.set(cleanLink, { count: 0, senders: new Map(), context: [] });
          }
          const linkData = linkStatsMap.get(cleanLink)!;
          linkData.count++;
          linkData.senders.set(msg.sender, (linkData.senders.get(msg.sender) || 0) + 1);
          
          if (linkData.context.length < 5) {
             try {
                let urlForParsing = cleanLink;
                if (!urlForParsing.match(/^https?:\/\//)) urlForParsing = 'https://' + urlForParsing;
                const domain = new URL(urlForParsing).hostname.replace('www.', '');
                domainCountMap.set(domain, (domainCountMap.get(domain) || 0) + 1);
             } catch(e) {}
             const contextMsg = msg.content.replace(link, '').trim();
             if (contextMsg.length > 3) linkData.context.push(`${msg.sender}: ${contextMsg}`);
          }
        }
      }

      let cleanContent = msg.content.toLowerCase();
      if (cleanContent.includes('<') || cleanContent.includes('http')) {
        cleanContent = cleanContent.replace(/<.*?>/g, '').replace(/http\S+/g, '');
      }
      
      const words = cleanContent.split(wordSplitRegex);
      stats.wordCount += words.length;
      
      for (const word of words) {
        if (word.length <= 2) continue; 
        const cleanWord = word; 
        
        if (!STOP_WORDS.has(cleanWord) && !numericRegex.test(cleanWord)) {
           wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
        }
      }

      const emojis = msg.content.match(emojiRegex);
      if (emojis) {
        for (const emoji of emojis) {
          stats.topEmojis[emoji] = (stats.topEmojis[emoji] || 0) + 1;
          emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
        }
      }
      
      if (msg.content.includes('@')) {
         participantList.forEach(other => {
           if (other !== msg.sender && msg.content.includes(other)) {
              const key = `${msg.sender}|${other}`;
              interactions.set(key, (interactions.get(key) || 0) + 3);
           }
         });
      }
    }

    if (msg.date) {
        const y = msg.date.getFullYear();
        const m = msg.date.getMonth() + 1;
        const d = msg.date.getDate();
        const key = `${y}-${m < 10 ? '0'+m : m}-${d < 10 ? '0'+d : d}`;
        timelineMap.set(key, (timelineMap.get(key) || 0) + 1);
    }
  }

  participantsMap.forEach((stats, name) => {
      const bursts = burstTracker.get(name) || [1];
      const avgBurst = bursts.reduce((a,b) => a+b, 0) / bursts.length;
      stats.avgBurstLength = parseFloat(avgBurst.toFixed(2));

      const latencies = latencyTracker.get(name) || [60];
      const avgLat = latencies.reduce((a,b) => a+b, 0) / latencies.length;
      stats.avgReplyTimeSeconds = Math.round(avgLat);
  });

  const topKillers = conversationKillers
    .filter(k => k.content.length > 5 && !k.content.includes("Media Attached"))
    .sort((a, b) => b.silenceDurationHours - a.silenceDurationHours)
    .slice(0, 10);

  // Peak Day Logic (Optimized for speed)
  const sortedDays = Array.from(timelineMap.entries()).sort((a, b) => b[1] - a[1]);
  const topPeaks: { dateKey: string; count: number }[] = [];
  
  for (const [dateKey, count] of sortedDays) {
      if (topPeaks.length >= 3) break;
      const d1 = new Date(dateKey);
      const isTooClose = topPeaks.some(p => {
          const d2 = new Date(p.dateKey);
          const diffTime = Math.abs(d2.getTime() - d1.getTime());
          return diffTime < 259200000; // 3 days
      });
      if (!isTooClose) topPeaks.push({ dateKey, count });
  }

  // Optimized Snippet Extraction - One Pass with Chunking
  const peakMessagesMap = new Map<string, string[]>();
  topPeaks.forEach(p => peakMessagesMap.set(p.dateKey, []));
  const targetDateKeys = new Set(topPeaks.map(p => p.dateKey));

  if (targetDateKeys.size > 0) {
      for (let i = 0; i < cleanLen; i++) {
        if (i % BATCH_SIZE === 0) await new Promise(resolve => setTimeout(resolve, 0));
        
        const msg = cleanMessages[i];
        // Rebuild key manually (faster than ISO string)
        const y = msg.date.getFullYear();
        const m = msg.date.getMonth() + 1;
        const d = msg.date.getDate();
        const key = `${y}-${m < 10 ? '0'+m : m}-${d < 10 ? '0'+d : d}`;

        if (targetDateKeys.has(key)) {
            const arr = peakMessagesMap.get(key);
            if (arr && arr.length < 15) { 
                arr.push(`${msg.sender}: ${msg.content.substring(0, 60)}`);
            }
        }
      }
  }

  const peakDayContext = topPeaks.map(p => {
      const [y, m, d] = p.dateKey.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { date: formattedDate, snippets: peakMessagesMap.get(p.dateKey) || [] };
  });

  // SMART DISTRIBUTED SAMPLING
  // Sample up to 1000 messages (reduced from 3500) to ensure stability with large files
  const SAMPLE_SIZE = 1000;
  const step = Math.max(1, Math.floor(cleanMessages.length / SAMPLE_SIZE));
  const distributedSample: Message[] = [];
  
  for (let i = 0; i < cleanMessages.length; i += step) {
      const msg = cleanMessages[i];
      // Filter out extremely short messages from the AI sample (still counting them for stats)
      // This maximizes the "content density" for the AI context window.
      if (msg.content.length > 8) {
          distributedSample.push(msg);
      } else if (i + 1 < cleanMessages.length && cleanMessages[i+1].content.length > 8) {
          distributedSample.push(cleanMessages[i+1]);
      } else if (i + 2 < cleanMessages.length && cleanMessages[i+2].content.length > 8) {
          distributedSample.push(cleanMessages[i+2]);
      } else {
          // Fallback to maintain timeline if no good messages found nearby
          distributedSample.push(msg);
      }
  }
  
  // Cap at SAMPLE_SIZE
  const finalSample = distributedSample.slice(0, SAMPLE_SIZE);

  const participants = Array.from(participantsMap.values()).sort((a, b) => b.messageCount - a.messageCount);
  const topParticipantNames = new Set(participants.slice(0, 12).map(p => p.name));
  const graphLinks = Array.from(interactions.entries())
    .map(([key, weight]) => ({ source: key.split('|')[0], target: key.split('|')[1], weight }))
    .filter(l => topParticipantNames.has(l.source) && topParticipantNames.has(l.target) && l.weight > 2)
    .sort((a, b) => b.weight - a.weight);

  const timelineData = Array.from(timelineMap.entries()).sort().map(([key, count]) => {
      const [y, m, d] = key.split('-');
      return { date: new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
  });

  const sharedLinks = Array.from(linkStatsMap.entries())
    .map(([url, d]) => ({ url, domain: new URL(url.startsWith('http') ? url : `http://${url}`).hostname.replace('www.', ''), count: d.count, topSender: Array.from(d.senders.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0], context: d.context }))
    .sort((a, b) => b.count - a.count).slice(0, 30);

  return {
    chatName: "WhatsApp Group",
    totalMessages: cleanMessages.length,
    dateRange: { start: cleanMessages[0]?.date || new Date(), end: cleanMessages[cleanMessages.length - 1]?.date || new Date() },
    participants,
    timelineData,
    hourlyActivity: hourlyActivity.map((count, hour) => ({ hour, count })),
    wordCloud: Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 150).map(([text, value]) => ({ text, value })),
    topEmojis: Array.from(emojiCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([emoji, count]) => ({ emoji, count })),
    mediaStats: Array.from(mediaStatsMap.entries()).map(([type, count]) => ({ type, count })),
    sharedLinks,
    domainStats: Array.from(domainCountMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([domain, count]) => ({ domain, count })),
    viralMessages: cleanMessages.filter(m => !m.isMedia && m.content.length > 20).sort((a, b) => b.content.length - a.content.length).slice(0, 5),
    messageSample: finalSample,
    peakDayContext,
    interactionGraph: { nodes: Array.from(topParticipantNames), links: graphLinks },
    conversationKillers: topKillers
  };
};
