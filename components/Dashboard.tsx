import React, { useState, useEffect, useRef } from 'react';
import { ChatAnalysis, AIInsights } from '../types';
import StatCard from './StatCard';
import TimelineChart from './TimelineChart';
import WordCloud from './WordCloud';
import RelationshipGraph from './RelationshipGraph';
import ResponseStyleChart from './ResponseStyleChart';
import { MessageSquare, Users, Image as ImageIcon, TrendingUp, Award, Quote, Zap, Clock, Link as LinkIcon, ExternalLink, Download, Share2, Tv, Skull, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { downloadResults } from '../services/exporter';

interface DashboardProps {
  data: ChatAnalysis;
  insights: AIInsights | null;
  loadingAI: boolean;
}

const COLORS = ['#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6', '#6366f1'];

const SafeChartContainer: React.FC<{ children: React.ReactElement; height?: string | number; className?: string }> = ({ children, height = "100%", className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) setDims({ width: clientWidth, height: clientHeight });
      }
    };
    updateDims();
    const ro = new ResizeObserver((entries) => { window.requestAnimationFrame(() => { if (!entries.length) return; updateDims(); }); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={containerRef} className={`w-full relative ${className}`} style={{ height }}>
      {dims.width > 0 && dims.height > 0 ? React.cloneElement(children as React.ReactElement<any>, { width: dims.width, height: dims.height }) : <div className="absolute inset-0 flex items-center justify-center text-slate-700/50 text-xs animate-pulse">Loading visualization...</div>}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data, insights, loadingAI }) => {
  if (!data) return null;
  const participants = data.participants || [];
  const mediaStats = data.mediaStats || [];
  const conversationKillers = data.conversationKillers || [];

  // Determine valid data for link themes chart
  let linkThemeData = [];
  if (Array.isArray(insights?.linkThemes) && insights!.linkThemes.length > 0) {
      // Filter out zero-values to avoid Recharts glitches
      linkThemeData = insights!.linkThemes.filter(t => t.percentage > 0);
  }
  // Fallback to domain stats if AI returned nothing usable
  if (linkThemeData.length === 0) {
      linkThemeData = data.domainStats.slice(0, 5).map(d => ({ theme: d.domain, percentage: d.count }));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="col-span-full mb-4 text-center relative group">
        <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-festive-primary to-festive-secondary mb-4 tracking-tight drop-shadow-sm">{data.chatName} Wrapped</h1>
        <button onClick={() => downloadResults(data, insights)} className="absolute top-0 right-0 p-3 bg-slate-800 hover:bg-festive-primary text-gray-300 hover:text-white rounded-full transition-all shadow-lg hover:shadow-festive-primary/50 group-hover:scale-110" title="Save as HTML"><Download size={20} /></button>
        <div className="min-h-[4rem] flex items-center justify-center">
          {loadingAI ? <div className="animate-pulse h-8 bg-slate-700/50 rounded w-1/2"></div> : <p className="text-2xl font-bold text-white max-w-3xl mx-auto leading-relaxed px-4">"{insights?.summary || "Analyzing..."}"</p>}
        </div>
      </div>

      {/* FEATURE 2: Reality TV Pitch (Top Feature) */}
      <StatCard title="Coming This Fall to Netflix" icon={<Tv />} className="col-span-full bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-pink-500/30">
        {loadingAI ? <div className="animate-pulse h-32 bg-slate-700/50 rounded"></div> : (
          <div className="flex flex-col md:flex-row gap-6 items-center p-2">
            <div className="flex-1 text-center md:text-left">
               <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.5)' }}>{insights?.realityShow?.title || "THE GROUP CHAT"}</h2>
               <div className="inline-block bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 uppercase">{insights?.realityShow?.genre || "Drama"}</div>
               <p className="text-gray-300 italic text-lg">"{insights?.realityShow?.logline}"</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
               {(Array.isArray(insights?.realityShow?.cast) ? insights!.realityShow!.cast : []).map((c, i) => (
                 <div key={i} className="bg-black/30 p-3 rounded border border-white/10">
                    <div className="font-bold text-festive-primary text-sm">{c.name}</div>
                    <div className="text-xs text-gray-400">The {(c.archetype || "Member").replace(/^The\s+/i, '')}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{c.role || "Participant"}</div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </StatCard>

      {/* Row 2: Basic Stats (4 cols) */}
      <StatCard title="Total Messages" value={data.totalMessages?.toLocaleString()} icon={<MessageSquare />} delay={0.1} />
      <StatCard title="Active Members" value={participants.length} icon={<Users />} delay={0.2} />
      <StatCard title="Media Shared" value={mediaStats.reduce((a, b) => a + b.count, 0)} icon={<ImageIcon />} delay={0.3} />
      <StatCard title="Peak Time" value={data.hourlyActivity.reduce((p, c) => (p.count > c.count ? p : c), { hour: 0, count: 0 }).hour + ":00"} icon={<Clock />} delay={0.4} />

      {/* Row 3: Timeline (Full Width for visibility) */}
      <StatCard title="Chat Activity & Highlights" className="col-span-full h-96" icon={<TrendingUp />} delay={0.5}>
         <div className="h-full pt-2"><TimelineChart data={data.timelineData} highlights={insights?.timelineHighlights} /></div>
      </StatCard>

      {/* Internet Rabbit Hole & Top Links */}
      <StatCard title="The Internet Rabbit Hole" icon={<LinkIcon />} className="col-span-full lg:col-span-2 h-[26rem]" delay={0.6}>
        <div className="h-full flex flex-col relative">
           <h4 className="text-xs font-bold text-center text-gray-500 mb-2 tracking-widest uppercase">OVERALL CONTENT THEMES</h4>
           <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
             <div className="w-48 h-48 relative flex-shrink-0 flex items-center justify-center">
                 {/* Explicit width/height to avoid flexbox collapse issues with charts */}
                 <PieChart width={192} height={192}>
                    <Pie 
                      data={linkThemeData} 
                      dataKey="percentage" 
                      nameKey="theme"
                      cx="50%" 
                      cy="50%"
                      innerRadius={40} 
                      outerRadius={80} 
                      stroke="none"
                    >
                      {linkThemeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                 </PieChart>
             </div>
             <div className="flex flex-col justify-center gap-2 p-4">
                {linkThemeData.slice(0, 5).map((theme, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-sm font-medium text-gray-300 line-clamp-1">{theme.theme}</span>
                  </div>
                ))}
             </div>
           </div>
           
           <div className="mt-4 border-t border-slate-700/50 pt-2">
              <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">TOP LINKS (SCROLL FOR MORE)</h4>
              <div className="overflow-y-auto max-h-32 scrollbar-hide space-y-2">
                 {(Array.isArray(insights?.topLinksCommentary) && insights!.topLinksCommentary.length > 0 ? insights!.topLinksCommentary : (data.sharedLinks.slice(0, 3).map(l => ({ url: l.url, title: l.domain, commentary: `Shared ${l.count} times` })))).map((link, i) => (
                    <div key={i} className="bg-slate-800/80 p-3 rounded border border-slate-700 hover:border-festive-primary/50 transition-colors group/link relative">
                       <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 text-gray-500 hover:text-white"><ExternalLink size={14} /></a>
                       <div className="font-bold text-festive-primary text-sm pr-6 truncate">{link.title}</div>
                       {link.commentary && <div className="text-xs text-gray-400 italic">"{link.commentary}"</div>}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </StatCard>

      <StatCard title="Emotional Rollercoaster" className="col-span-full lg:col-span-2 h-[26rem]" delay={0.7}>
        <div className="h-full flex flex-col justify-center gap-6 p-4">
           {(Array.isArray(insights?.emotionalProfile) ? insights!.emotionalProfile : []).map((emotion, i) => (
             <div key={i} className="relative">
                <div className="flex justify-between items-end mb-1">
                   <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-md">{emotion.emoji || "🙂"}</span>
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{emotion.label || "Mood"}</span>
                   </div>
                   <span className="text-2xl font-bold text-gray-300">{emotion.score}</span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
                   <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${emotion.score}%`, 
                        backgroundColor: COLORS[i % COLORS.length],
                        boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}40`
                      }} 
                   />
                </div>
             </div>
           ))}
           {!insights?.emotionalProfile && <div className="text-center text-gray-500">Calculating vibes...</div>}
        </div>
      </StatCard>

      {/* Row 4: Social Dynamics (Ghost Matrix + Yap List) */}
      <StatCard title="Ghost vs. Spammer Matrix" icon={<Activity />} className="lg:col-span-3 h-[28rem]" delay={0.5}>
         <ResponseStyleChart participants={participants} />
      </StatCard>

      <StatCard title="Yap-O-Meter" className="lg:col-span-1 h-[28rem]" delay={0.6}>
        <div className="space-y-4 mt-2 overflow-y-auto max-h-[24rem] scrollbar-hide pr-2">
          {participants.slice(0, 15).map((p, i) => (
            <div key={p.name} className="flex items-center justify-between group hover:bg-slate-800/50 p-1 rounded transition-colors">
              <div className="flex items-center gap-3">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>{i + 1}</span>
                <span className="font-medium truncate max-w-[120px] text-sm">{p.name}</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">{p.messageCount}</span>
            </div>
          ))}
        </div>
      </StatCard>

      {/* Row 5: Relationships & Media */}
      <StatCard title="The Connection Web" icon={<Share2 />} className="lg:col-span-3 h-96" delay={0.7}>
         {data.interactionGraph ? <RelationshipGraph graph={data.interactionGraph} commentary={Array.isArray(insights?.relationshipAnalysis) ? insights!.relationshipAnalysis : []} /> : <div className="text-gray-500 flex items-center justify-center h-full">Not enough data</div>}
      </StatCard>

      <StatCard title="Media Diet" className="lg:col-span-1 h-96" delay={0.6}>
        <div className="h-full flex flex-col">
          <div className="h-48 w-full flex-shrink-0 relative">
            <SafeChartContainer>
              <PieChart>
                <Pie data={mediaStats} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="count" stroke="none">
                  {mediaStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none' }} />
              </PieChart>
            </SafeChartContainer>
          </div>
          <div className="flex justify-center gap-2 text-xs text-gray-400 flex-wrap mt-2 overflow-y-auto max-h-32 scrollbar-hide">
            {mediaStats.map((stat, i) => (
              <div key={stat.type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                <span className="capitalize">{stat.type}</span>
              </div>
            ))}
          </div>
        </div>
      </StatCard>

      {/* Row 6: The "Bad" Stuff & Awards */}
      <StatCard title="The Conversation Killer" icon={<Skull />} className="lg:col-span-2 h-80 border-red-900/30 bg-gradient-to-b from-slate-900 to-red-950/20" delay={0.8}>
         <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pr-2">
            {conversationKillers.length > 0 ? (
               <>
                 <div className="mb-4 flex-shrink-0">
                    <div className="text-xs text-red-400 font-bold uppercase mb-1">Most awkward silence caused by</div>
                    <div className="text-xl text-white font-black">{conversationKillers[0].sender}</div>
                    <div className="text-sm text-gray-500">{conversationKillers[0].silenceDurationHours} hours of silence</div>
                 </div>
                 
                 <div className="bg-black/40 p-4 rounded border-l-2 border-red-500 mb-4 italic text-gray-300 text-sm relative flex-shrink-0">
                    <Quote size={12} className="absolute top-2 left-2 text-red-500 opacity-50" />
                    <span className="pl-4 block leading-relaxed">"{conversationKillers[0].content}"</span>
                 </div>

                 {loadingAI ? <div className="animate-pulse h-20 bg-slate-800 rounded flex-shrink-0"></div> : (
                     <div className="bg-red-900/20 p-3 rounded text-xs text-red-200 border border-red-500/20 flex-shrink-0">
                        <span className="font-bold uppercase text-[10px] mb-1 block opacity-70">AI Roast:</span>
                        {insights?.killerRoast}
                     </div>
                 )}
               </>
            ) : <div className="text-center text-gray-500 mt-10">This group talks too much. No awkward silences found!</div>}
         </div>
      </StatCard>

      <StatCard title="Hall of Shame" icon={<Award />} className="lg:col-span-2 h-80" delay={1.1}>
        {loadingAI ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-700/50 rounded"></div>)}</div> : (
          <div className="grid grid-cols-1 gap-3 overflow-y-auto h-full scrollbar-hide pr-1 pb-2 content-start">
            {(Array.isArray(insights?.awards) ? insights!.awards : []).map((award, i) => (
              <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-festive-primary/50 transition-colors">
                <div className="flex items-center gap-2 mb-1"><Award size={14} className="text-festive-primary" /><span className="text-festive-primary text-xs font-black uppercase tracking-wider">{award.title}</span></div>
                <div className="font-bold text-white text-lg">{award.winner}</div>
                <div className="text-sm text-gray-400 italic">"{award.reason}"</div>
              </div>
            ))}
          </div>
        )}
      </StatCard>

      {/* Row 7: Content & Poem */}
      <StatCard title="Group Obsessions" className="col-span-full h-80" delay={0.9}>
        <WordCloud words={(!loadingAI && insights?.wordCloud) ? insights.wordCloud : data.wordCloud} />
      </StatCard>

      <StatCard title="The Epic Saga" icon={<Quote />} className="col-span-full bg-gradient-to-br from-slate-800 to-indigo-900/80 border-indigo-500/30 h-64" delay={1.3}>
         {loadingAI ? <div className="animate-pulse h-24 bg-slate-700/50 rounded mt-4"></div> : (
           <div className="h-full flex flex-col justify-center items-center overflow-y-auto scrollbar-hide">
             <div className="text-center italic font-serif text-lg leading-loose text-indigo-100 px-6 max-w-3xl">
               {insights?.poem ? insights.poem.split('\n').map((line, i) => <div key={i}>{line}</div>) : <div className="text-gray-400 text-sm">The poets are silent...</div>}
             </div>
           </div>
         )}
      </StatCard>
    </div>
  );
};

export default Dashboard;