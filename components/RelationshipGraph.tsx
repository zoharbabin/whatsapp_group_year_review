import React, { useState, useMemo } from 'react';
import { InteractionGraph } from '../types';

interface RelationshipGraphProps {
  graph: InteractionGraph;
  commentary?: { pair: string; dynamic: string; description: string }[];
}

const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ graph, commentary }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Constants for layout
  const WIDTH = 600;
  const HEIGHT = 400;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = HEIGHT / 2;
  const RADIUS = 140;

  // Calculate node positions in a circle
  const nodes = useMemo(() => {
    if (!graph.nodes || graph.nodes.length === 0) return [];
    
    return graph.nodes.map((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI - Math.PI / 2; // Start from top
      return {
        id: node,
        x: CENTER_X + RADIUS * Math.cos(angle),
        y: CENTER_Y + RADIUS * Math.sin(angle),
        angle
      };
    });
  }, [graph.nodes]);

  // Map for easy lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  if (!graph || graph.nodes.length === 0) {
    return <div className="text-gray-500 flex items-center justify-center h-full">Not enough data for graph</div>;
  }

  // Determine max weight for line opacity normalization
  const maxWeight = Math.max(...graph.links.map(l => l.weight), 1);

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
       {/* Visual Graph */}
       <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
          <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
             {/* Connections */}
             {graph.links.map((link, i) => {
                const start = nodeMap.get(link.source);
                const end = nodeMap.get(link.target);
                if (!start || !end) return null;

                const isHovered = hoveredNode === link.source || hoveredNode === link.target;
                const isDimmed = hoveredNode && !isHovered;
                
                // Curve calculation (quadratic bezier)
                // Control point is closer to center to make lines curve inward
                const cpX = CENTER_X;
                const cpY = CENTER_Y;

                return (
                  <path
                    key={i}
                    d={`M ${start.x} ${start.y} Q ${cpX} ${cpY} ${end.x} ${end.y}`}
                    stroke="url(#gradientLine)"
                    strokeWidth={Math.max(1, (link.weight / maxWeight) * 4)}
                    fill="none"
                    opacity={isDimmed ? 0.1 : (isHovered ? 1 : 0.4 + (link.weight / maxWeight) * 0.4)}
                    className="transition-all duration-300"
                  />
                );
             })}
             
             {/* Gradient Def */}
             <defs>
               <linearGradient id="gradientLine" gradientUnits="userSpaceOnUse">
                 <stop offset="0%" stopColor="#F59E0B" />
                 <stop offset="100%" stopColor="#EC4899" />
               </linearGradient>
             </defs>

             {/* Nodes */}
             {nodes.map((node) => {
               const isHovered = hoveredNode === node.id;
               const isDimmed = hoveredNode && !isHovered && !graph.links.some(l => (l.source === node.id && l.target === hoveredNode) || (l.target === node.id && l.source === hoveredNode));

               return (
                 <g 
                    key={node.id} 
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: 'pointer' }}
                    className="transition-opacity duration-300"
                    opacity={isDimmed ? 0.2 : 1}
                 >
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r={isHovered ? 8 : 5} 
                      fill={isHovered ? "#fff" : "#EC4899"}
                      stroke="#1E293B"
                      strokeWidth={2}
                      className="transition-all duration-300"
                    />
                    {/* Label Positioning Logic to avoid overlap */}
                    <text
                      x={node.x + (node.x > CENTER_X ? 15 : -15)}
                      y={node.y}
                      dy="0.3em"
                      textAnchor={node.x > CENTER_X ? "start" : "end"}
                      fill={isHovered ? "#F59E0B" : "#94a3b8"}
                      fontSize={isHovered ? 14 : 11}
                      fontWeight={isHovered ? "bold" : "normal"}
                      className="transition-all duration-300 pointer-events-none select-none"
                    >
                      {node.id.length > 12 ? node.id.substring(0, 10) + '...' : node.id}
                    </text>
                 </g>
               );
             })}
          </svg>
       </div>

       {/* Commentary Sidebar */}
       <div className="md:w-64 flex-shrink-0 p-2 md:border-l border-slate-700/50 flex flex-col gap-3 overflow-y-auto max-h-[350px] scrollbar-hide bg-slate-900/20">
          <h4 className="text-xs font-bold uppercase text-festive-accent tracking-widest text-center sticky top-0 bg-[#1E293B]/90 p-2 z-10 backdrop-blur-sm">AI Gossip Column</h4>
          
          {commentary && commentary.length > 0 ? (
             commentary.map((item, i) => (
               <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-festive-secondary/50 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                   <span className="text-[10px] text-festive-primary font-black uppercase">{item.dynamic}</span>
                 </div>
                 <h5 className="text-white text-xs font-bold mb-1">{item.pair}</h5>
                 <p className="text-[10px] text-gray-400 italic leading-relaxed">"{item.description}"</p>
               </div>
             ))
          ) : (
            <div className="text-center text-gray-500 text-xs italic p-4">
              Gathering intelligence on who is ghosting whom...
            </div>
          )}
       </div>
    </div>
  );
};

export default RelationshipGraph;