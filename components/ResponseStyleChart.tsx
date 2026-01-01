import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ReferenceLine, LabelList } from 'recharts';
import { ParticipantStats } from '../types';

interface ResponseStyleChartProps {
  participants: ParticipantStats[];
}

const ResponseStyleChart: React.FC<ResponseStyleChartProps> = ({ participants }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
        window.requestAnimationFrame(() => {
            if (!entries.length) return;
            updateDimensions();
        });
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter out people with very few messages to avoid noise
  const data = participants
    .filter(p => p.messageCount > 10)
    .map(p => ({
      name: p.name,
      x: p.avgReplyTimeSeconds, // Latency
      y: p.avgBurstLength, // Burstiness
      z: p.messageCount // Bubble size
    }));

  if (data.length === 0) return <div className="text-gray-500 flex items-center justify-center h-full">Not enough data</div>;

  // Calculate dynamic domains to center the chart
  const maxX = Math.max(...data.map(d => d.x)) * 1.1;
  const maxY = Math.max(...data.map(d => d.y)) * 1.1;
  const midX = maxX / 2;
  const midY = maxY / 2;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl text-xs z-50">
          <p className="font-bold text-festive-primary mb-1">{d.name}</p>
          <p className="text-gray-300">Burstiness: {d.y.toFixed(2)} msgs/row</p>
          <p className="text-gray-300">Avg Reply: {(d.x / 60).toFixed(1)} mins</p>
        </div>
      );
    }
    return null;
  };

  const CustomScatterShape = (props: any) => {
     const { cx, cy, fill } = props;
     return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />;
  };

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[200px]">
      {/* Quadrant Labels */}
      <div className="absolute top-4 left-4 text-[10px] font-bold text-pink-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE PANIC POSTER<br/>(Fast + Many)</div>
      <div className="absolute top-4 right-4 text-[10px] font-bold text-blue-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE STORYTELLER<br/>(Slow + Paragraphs)</div>
      <div className="absolute bottom-10 left-4 text-[10px] font-bold text-green-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE ONE-WORDER<br/>(Fast + Short)</div>
      <div className="absolute bottom-10 right-4 text-[10px] font-bold text-gray-400 opacity-70 bg-slate-900/50 p-1 rounded z-10 pointer-events-none">THE GHOST<br/>(Slow + Short)</div>

      {dimensions.width > 0 && dimensions.height > 0 ? (
        <ScatterChart width={dimensions.width} height={dimensions.height} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Latency" 
            unit="s" 
            tick={false} 
            axisLine={{ stroke: '#475569' }}
            domain={[0, maxX]}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Burstiness" 
            tick={false} 
            axisLine={{ stroke: '#475569' }}
            domain={[0, maxY]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine x={midX} stroke="#334155" strokeDasharray="3 3" />
          <ReferenceLine y={midY} stroke="#334155" strokeDasharray="3 3" />
          <Scatter name="Participants" data={data} shape={<CustomScatterShape />}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={['#F59E0B', '#EC4899', '#10B981', '#3B82F6'][index % 4]} />
            ))}
             <LabelList dataKey="name" position="top" style={{ fill: '#94a3b8', fontSize: '10px' }} />
          </Scatter>
        </ScatterChart>
      ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700/50 text-xs animate-pulse">Loading visualization...</div>
      )}
      <div className="absolute bottom-0 w-full text-center text-[10px] text-gray-500">← Faster Reply · Slower Reply →</div>
      <div className="absolute left-0 top-1/2 -rotate-90 text-[10px] text-gray-500 origin-left -translate-y-1/2">← One msg · Many msgs →</div>
    </div>
  );
};

export default ResponseStyleChart;