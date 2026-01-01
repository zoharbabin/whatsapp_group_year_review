import { ChatAnalysis, AIInsights } from '../types';
import { generateFestiveImage } from './gemini';

export const downloadResults = async (data: ChatAnalysis, insights: AIInsights | null) => {
  // Generate a festive cover image before creating the HTML
  let coverImageBase64 = null;
  if (insights && insights.summary) {
    try {
        coverImageBase64 = await generateFestiveImage(insights.summary, data.chatName);
    } catch (e) {
        console.warn("Could not generate cover image", e);
    }
  }

  const htmlContent = generateHTML(data, insights, coverImageBase64);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Ensure the download filename matches the unique slug logic used in OG:URL
  const filename = `${data.chatName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_wrapped.html`;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const generateHTML = (data: ChatAnalysis, insights: AIInsights | null, coverImage: string | null) => {
  // Safe serialization for script injection
  const safeData = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const safeInsights = JSON.stringify(insights).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const title = `${data.chatName} - Year in Review`;
  const description = insights?.summary || `Check out our group chat wrapped statistics! ${data.totalMessages} messages sent.`;

  // Static OG Image configuration as requested
  const ogImageUrl = "https://zoharbabin.github.io/whatsapp_group_year_review/bgimg.jpg";
  
  // Unique URL generation based on chat name
  const uniqueFilename = `${data.chatName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_wrapped.html`;
  const ogUrl = `https://zoharbabin.github.io/whatsapp_group_year_review/${uniqueFilename}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  
  <!-- SEO & Open Graph Metadata -->
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  
  <!-- Static Image Configuration -->
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:image:alt" content="${title}" />
  
  <!-- Unique URL Configuration -->
  <meta property="og:url" content="${ogUrl}" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            festive: {
              bg: '#0F172A',
              card: '#1E293B',
              primary: '#F59E0B',
              secondary: '#EC4899',
              accent: '#10B981',
            }
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/prop-types/prop-types.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { background-color: #0F172A; color: #F8FAFC; font-family: 'Inter', sans-serif; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .glass-panel { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.ANALYSIS_DATA = ${safeData};
    window.AI_INSIGHTS = ${safeInsights};
    window.COVER_IMAGE = "${coverImage || ''}";
  </script>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;
    const { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Scatter, ScatterChart, PieChart, Pie, Cell, Legend, ReferenceLine } = window.Recharts;

    const Icons = {
      MessageSquare: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
      TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
      Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      Award: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
      Quote: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>,
      Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      Link: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
      Share2: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
      Tv: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
      Skull: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>,
      Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      ExternalLink: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    };

    const StatCard = ({ title, value, subtitle, icon, children, className = "" }) => (
      <div className={"glass-panel rounded-xl p-6 relative overflow-hidden group hover:bg-opacity-80 transition-all flex flex-col " + className}>
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
          <div>
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
            {value && <div className="text-3xl font-bold text-white mt-1">{value}</div>}
            {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          </div>
          {icon && <div className="text-festive-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{icon}</div>}
        </div>
        <div className="relative z-10 flex-1 min-h-0 w-full flex flex-col">{children}</div>
      </div>
    );

    const SafeChartContainer = ({ children, height = "100%", className = "" }) => {
        const containerRef = useRef(null);
        const [dims, setDims] = useState({ width: 0, height: 0 });
        useEffect(() => {
            if (!containerRef.current) return;
            const updateDims = () => { if (containerRef.current) { const { clientWidth, clientHeight } = containerRef.current; if (clientWidth > 0 && clientHeight > 0) setDims({ width: clientWidth, height: clientHeight }); } };
            updateDims();
            const ro = new ResizeObserver((entries) => { window.requestAnimationFrame(() => { if (!entries.length) return; updateDims(); }); });
            ro.observe(containerRef.current);
            return () => ro.disconnect();
        }, []);
        return ( <div ref={containerRef} className={"w-full relative " + className} style={{ height }}> {dims.width > 0 && dims.height > 0 ? React.cloneElement(children, { width: dims.width, height: dims.height }) : <div className="absolute inset-0 flex items-center justify-center text-slate-700/50 text-xs animate-pulse">Loading visualization...</div>} </div> );
    };

    const ResponseStyleChart = ({ participants }) => {
        const containerRef = useRef(null);
        const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

        useEffect(() => {
          if (!containerRef.current) return;
          const updateDimensions = () => { 
            if (containerRef.current) { 
              const { clientWidth, clientHeight } = containerRef.current; 
              if (clientWidth > 0 && clientHeight > 0) setDimensions({ width: clientWidth, height: clientHeight }); 
            } 
          };
          updateDimensions();
          const resizeObserver = new ResizeObserver((entries) => { window.requestAnimationFrame(() => { if (!entries.length) return; updateDimensions(); }); });
          resizeObserver.observe(containerRef.current);
          return () => resizeObserver.disconnect();
        }, []);

        const data = participants.filter(p => p.messageCount > 10).map(p => ({ name: p.name, x: p.avgReplyTimeSeconds, y: p.avgBurstLength, z: p.messageCount }));
        if (data.length === 0) return <div className="text-gray-500">Not enough data</div>;
        const maxX = Math.max(...data.map(d => d.x)) * 1.1; const maxY = Math.max(...data.map(d => d.y)) * 1.1; const midX = maxX / 2; const midY = maxY / 2;
        
        const CustomTooltip = ({ active, payload }) => { if (active && payload && payload.length) { const d = payload[0].payload; return <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl text-xs z-50"><p className="font-bold text-festive-primary mb-1">{d.name}</p><p className="text-gray-300">Burstiness: {d.y.toFixed(2)} msgs/row</p><p className="text-gray-300">Avg Reply: {(d.x / 60).toFixed(1)} mins</p></div>; } return null; };
        
        return (
            <div ref={containerRef} className="w-full h-full relative min-h-[300px]">
                <div className="absolute top-4 left-4 text-[10px] font-bold text-pink-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE PANIC POSTER<br/>(Fast + Many)</div>
                <div className="absolute top-4 right-4 text-[10px] font-bold text-blue-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE STORYTELLER<br/>(Slow + Paragraphs)</div>
                <div className="absolute bottom-10 left-4 text-[10px] font-bold text-green-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE ONE-WORDER<br/>(Fast + Short)</div>
                <div className="absolute bottom-10 right-4 text-[10px] font-bold text-gray-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE GHOST<br/>(Slow + Short)</div>
                
                {dimensions.width > 0 && dimensions.height > 0 ? (
                    <ScatterChart width={dimensions.width} height={dimensions.height} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Latency" unit="s" tick={false} axisLine={{ stroke: '#475569' }} domain={[0, maxX]} />
                        <YAxis type="number" dataKey="y" name="Burstiness" tick={false} axisLine={{ stroke: '#475569' }} domain={[0, maxY]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine x={midX} stroke="#334155" strokeDasharray="3 3" />
                        <ReferenceLine y={midY} stroke="#334155" strokeDasharray="3 3" />
                        <Scatter name="Participants" data={data} fill="#8884d8">
                            {data.map((entry, index) => <Cell key={index} fill={['#F59E0B', '#EC4899', '#10B981', '#3B82F6'][index % 4]} />)}
                            <LabelList dataKey="name" position="top" style={{ fill: '#94a3b8', fontSize: '10px' }} />
                        </Scatter>
                    </ScatterChart>
                ) : <div className="absolute inset-0 flex items-center justify-center text-slate-700/50 text-xs animate-pulse">Loading visualization...</div>}
                <div className="absolute bottom-0 w-full text-center text-[10px] text-gray-500">← Faster Reply · Slower Reply →</div>
                <div className="absolute left-0 top-1/2 -rotate-90 text-[10px] text-gray-500 origin-left -translate-y-1/2">← One msg · Many msgs →</div>
            </div>
        );
    };

    const RelationshipGraph = ({ graph, commentary }) => {
        const [hoveredNode, setHoveredNode] = useState(null);
        const WIDTH = 600; const HEIGHT = 400; const CENTER_X = WIDTH / 2; const CENTER_Y = HEIGHT / 2; const RADIUS = 140;
        const nodes = useMemo(() => { if (!graph.nodes || graph.nodes.length === 0) return []; return graph.nodes.map((node, i) => { const angle = (i / graph.nodes.length) * 2 * Math.PI - Math.PI / 2; return { id: node, x: CENTER_X + RADIUS * Math.cos(angle), y: CENTER_Y + RADIUS * Math.sin(angle), }; }); }, [graph.nodes]);
        const nodeMap = useMemo(() => { const map = new Map(); nodes.forEach(n => map.set(n.id, n)); return map; }, [nodes]);
        if (!graph || !graph.nodes || graph.nodes.length === 0) return <div className="text-gray-500">Not enough data</div>;
        const maxWeight = Math.max(...graph.links.map(l => l.weight), 1);
        return (
            <div className="flex flex-col md:flex-row h-full w-full">
                <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
                   <svg viewBox={"0 0 " + WIDTH + " " + HEIGHT} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                      <defs><linearGradient id="gradientLine" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs>
                      {graph.links.map((link, i) => { const start = nodeMap.get(link.source); const end = nodeMap.get(link.target); if (!start || !end) return null; const isHovered = hoveredNode === link.source || hoveredNode === link.target; const isDimmed = hoveredNode && !isHovered; return (<path key={i} d={"M " + start.x + " " + start.y + " Q " + CENTER_X + " " + CENTER_Y + " " + end.x + " " + end.y} stroke="url(#gradientLine)" strokeWidth={Math.max(1, (link.weight / maxWeight) * 4)} fill="none" opacity={isDimmed ? 0.1 : (isHovered ? 1 : 0.4 + (link.weight / maxWeight) * 0.4)} className="transition-all duration-300" />); })}
                      {nodes.map((node) => { const isHovered = hoveredNode === node.id; const isDimmed = hoveredNode && !isHovered && !graph.links.some(l => (l.source === node.id && l.target === hoveredNode) || (l.target === node.id && l.source === hoveredNode)); return (<g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={{cursor: 'pointer'}} opacity={isDimmed ? 0.2 : 1} className="transition-opacity"><circle cx={node.x} cy={node.y} r={isHovered ? 8 : 5} fill={isHovered ? "#fff" : "#EC4899"} stroke="#1E293B" strokeWidth={2} /><text x={node.x + (node.x > CENTER_X ? 15 : -15)} y={node.y} dy="0.3em" textAnchor={node.x > CENTER_X ? "start" : "end"} fill={isHovered ? "#F59E0B" : "#94a3b8"} fontSize={isHovered ? 14 : 11} fontWeight={isHovered ? "bold" : "normal"}>{node.id.length > 12 ? node.id.substring(0, 10) + '...' : node.id}</text></g>); })}
                   </svg>
                </div>
                <div className="md:w-64 flex-shrink-0 p-2 md:border-l border-slate-700/50 flex flex-col gap-3 overflow-y-auto max-h-[350px] scrollbar-hide bg-slate-900/20">
                    <h4 className="text-xs font-bold uppercase text-festive-accent tracking-widest text-center sticky top-0 bg-[#1E293B]/90 p-2 z-10">AI Gossip Column</h4>
                    {commentary && commentary.length > 0 ? commentary.map((item, i) => (<div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700"><div className="flex justify-between items-start mb-1"><span className="text-[10px] text-festive-primary font-black uppercase">{item.dynamic}</span></div><h5 className="text-white text-xs font-bold mb-1">{item.pair}</h5><p className="text-[10px] text-gray-400 italic">"{item.description}"</p></div>)) : <div className="text-center text-gray-500 text-xs italic p-4">Gathering intelligence...</div>}
                </div>
            </div>
        );
    };

    const TimelineChart = ({ data, highlights }) => {
      const containerRef = useRef(null);
      const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
      useEffect(() => { if (!containerRef.current) return; const updateDims = () => { if(containerRef.current) { const { clientWidth, clientHeight } = containerRef.current; if(clientWidth > 0 && clientHeight > 0) { setDimensions({ width: clientWidth, height: clientHeight }); } } }; updateDims(); const ro = new ResizeObserver(entries => { window.requestAnimationFrame(() => { if(!entries.length) return; updateDims(); }); }); ro.observe(containerRef.current); return () => ro.disconnect(); }, []);
      if (!data || data.length === 0) return <div>No data</div>;
      let chartData = data.map(d => ({...d, highlight: null, highlightLabel: ''}));
      if (data.length === 1) { chartData.unshift({ date: '', count: 0, highlight: null, highlightLabel: '' }); }
      const getDayValue = (dateStr) => { const parts = dateStr.split(/[^a-zA-Z0-9]+/); if (parts.length < 2) return -1; const monthStr = parts.find(p => isNaN(Number(p)))?.toLowerCase().substring(0, 3); const dayStr = parts.find(p => !isNaN(Number(p))); if (!monthStr || !dayStr) return -1; const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']; const mIndex = months.indexOf(monthStr); if (mIndex === -1) return -1; return (mIndex * 100) + parseInt(dayStr); };
      highlights?.forEach(h => { if (!h.date) return; const hVal = getDayValue(h.date); if (hVal === -1) return; let closestPoint = null; let minDiff = 1000; for (const d of chartData) { const dVal = getDayValue(d.date); if (dVal === -1) continue; const diff = Math.abs(dVal - hVal); if (diff < minDiff && diff < 4) { minDiff = diff; closestPoint = d; } } if (closestPoint) { closestPoint.highlight = closestPoint.count; closestPoint.highlightLabel = h.label; } });
      const CustomScatterShape = (props) => { const { cx, cy, payload } = props; if (payload && (payload.highlight === null || payload.highlight === undefined)) return null; return <circle cx={cx} cy={cy} r={5} fill="#EC4899" stroke="#fff" strokeWidth={2} />; };
      const CustomLabel = (props) => { const { x, y, cx, cy, value } = props; const finalX = x ?? cx; const finalY = y ?? cy; if (!value || typeof finalX !== 'number' || typeof finalY !== 'number') return null; const width = Math.max(80, value.length * 8) + 16; const height = 30; return (<g transform={"translate(" + finalX + "," + (finalY - 45) + ")"} style={{ pointerEvents: 'none' }}> <path d={"M" + (-width/2) + "," + (-height/2) + " h" + width + " a4,4 0 0 1 4,4 v" + (height-8) + " a4,4 0 0 1 -4,4 h-" + (width/2 - 6) + " l-6,6 l-6,-6 h-" + (width/2 - 6) + " a4,4 0 0 1 -4,-4 v-" + (height-8) + " a4,4 0 0 1 4,-4 z"} fill="#EC4899" stroke="#fff" strokeWidth="1.5" /> <text x="0" y="0" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">{value}</text> </g>); };
      return (<div ref={containerRef} className="w-full h-full relative min-h-[250px]">{dimensions.width > 0 && dimensions.height > 0 ? (<ComposedChart width={dimensions.width} height={dimensions.height} data={chartData} margin={{ top: 60, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" type="category" allowDuplicatedCategory={false} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} tick={{ dy: 10 }} interval="preserveStartEnd" /><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#F59E0B' }} labelStyle={{ color: '#94a3b8' }} /><Area type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" isAnimationActive={false} /><Scatter dataKey="highlight" fill="#EC4899" shape={<CustomScatterShape />} isAnimationActive={false}><LabelList dataKey="highlightLabel" content={<CustomLabel />} position="top" /></Scatter></ComposedChart>) : <div className="absolute inset-0 flex items-center justify-center text-gray-500">Loading chart...</div>}</div>);
    };

    const WordCloud = ({ words = [] }) => {
      if (!words.length) return <div className="text-gray-500">No words</div>;
      const maxVal = Math.max(...words.map(w => w.value));
      const minVal = Math.min(...words.map(w => w.value));
      const getSize = (val) => { if (maxVal === minVal) return 1.5; return 0.8 + ((val - minVal) / (maxVal - minVal)) * 1.7; };
      const colors = ['text-festive-primary', 'text-festive-secondary', 'text-festive-accent', 'text-blue-400', 'text-purple-400'];
      return (<div className="flex flex-wrap justify-center content-center gap-x-4 gap-y-2 h-64 overflow-hidden">{words.map((word, idx) => (<span key={idx} className={colors[idx % colors.length] + " font-bold hover:scale-110 transition-transform"} style={{ fontSize: getSize(word.value) + "rem", opacity: 0.8 + (word.value/maxVal)*0.2 }}>{word.text}</span>))}</div>);
    };

    const Dashboard = ({ data, insights }) => {
      const COLORS = ['#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6', '#6366f1'];
      const participants = data.participants || [];
      const mediaStats = data.mediaStats || [];
      const viralMessages = data.viralMessages || [];
      const conversationKillers = data.conversationKillers || [];

      // Logic for link themes mirroring the main app
      let linkThemeData = [];
      if (insights && insights.linkThemes && insights.linkThemes.length > 0) {
          linkThemeData = insights.linkThemes.filter(t => t.percentage > 0);
      }
      if (linkThemeData.length === 0) {
          linkThemeData = data.domainStats.slice(0, 5).map(d => ({ theme: d.domain, percentage: d.count }));
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto">
          <div className="col-span-full mb-4 text-center">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-festive-primary to-festive-secondary mb-4 tracking-tight drop-shadow-sm">{data.chatName} Wrapped</h1>
            <div className="min-h-[4rem] flex items-center justify-center"><p className="text-2xl font-bold text-white max-w-3xl mx-auto leading-relaxed px-4">"{insights?.summary}"</p></div>
          </div>

          <StatCard title="Coming This Fall" icon={<Icons.Tv />} className="col-span-full bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-pink-500/30">
            <div className="flex flex-col md:flex-row gap-6 items-center p-2">
                <div className="flex-1 text-center md:text-left">
                   <h2 className="text-4xl font-black text-white mb-2 uppercase italic">{insights?.realityShow?.title || "THE GROUP CHAT"}</h2>
                   <div className="inline-block bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 uppercase">{insights?.realityShow?.genre}</div>
                   <p className="text-gray-300 italic text-lg">"{insights?.realityShow?.logline}"</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                   {insights?.realityShow?.cast?.map((c, i) => (<div key={i} className="bg-black/30 p-3 rounded border border-white/10"><div className="font-bold text-festive-primary text-sm">{c.name}</div><div className="text-xs text-gray-400">The {c.archetype}</div><div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{c.role}</div></div>))}
                </div>
            </div>
          </StatCard>

          <StatCard title="Total Messages" value={data.totalMessages.toLocaleString()} icon={<Icons.MessageSquare />} />
          <StatCard title="Active Members" value={participants.length} icon={<Icons.Users />} />
          <StatCard title="Media Shared" value={mediaStats.reduce((a, b) => a + b.count, 0)} icon={<Icons.Image />} />
          <StatCard title="Peak Time" value={data.hourlyActivity.reduce((p, c) => (p.count > c.count ? p : c), { hour: 0, count: 0 }).hour + ":00"} icon={<Icons.Clock />} />

          <StatCard title="Chat Activity & Highlights" className="col-span-full h-96" icon={<Icons.TrendingUp />}><div className="h-full pt-2"><TimelineChart data={data.timelineData} highlights={insights?.timelineHighlights} /></div></StatCard>
          
           {/* Internet Rabbit Hole & Top Links */}
          <StatCard title="The Internet Rabbit Hole" icon={<Icons.Link />} className="col-span-full lg:col-span-2 h-[26rem]">
            <div className="h-full flex flex-col relative">
               <h4 className="text-xs font-bold text-center text-gray-500 mb-2 tracking-widest uppercase">OVERALL CONTENT THEMES</h4>
               <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
                 <div className="w-48 h-48 relative flex items-center justify-center">
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
                          {COLORS.map((color, index) => <Cell key={"cell-" + index} fill={color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                     </PieChart>
                 </div>
                 <div className="flex flex-col justify-center gap-2 p-4">
                    {linkThemeData.slice(0, 5).map((theme, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-sm font-medium text-gray-300">{theme.theme}</span>
                      </div>
                    ))}
                 </div>
               </div>
               
               <div className="mt-4 border-t border-slate-700/50 pt-2">
                  <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">TOP LINKS (SCROLL FOR MORE)</h4>
                  <div className="overflow-y-auto max-h-32 scrollbar-hide space-y-2">
                     {(insights?.topLinksCommentary?.length ? insights.topLinksCommentary : (data.sharedLinks.slice(0, 3).map(l => ({ url: l.url, title: l.domain, commentary: "Shared " + l.count + " times" })))).map((link, i) => (
                        <div key={i} className="bg-slate-800/80 p-3 rounded border border-slate-700 hover:border-festive-primary/50 transition-colors group/link relative">
                           <a href={link.url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 text-gray-500 hover:text-white"><Icons.ExternalLink size={14} /></a>
                           <div className="font-bold text-festive-primary text-sm pr-6 truncate">{link.title}</div>
                           {link.commentary && <div className="text-xs text-gray-400 italic">"{link.commentary}"</div>}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </StatCard>

          <StatCard title="Emotional Rollercoaster" className="col-span-full lg:col-span-2 h-[26rem]">
            <div className="h-full flex flex-col justify-center gap-6 p-4">
               {insights?.emotionalProfile?.map((emotion, i) => (
                 <div key={i} className="relative">
                    <div className="flex justify-between items-end mb-1">
                       <div className="flex items-center gap-3">
                          <span className="text-2xl filter drop-shadow-md">{emotion.emoji}</span>
                       </div>
                       <span className="text-2xl font-bold text-gray-300">{emotion.score}</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
                       <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: emotion.score + '%', 
                            backgroundColor: COLORS[i % COLORS.length],
                            boxShadow: '0 0 10px ' + COLORS[i % COLORS.length] + '40'
                          }} 
                       />
                    </div>
                 </div>
               ))}
               {!insights?.emotionalProfile && <div className="text-center text-gray-500">Calculating vibes...</div>}
            </div>
          </StatCard>

          <StatCard title="Ghost vs. Spammer Matrix" icon={<Icons.Activity />} className="lg:col-span-3 h-[28rem]"><ResponseStyleChart participants={participants} /></StatCard>

          <StatCard title="Yap-O-Meter" className="lg:col-span-1 h-[28rem]">
            <div className="space-y-4 mt-2 overflow-y-auto max-h-[24rem] scrollbar-hide pr-2">
              {participants.slice(0, 15).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between group hover:bg-slate-800/50 p-1 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={"flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold " + (i === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white')}>{i + 1}</span>
                    <span className="font-medium truncate max-w-[120px] text-sm">{p.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs font-mono">{p.messageCount}</span>
                </div>
              ))}
            </div>
          </StatCard>

          <StatCard title="The Connection Web" icon={<Icons.Share2 />} className="lg:col-span-3 h-96">
            {data.interactionGraph ? <RelationshipGraph graph={data.interactionGraph} commentary={insights?.relationshipAnalysis} /> : <div className="text-gray-500 flex items-center justify-center h-full">Not enough data for graph</div>}
          </StatCard>

           <StatCard title="Media Diet" className="lg:col-span-1 h-96">
            <div className="h-full flex flex-col">
              <div className="h-48 w-full flex-shrink-0 relative">
                <SafeChartContainer>
                  <PieChart>
                    <Pie data={mediaStats} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="count" stroke="none">
                      {mediaStats.map((entry, index) => (<Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />))}
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

          <StatCard title="The Conversation Killer" icon={<Icons.Skull />} className="lg:col-span-2 h-80 border-red-900/30 bg-gradient-to-b from-slate-900 to-red-950/20">
             <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pr-2">
                {conversationKillers.length > 0 ? (
                   <>
                     <div className="mb-4 flex-shrink-0">
                        <div className="text-xs text-red-400 font-bold uppercase mb-1">Most awkward silence caused by</div>
                        <div className="text-xl text-white font-black">{conversationKillers[0].sender}</div>
                        <div className="text-sm text-gray-500">{conversationKillers[0].silenceDurationHours} hours of silence</div>
                     </div>
                     <div className="bg-black/40 p-4 rounded border-l-2 border-red-500 mb-4 italic text-gray-300 text-sm relative flex-shrink-0">
                        <Icons.Quote size={12} className="absolute top-2 left-2 text-red-500 opacity-50" />
                        <span className="pl-4 block leading-relaxed">"{conversationKillers[0].content}"</span>
                     </div>
                     <div className="bg-red-900/20 p-3 rounded text-xs text-red-200 border border-red-500/20 flex-shrink-0">
                        <span className="font-bold uppercase text-[10px] mb-1 block opacity-70">AI Roast:</span>
                        {insights?.killerRoast}
                     </div>
                   </>
                ) : <div className="text-center text-gray-500 mt-10">No awkward silences found!</div>}
             </div>
          </StatCard>

          <StatCard title="Hall of Shame" icon={<Icons.Award />} className="lg:col-span-2 h-80">
            <div className="grid grid-cols-1 gap-3 overflow-y-auto h-full scrollbar-hide pr-1 pb-2 content-start">
                {insights?.awards.map((award, i) => (
                  <div key={i} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-festive-primary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-1"><Icons.Award size={14} className="text-festive-primary" /><span className="text-festive-primary text-xs font-black uppercase tracking-wider">{award.title}</span></div>
                    <div className="font-bold text-white text-lg">{award.winner}</div>
                    <div className="text-sm text-gray-400 italic">"{award.reason}"</div>
                  </div>
                ))}
            </div>
          </StatCard>
          
          <StatCard title="Group Obsessions" className="col-span-full h-80">
            <WordCloud words={insights?.wordCloud || data.wordCloud} />
          </StatCard>

          <StatCard title="The Epic Saga" icon={<Icons.Quote />} className="col-span-full bg-gradient-to-br from-slate-800 to-indigo-900/80 border-indigo-500/30 h-64">
             <div className="h-full flex flex-col justify-center items-center overflow-y-auto scrollbar-hide">
               <div className="text-center italic font-serif text-lg leading-loose text-indigo-100 px-6 max-w-3xl">
                 {insights?.poem ? insights.poem.split('\\n').map((line, i) => <div key={i}>{line}</div>) : <div className="text-gray-400 text-sm">The poets are silent...</div>}
               </div>
             </div>
          </StatCard>
        </div>
      );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<Dashboard data={window.ANALYSIS_DATA} insights={window.AI_INSIGHTS} />);
  </script>
</body>
</html>`;
}
