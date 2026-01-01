
import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { parseChatAsync, generateFileHash } from './services/parser';
import { analyzeWithGemini } from './services/gemini';
import { ChatAnalysis, AIInsights, AppState } from './types';
import confetti from 'canvas-confetti';

// Aggressively bumped version to force refresh
const CACHE_VERSION = 'v7.8_deep_analysis_fix';

const FALLBACK_INSIGHTS: AIInsights = {
  summary: "The chat was too legendary for the AI (Timeout), but your stats are ready!",
  sentimentTrend: [],
  emotionalProfile: [{ emoji: "🤖", label: "Overloaded", score: 100 }],
  awards: [{ title: "The Mystery", winner: "Everyone", reason: "AI couldn't decide in time." }],
  poem: "The server timed out,\nBut have no doubt,\nYour chat is epic,\nThat's what it's about.",
  topics: ["Mystery", "Data"],
  realityShow: { title: "Unscripted", genre: "Documentary", logline: "Raw footage only - the AI needed a coffee break.", cast: [] },
  killerRoast: "This chat is so active it broke the robot.",
  linkThemes: [],
  topLinksCommentary: [],
  timelineHighlights: []
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<ChatAnalysis | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Clear old cache versions to prevent storage bloat
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('chat_data_') || key.startsWith('chat_insights_'))) {
          if (!key.includes(CACHE_VERSION)) {
            keysToRemove.push(key);
          }
        }
      }
      if (keysToRemove.length > 0) {
        console.log(`Busting cache: Removing ${keysToRemove.length} old entries`);
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn("Failed to clean old caches", e);
    }
  }, []);

  const handleFileLoaded = async (text: string, isAnonymized: boolean, forceRefresh: boolean) => {
    setAppState(AppState.PARSING);
    
    const fileHash = generateFileHash(text + (isAnonymized ? '_anon' : ''));
    const cacheKeyData = `chat_data_${fileHash}_${CACHE_VERSION}`;
    const cacheKeyInsights = `chat_insights_${fileHash}_${CACHE_VERSION}`;
    
    const cachedData = !forceRefresh ? localStorage.getItem(cacheKeyData) : null;
    const cachedInsights = !forceRefresh ? localStorage.getItem(cacheKeyInsights) : null;

    let parsedData: ChatAnalysis;
    let dataLoadedFromCache = false;

    if (cachedData) {
      try {
        parsedData = JSON.parse(cachedData);
        if (!parsedData.participants || !parsedData.viralMessages) throw new Error("Invalid cache");
        
        console.log("Using cached analysis");
        // Revive dates
        parsedData.dateRange.start = new Date(parsedData.dateRange.start);
        parsedData.dateRange.end = new Date(parsedData.dateRange.end);
        parsedData.viralMessages.forEach(m => m.date = new Date(m.date));
        if (parsedData.messageSample) {
            parsedData.messageSample.forEach(m => m.date = new Date(m.date));
        }
        dataLoadedFromCache = true;
      } catch (e) {
        console.warn("Cache invalid or corrupt, parsing fresh:", e);
        parsedData = await parseChatAsync(text, isAnonymized);
        localStorage.removeItem(cacheKeyData);
      }
    } else {
      console.log(forceRefresh ? "Force refreshing: Parsing fresh data" : "Parsing fresh data");
      parsedData = await parseChatAsync(text, isAnonymized);
    }

    if (!dataLoadedFromCache) {
      try {
        localStorage.setItem(cacheKeyData, JSON.stringify(parsedData));
      } catch (e) {
        console.warn("Storage full, cannot cache data");
      }
    }

    setData(parsedData);
    setAppState(AppState.ANALYZING_AI);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#EC4899', '#10B981']
    });

    if (cachedInsights && dataLoadedFromCache) {
      try {
        console.log("Using cached AI insights");
        setInsights(JSON.parse(cachedInsights));
        setLoadingAI(false);
        setAppState(AppState.READY);
      } catch (e) {
         setLoadingAI(true);
         fetchAI(parsedData, cacheKeyInsights);
      }
    } else {
      setLoadingAI(true);
      fetchAI(parsedData, cacheKeyInsights);
    }
  };

  const fetchAI = (parsedData: ChatAnalysis, cacheKey: string) => {
    const messagesToAnalyze = parsedData.messageSample || parsedData.viralMessages || [];
    
    // Increased to 120s (2 minutes) to accommodate large generative tasks
    const timeoutPromise = new Promise<AIInsights>((_, reject) => {
        setTimeout(() => reject(new Error("AI Analysis Timeout")), 120000);
    });

    const aiPromise = analyzeWithGemini(
      messagesToAnalyze, 
      parsedData.participants, 
      parsedData.wordCloud,
      parsedData.topEmojis, // NEW: Passing topEmojis for better emotional analysis
      parsedData.peakDayContext,
      parsedData.sharedLinks,
      parsedData.domainStats,
      parsedData.interactionGraph,
      parsedData.conversationKillers
    );

    Promise.race([aiPromise, timeoutPromise])
    .then(aiResult => {
      setInsights(aiResult);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(aiResult));
      } catch(e) {}
    })
    .catch(err => {
      console.error("AI Fetch Error:", err);
      // Fallback insights so the user isn't stuck with a broken dashboard
      setInsights(FALLBACK_INSIGHTS);
    })
    .finally(() => {
      setLoadingAI(false);
      setAppState(AppState.READY);
    });
  }

  return (
    <div className="min-h-screen bg-festive-bg text-white font-sans selection:bg-festive-secondary selection:text-white">
      {appState === AppState.IDLE && (
        <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="z-10 text-center space-y-4">
            <h1 className="text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-festive-primary to-festive-secondary filter drop-shadow-lg">
              ChatWrap
            </h1>
            <p className="text-xl text-gray-300 max-w-md mx-auto">
              Unwrap your year in messages. Insights, laughs, and memories powered by Gemini AI.
            </p>
            <FileUpload onFileLoaded={handleFileLoaded} />
          </div>
        </div>
      )}

      {(appState === AppState.PARSING || appState === AppState.ANALYZING_AI || appState === AppState.READY) && data && (
        <Dashboard data={data} insights={insights} loadingAI={loadingAI} />
      )}
    </div>
  );
};

export default App;
