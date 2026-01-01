import { GoogleGenAI, Type } from "@google/genai";
import { AIInsights, Message, ParticipantStats, SharedLink, InteractionGraph, ConversationKiller } from '../types';

const getClient = () => {
    if (!process.env.API_KEY) return null;
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper for safer JSON parsing with fallback for common AI errors
function safeJsonParse(str: string): any {
  // 1. Strip Markdown code blocks
  let clean = str.replace(/```json/g, "").replace(/```/g, "").trim();
  
  // 2. Extract JSON object only
  const firstOpen = clean.indexOf("{");
  const lastClose = clean.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1) {
    clean = clean.substring(firstOpen, lastClose + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    // 3. Attempt to fix common JSON syntax errors from LLMs
    try {
        let fixed = clean;
        
        // Remove comments (// ...)
        fixed = fixed.replace(/\/\/.*$/gm, '');

        // Fix single-quoted keys ('key':) -> "key":
        // This handles keys at the start of a line or after a separator
        fixed = fixed.replace(/(^|[{,]\s*)'([a-zA-Z0-9_\-]+)'\s*:/g, '$1"$2":');
        
        // Fix unquoted keys: key: "value" -> "key": "value"
        // We look for a key followed by a colon, preceded by { or , or start of string
        // We accept alphanumeric + underscore + hyphen
        fixed = fixed.replace(/(^|[{,]\s*)([a-zA-Z0-9_\-]+)\s*:/g, '$1"$2":');
        
        // Fix trailing commas before closing braces/brackets: , } -> } and , ] -> ]
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');

        return JSON.parse(fixed);
    } catch (e2) {
        console.warn("JSON auto-fix failed for:", clean.substring(0, 100) + "..."); 
        throw e; // Throw original error so we know it failed
    }
  }
}

// Helper to sanitize numbers from AI (e.g., "approx 50%" -> 50)
function sanitizeNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Aggressively extract the first number found
        const match = val.match(/(\d+(\.\d+)?)/);
        if (match) {
            return parseFloat(match[0]);
        }
    }
    return 0;
}

export const generateFestiveImage = async (summary: string, title: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const prompt = `A funny, festive, high-quality 3D render abstract image representing this group chat description: "${summary}". 
        The image should be vibrant, colorful, like a Spotify Wrapped cover art. 
        Style: Abstract 3D, Confetti, Neon Lights, Celebration. No text in the image.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                // Ensure we get a simplified response if possible, though flash-image handles it automatically
            }
        });

        // Extract image from response parts
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return null;
    }
};

export const analyzeWithGemini = async (
  messages: Message[], 
  participants: ParticipantStats[],
  rawWordCloud: { text: string; value: number }[],
  topEmojis: { emoji: string; count: number }[],
  peakDayContext?: { date: string; snippets: string[] }[],
  sharedLinks?: SharedLink[],
  domainStats?: { domain: string; count: number }[],
  interactionGraph?: InteractionGraph,
  conversationKillers?: ConversationKiller[]
): Promise<AIInsights> => {
  
  const fallbackInsights: AIInsights = {
      summary: "A legendary group chat full of memes and dreams.",
      sentimentTrend: [],
      emotionalProfile: [{ emoji: "😂", label: "Joy", score: 85 }, { emoji: "🔥", label: "Hype", score: 60 }],
      awards: [
        { title: "The MVP", winner: participants[0]?.name || "Unknown", reason: "For being awesome." },
        { title: "The Ghost", winner: participants[participants.length-1]?.name || "Unknown", reason: "Never here." }
      ],
      poem: "Roses are red, violets are blue, this chat is crazy, and so are you.",
      topics: ["Fun", "Life"],
      realityShow: { title: "Chat Survivors", genre: "Drama", logline: "Who will leave the group first?", cast: [] },
      killerRoast: "This message was so boring the internet disconnected.",
      linkThemes: [{ theme: "General", percentage: 100, description: "Everything" }],
      topLinksCommentary: [],
      timelineHighlights: []
  };

  if (!messages || messages.length === 0 || !process.env.API_KEY) return fallbackInsights;
  const ai = getClient();
  if (!ai) return fallbackInsights;

  // --- Context Construction ---
  
  // 1. Message Sample
  const messagesToAnalyze = messages
      .map(m => `${m.sender}: ${m.content.substring(0, 150)}`) 
      .join('\n');

  // 2. High-Level Stats
  const topActive = participants.slice(0, 5).map(p => `${p.name} (${p.messageCount} msgs)`).join(", ");
  const topQuiet = participants.slice(-3).map(p => p.name).join(", ");
  const topInteractions = interactionGraph?.links.slice(0, 5).map(l => `${l.source} & ${l.target}`).join(", ") || "None detected";
  const rawWords = rawWordCloud.slice(0, 60).map(w => w.text).join(", ");
  
  // 3. Pre-processed Emotion Signals (CRITICAL for "Emotional Rollercoaster")
  // Instead of asking AI to guess emotion from text, we give it the emoji stats which are much more reliable.
  const emojiSignals = topEmojis.slice(0, 30).map(e => `${e.emoji} (${e.count})`).join(", ");

  // 4. Pre-processed Link Context (CRITICAL for "Internet Rabbit Hole")
  // Instead of just URLs, we provide the URL + the message sent with it.
  const linkContext = sharedLinks 
      ? sharedLinks.slice(0, 15).map((l, i) => {
          const contextSnippets = l.context.slice(0, 2).map(c => `"${c}"`).join(" or ");
          return `${i+1}. URL: ${l.url} (Shared ${l.count}x)\n   Context: ${contextSnippets || "No context"}`;
        }).join("\n")
      : "No links shared.";

  // 5. Killer Context
  const topKiller = conversationKillers && conversationKillers.length > 0 ? conversationKillers[0] : null;
  const killerContext = topKiller ? `Message by ${topKiller.sender}: "${topKiller.content.substring(0, 100)}..." (Silence: ${topKiller.silenceDurationHours}h)` : "No killer found.";

  // 6. Peak Days
  let peakContextStr = "No peak day data.";
  if (peakDayContext && peakDayContext.length > 0) {
      peakContextStr = peakDayContext.map((p, i) => 
          `[PEAK ${i+1}] Date: "${p.date}"\nMessages: ${p.snippets.join(" | ")}`
      ).join("\n\n");
  }

  const basePrompt = `
    Analyze this WhatsApp group chat.
    STATS:
    - Active: ${topActive}
    - Quiet: ${topQuiet}
    - Pairs: ${topInteractions}
    - Words: ${rawWords}
    
    CHAT SAMPLE (First ${messages.length} msgs):
    ${messagesToAnalyze}
  `;

  const safetySettings = [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  ] as any;

  const modelConfig = {
      model: 'gemini-2.5-flash',
      config: { responseMimeType: "application/json", safetySettings }
  };

  // --- Split Prompts ---

  // 1. VIBE CHECK
  const vibePrompt = `
    You are a witty analyst creating a "Year in Review".
    ${basePrompt}
    TASKS:
    1. Summary: ONE SHORT SENTENCE (MAX 25 WORDS) summarizing the group's vibe.
    2. Poem: A funny 4-line poem about the group.
    3. Topics: List 5 main topics (one word each).
    
    Return JSON: { "summary": "...", "poem": "...", "topics": ["..."] }
  `;

  // 2. THE ROAST (Fixed for Reality Show Cast structure)
  const roastPrompt = `
    You are a casting director.
    ${basePrompt}
    AWKWARD SILENCE EVENT: ${killerContext}
    
    TASKS:
    1. Awards: 6 creative awards. Title SHORT (MAX 4 WORDS). Reason funny.
    2. Reality TV Pitch: Title, Genre, Logline.
    3. Cast: Pick 4 specific members from the "Active" or "Quiet" lists.
       For each, provide:
       - "name": Exact member name from the STATS list.
       - "archetype": Short label (e.g. "The Villain", "The Mom").
       - "role": One sentence description of their behavior.
    4. Killer Roast: Roast the awkward silence message.

    Return JSON: { 
      "awards": [{ "title": "...", "winner": "Exact Name", "reason": "..." }], 
      "realityShow": { 
        "title": "...", 
        "genre": "...", 
        "logline": "...", 
        "cast": [{ "name": "Exact Name", "archetype": "The Label", "role": "Description" }] 
      }, 
      "killerRoast": "..." 
    }
  `;

  // 3. SOCIAL DYNAMICS (Enriched with Emoji Data)
  const socialPrompt = `
    You are a sociologist.
    ${basePrompt}
    
    EMOTIONAL SIGNALS (Emoji Frequency):
    ${emojiSignals}
    
    TASKS:
    1. Relationship Analysis: Pick 4 pairs from the "Pairs" stat provided. Label dynamic (e.g. "The Rivals").
    2. Emotional Rollercoaster: Analyze the EMOJI SIGNALS above.
       Identify 4 dominant moods. 
       "score" must be 0-100 based on frequency.
       "label" must be one word (e.g., "Joy", "Cringe", "Love", "Rage").
       "emoji" must be the representative emoji.

    Return JSON: { "relationshipAnalysis": [], "emotionalProfile": [{ "emoji": "😂", "label": "Joy", "score": 90 }] }
  `;

  // 4. CONTENT & TIMELINE (Enriched with Link Context)
  const contentPrompt = `
    You are a data scientist.
    ${basePrompt}
    
    LINK ANALYSIS DATA:
    ${linkContext}
    
    TIMELINE PEAKS:
    ${peakContextStr}
    
    TASKS:
    1. Internet Rabbit Hole: Analyze the "LINK ANALYSIS DATA". Group shared links into 4 distinct content themes (e.g., "TikToks", "News", "Music", "Shopping"). 
       "percentage" is the estimated share of that theme (sum to 100).
    2. Top Links Commentary: Pick top 3 links from data. Give a funny title (MAX 5 WORDS) and short commentary based on the "Context" provided.
    3. Timeline Highlights: Label the peak dates provided in "TIMELINE PEAKS" (e.g., "The Breakup", "New Job").

    Return JSON: { "linkThemes": [{ "theme": "...", "percentage": 50 }], "topLinksCommentary": [], "timelineHighlights": [] }
  `;

  try {
    const [vibeRes, roastRes, socialRes, contentRes] = await Promise.allSettled([
        ai.models.generateContent({ ...modelConfig, contents: vibePrompt }),
        ai.models.generateContent({ ...modelConfig, contents: roastPrompt }),
        ai.models.generateContent({ ...modelConfig, contents: socialPrompt }),
        ai.models.generateContent({ ...modelConfig, contents: contentPrompt })
    ]);

    const merged = { ...fallbackInsights };
    
    const processRes = (res: PromiseSettledResult<any>) => {
        if (res.status === 'fulfilled' && res.value.text) {
            try {
                const parsed = safeJsonParse(res.value.text);
                
                // TYPE SAFETY & SANITIZATION
                if (parsed.topics && !Array.isArray(parsed.topics)) parsed.topics = [];
                if (parsed.awards && !Array.isArray(parsed.awards)) parsed.awards = [];
                if (parsed.realityShow?.cast && !Array.isArray(parsed.realityShow.cast)) parsed.realityShow.cast = [];
                if (parsed.relationshipAnalysis && !Array.isArray(parsed.relationshipAnalysis)) parsed.relationshipAnalysis = [];
                
                if (parsed.realityShow?.cast && Array.isArray(parsed.realityShow.cast)) {
                    parsed.realityShow.cast = parsed.realityShow.cast.map((c: any) => ({
                        // Robust fallback for name to prevent "Unknown"
                        name: c.name || c.member || c.actor || c.person || "Unknown",
                        role: c.role || c.description || "Member",
                        archetype: c.archetype || c.label || "Participant" 
                    }));
                }

                if (parsed.linkThemes && Array.isArray(parsed.linkThemes)) {
                    parsed.linkThemes = parsed.linkThemes.map((t: any) => ({
                        ...t,
                        percentage: sanitizeNumber(t.percentage || t.value || t.count || t.score)
                    }));
                } else if (parsed.linkThemes) {
                    parsed.linkThemes = [];
                }

                if (parsed.emotionalProfile && Array.isArray(parsed.emotionalProfile)) {
                    parsed.emotionalProfile = parsed.emotionalProfile.map((e: any) => ({
                        emoji: e.emoji || "😐",
                        label: e.label || "Mood",
                        score: sanitizeNumber(e.score || e.value)
                    }));
                } else if (parsed.emotionalProfile) {
                    parsed.emotionalProfile = [];
                }
                
                if (parsed.timelineHighlights && !Array.isArray(parsed.timelineHighlights)) parsed.timelineHighlights = [];
                
                if (parsed.topLinksCommentary && Array.isArray(parsed.topLinksCommentary)) {
                    parsed.topLinksCommentary = parsed.topLinksCommentary.map((c: any) => ({
                        ...c,
                        commentary: c.commentary && c.commentary.trim().length > 0 ? c.commentary : ""
                    }));
                } else if (parsed.topLinksCommentary) {
                    parsed.topLinksCommentary = [];
                }
                
                Object.assign(merged, parsed);
            } catch (e) { 
                console.error("Parse error in chunk", e); 
            }
        }
    };

    processRes(vibeRes);
    processRes(roastRes);
    processRes(socialRes);
    processRes(contentRes);

    // Data Alignment for Highlights
    if (merged.timelineHighlights && Array.isArray(merged.timelineHighlights) && peakDayContext && peakDayContext.length > 0) {
        const alignedHighlights = peakDayContext.map((peak, index) => {
            const found = merged.timelineHighlights?.find(h => h.date === peak.date) || merged.timelineHighlights?.[index];
            return { date: peak.date, label: found?.label || "Big Day" };
        });
        merged.timelineHighlights = alignedHighlights;
    } else if (peakDayContext && peakDayContext.length > 0) {
        merged.timelineHighlights = peakDayContext.map(p => ({ date: p.date, label: "Peak Activity" }));
    }

    return merged;

  } catch (error) {
    console.error("Gemini Error:", error);
    return fallbackInsights;
  }
};
