import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  delay?: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-panel rounded-xl p-6 relative overflow-hidden group hover:bg-opacity-80 transition-all flex flex-col ${className}`}
    >
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
          {value && <div className="text-3xl font-bold text-white mt-1">{value}</div>}
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-festive-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">{icon}</div>}
      </div>
      <div className="relative z-10 flex-1 min-h-0 w-full">
        {children}
      </div>
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-festive-secondary opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
    </motion.div>
  );
};

export default StatCard;