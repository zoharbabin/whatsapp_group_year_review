import React, { useEffect, useState, useRef } from 'react';
import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Scatter } from 'recharts';

interface TimelineChartProps {
  data: { date: string; count: number }[];
  highlights?: { date: string; label: string }[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data, highlights }) => {
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
        if (!Array.isArray(entries) || !entries.length) return;
        updateDimensions();
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No timeline data available</div>;
  }
  
  // Robust date comparison helper
  const getDayValue = (dateStr: string) => {
    // 1. Try parsing strictly as "Month Day" (e.g. "Dec 1")
    const parts = dateStr.split(/[^a-zA-Z0-9]+/);
    if (parts.length >= 2) {
      const monthStr = parts.find(p => isNaN(Number(p)))?.toLowerCase().substring(0, 3);
      const dayStr = parts.find(p => !isNaN(Number(p)));
      
      if (monthStr && dayStr) {
         const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
         const mIndex = months.indexOf(monthStr);
         if (mIndex !== -1) return (mIndex * 100) + parseInt(dayStr);
      }
    }
    
    // 2. Try standard Date parsing (YYYY-MM-DD or similar)
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
       return (d.getMonth() * 100) + d.getDate();
    }
    
    return -1;
  };

  // Merge highlights into the main data structure
  let chartData = data.map(d => ({
    ...d,
    highlight: null as number | null,
    highlightLabel: ''
  }));

  if (data.length === 1) {
     chartData.unshift({ date: '', count: 0, highlight: null, highlightLabel: '' });
  }

  highlights?.forEach(h => {
    if (!h.date) return;
    
    const hVal = getDayValue(h.date);
    if (hVal === -1) return;

    let closestPoint = null;
    let minDiff = 1000;

    for (const d of chartData) {
        const dVal = getDayValue(d.date);
        if (dVal === -1) continue;

        const diff = Math.abs(dVal - hVal);
        
        // Match if close enough (within ~3 days)
        // Also handle year wrap-around edge case (Jan 1 vs Dec 31) roughly
        if (diff < minDiff && diff < 30) {
            minDiff = diff;
            closestPoint = d;
        }
    }

    if (closestPoint) {
      closestPoint.highlight = closestPoint.count;
      closestPoint.highlightLabel = h.label;
    }
  });

  const CustomScatterShape = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload && (payload.highlight === null || payload.highlight === undefined)) return null;
    return <circle cx={cx} cy={cy} r={5} fill="#EC4899" stroke="#fff" strokeWidth={2} />;
  };

  const CustomLabel = (props: any) => {
    const { x, y, cx, cy, value } = props;
    const finalX = x ?? cx;
    const finalY = y ?? cy;

    if (!value || typeof finalX !== 'number' || typeof finalY !== 'number') return null;
    
    const textWidth = Math.max(80, value.length * 8) + 16;
    const width = textWidth;
    const height = 30; 
    
    return (
      <g transform={`translate(${finalX},${finalY - 45})`} style={{ pointerEvents: 'none' }}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.4"/>
          </filter>
        </defs>
        <path 
            d={`M${-width/2},${-height/2} h${width} a4,4 0 0 1 4,4 v${height-8} a4,4 0 0 1 -4,4 h-${width/2 - 6} l-6,6 l-6,-6 h-${width/2 - 6} a4,4 0 0 1 -4,-4 v-${height-8} a4,4 0 0 1 4,-4 z`} 
            fill="#EC4899" 
            filter="url(#shadow)"
            stroke="#fff"
            strokeWidth="1.5"
        />
        <text 
            x="0" 
            y="0" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            fill="#fff" 
            fontSize="14" 
            fontWeight="bold" 
            fontFamily="sans-serif"
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[250px]">
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <ComposedChart 
            width={dimensions.width} 
            height={dimensions.height} 
            data={chartData} 
            margin={{ top: 60, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="date" 
            type="category"
            allowDuplicatedCategory={false}
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={30}
            tick={{ dy: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
            itemStyle={{ color: '#F59E0B' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#F59E0B" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorCount)" 
            isAnimationActive={false} 
          />
          
          <Scatter 
            dataKey="highlight"
            fill="#EC4899"
            isAnimationActive={false}
            shape={<CustomScatterShape />}
          >
             <LabelList dataKey="highlightLabel" content={<CustomLabel />} position="top" />
          </Scatter>
        </ComposedChart>
      ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xs animate-pulse">
             Loading Chart...
          </div>
      )}
    </div>
  );
};

export default TimelineChart;