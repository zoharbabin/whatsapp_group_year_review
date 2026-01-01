export interface Message {
  date: Date;
  sender: string;
  content: string;
  isMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'sticker' | 'unknown';
}

export interface SharedLink {
  url: string;
  domain: string;
  count: number;
  topSender: string;
  context: string[]; // Snippets of text sent with the link
}

export interface ParticipantStats {
  name: string;
  messageCount: number;
  wordCount: number;
  mediaCount: number;
  reactionScore: number;
  topEmojis: { [emoji: string]: number };
  // New Metrics
  avgReplyTimeSeconds: number; // "Ghostiness"
  avgBurstLength: number; // "Spamminess"
  conversationKills: number; // How many times they silenced the chat
}

export interface InteractionLink {
  source: string;
  target: string;
  weight: number;
}

export interface InteractionGraph {
  nodes: string[];
  links: InteractionLink[];
}

export interface ConversationKiller {
  sender: string;
  content: string;
  date: Date;
  silenceDurationHours: number;
}

export interface ChatAnalysis {
  chatName: string;
  totalMessages: number;
  dateRange: { start: Date; end: Date };
  participants: ParticipantStats[];
  timelineData: { date: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
  wordCloud: { text: string; value: number }[];
  topEmojis: { emoji: string; count: number }[];
  mediaStats: { type: string; count: number }[];
  sharedLinks: SharedLink[];
  domainStats: { domain: string; count: number }[];
  viralMessages: Message[];
  messageSample?: Message[];
  peakDayContext?: { date: string; snippets: string[] }[];
  interactionGraph: InteractionGraph;
  // New Data
  conversationKillers: ConversationKiller[]; // Messages that stopped the chat
}

export interface RealityShow {
  title: string;
  genre: string;
  logline: string;
  cast: { name: string; role: string; archetype: string }[];
}

export interface AIInsights {
  summary: string;
  sentimentTrend: { label: string; score: number }[];
  emotionalProfile?: { emoji: string; label: string; score: number }[];
  awards: { title: string; winner: string; reason: string }[];
  poem: string;
  topics: string[];
  wordCloud?: { text: string; value: number }[];
  timelineHighlights?: { date: string; label: string }[];
  linkThemes?: { theme: string; percentage: number; description: string }[];
  topLinksCommentary?: { url: string; title: string; commentary: string }[];
  relationshipAnalysis?: { pair: string; dynamic: string; description: string }[];
  // New AI Data
  realityShow?: RealityShow;
  killerRoast?: string; // Commentary on why a specific message killed the chat
}

export enum AppState {
  IDLE,
  PARSING,
  ANALYZING_LOCAL,
  ANALYZING_AI,
  READY,
  ERROR
}