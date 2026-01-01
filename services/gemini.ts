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
    // 3. Attempt to fix unquoted keys: { key: "value" } -> { "key": "value" }
    // This handles cases where the AI forgets quotes around keys
    try {
        const fixed = clean.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        return JSON.parse(fixed);
    } catch (e2) {
        throw e; // Throw original error if fix fails
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

export const analyzeWithGemini = async (
  messages: Message[], 
  participants: ParticipantStats[],
  rawWordCloud: { text: string; value: number }[],
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

  // --- Context Construction (Shared across all requests) ---
  const messagesToAnalyze = messages
      .map(m => `${m.sender}: ${m.content.substring(0, 200)}`) 
      .join('\n');

  const participantNames = participants.slice(0, 15).map(p => p.name).join(", ");
  const rawWords = rawWordCloud.slice(0, 60).map(w => w.text).join(", ");
  
  const topKiller = conversationKillers && conversationKillers.length > 0 ? conversationKillers[0] : null;
  const killerContext = topKiller ? `Message by ${topKiller.sender}: "${topKiller.content.substring(0, 100)}..." (Silence: ${topKiller.silenceDurationHours}h)` : "No killer found.";

  const topLinks = sharedLinks ? sharedLinks.slice(0, 15).map(l => `${l.url} (${l.count}x)`).join(", ") : "No links.";
  
  let peakContextStr = "No peak day data.";
  if (peakDayContext && peakDayContext.length > 0) {
      peakContextStr = peakDayContext.map((p, i) => 
          `[PEAK ${i+1}] Date: "${p.date}"\nMessages: ${p.snippets.join(" | ")}`
      ).join("\n\n");
  }

  const basePrompt = `
    Data provided:
    - Active Members: ${participantNames}
    - Obsessed Words: ${rawWords}
    - Awkward Silence Caused By: ${killerContext}
    - Viral Links: ${topLinks}
    
    TIMELINE CONTEXT:
    ${peakContextStr}
    
    CHAT HISTORY SAMPLE:
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

  // --- 4 Split Prompts (Updated to enforce strict JSON syntax) ---

  // 1. VIBE CHECK (Summary, Poem, Topics)
  const vibePrompt = `
    You are a witty analyst creating a "Year in Review".
    ${basePrompt}
    TASKS:
    1. Summary: EXACTLY ONE SHORT SENTENCE (MAX 25 WORDS) summarizing the group's specific vibe. Do not write a paragraph.
    2. Poem: A short, funny 4-line poem about the group.
    3. Topics: List 5 main topics discussed (one word each).
    
    Return a valid JSON object with keys: "summary", "poem", "topics".
    Example: { "summary": "...", "poem": "...", "topics": ["..."] }
  `;

  // 2. THE ROAST (Awards, Reality TV, Killer Roast)
  const roastPrompt = `
    You are a casting director and comedian.
    ${basePrompt}
    TASKS:
    1. Awards: 6 creative awards. Title must be SHORT (MAX 4 WORDS). Reason must be funny.
    2. Reality TV Pitch: 
       - Title: Punny and SHORT (MAX 5 WORDS).
       - Genre: e.g. "True Crime".
       - Logline: MAX 15 WORDS.
       - Cast: 4 members. For each provide keys: "name", "role" (e.g. The Villain), "archetype" (e.g. The Schemer).
    3. Killer Roast: Roast the "Awkward Silence" message. MAX 20 WORDS.

    Return a valid JSON object with keys: "awards", "realityShow", "killerRoast".
    Structure for realityShow.cast: [{ "name": "...", "role": "...", "archetype": "..." }]
    Example: { "awards": [], "realityShow": { "title": "...", "cast": [{"name": "X", "role": "Y", "archetype": "Z"}] }, "killerRoast": "..." }
  `;

  // 3. SOCIAL DYNAMICS (Relationships, Emotions)
  const socialPrompt = `
    You are a sociologist.
    ${basePrompt}
    TASKS:
    1. Relationship Analysis: Pick 4 pairs of people who interact often. Label their dynamic (e.g. "The Rivals"). Description MAX 10 WORDS.
    2. Emotional Rollercoaster: 4 dominant emotions in the chat.
       For each provide keys: "emoji" (single char), "label" (one word), "score" (0-100).

    Return a valid JSON object with keys: "relationshipAnalysis", "emotionalProfile".
    Structure for emotionalProfile: [{ "emoji": "😍", "label": "Love", "score": 90 }]
    Example: { "relationshipAnalysis": [], "emotionalProfile": [{ "emoji": "...", "label": "...", "score": 10 }] }
  `;

  // 4. CONTENT & TIMELINE (Links, Highlights)
  const contentPrompt = `
    You are a data scientist.
    ${basePrompt}
    TASKS:
    1. Internet Rabbit Hole: Group shared links into 4 distinct content themes.
    2. Top Links Commentary: For top 3 links, give a funny title (MAX 5 WORDS) and comment (MAX 10 WORDS).
    3. Timeline Highlights: For the peak dates provided, give a funny label (MAX 3 WORDS).

    Return a valid JSON object with keys: "linkThemes", "topLinksCommentary", "timelineHighlights".
    Example: { "linkThemes": [], "topLinksCommentary": [], "timelineHighlights": [] }
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
                // 1. Arrays must be arrays
                if (parsed.topics && !Array.isArray(parsed.topics)) parsed.topics = [];
                if (parsed.awards && !Array.isArray(parsed.awards)) parsed.awards = [];
                if (parsed.realityShow?.cast && !Array.isArray(parsed.realityShow.cast)) parsed.realityShow.cast = [];
                if (parsed.relationshipAnalysis && !Array.isArray(parsed.relationshipAnalysis)) parsed.relationshipAnalysis = [];
                
                // 2. Deep Sanitization for complex objects (Prevent undefined crashes)
                if (parsed.realityShow?.cast && Array.isArray(parsed.realityShow.cast)) {
                    parsed.realityShow.cast = parsed.realityShow.cast.map((c: any) => ({
                        name: c.name || "Unknown",
                        role: c.role || "Member",
                        archetype: c.archetype || "Participant" // Fallback to prevent crash
                    }));
                }

                if (parsed.linkThemes && Array.isArray(parsed.linkThemes)) {
                    parsed.linkThemes = parsed.linkThemes.map((t: any) => ({
                        ...t,
                        // Fallback check: AI sometimes calls it 'value', 'count', or 'score'
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
                        // Leave empty if missing so UI can hide it
                        commentary: c.commentary && c.commentary.trim().length > 0 ? c.commentary : ""
                    }));
                } else if (parsed.topLinksCommentary) {
                    parsed.topLinksCommentary = [];
                }
                
                Object.assign(merged, parsed);
            } catch (e) { 
                console.error("Parse error in chunk", e); 
                // Only log the first 100 chars
                console.log("Failed text start:", res.value.text.substring(0, 100));
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