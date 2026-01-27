'use client';

import { FC, useMemo } from 'react';
import HeatMap from '@uiw/react-heat-map';
import { motion } from 'motion/react';

interface StreakData {
  date: string; // YYYY/MM/DD format
  count: number;
}

interface StreakHeatmapProps {
  data: StreakData[];
  months?: number;
  className?: string;
}

/**
 * StreakHeatmap Component
 *
 * Displays betting activity as a GitHub-style heatmap calendar.
 * Shows bet activity over the specified number of months.
 */
const StreakHeatmap: FC<StreakHeatmapProps> = ({
  data,
  months = 3,
  className = '',
}) => {
  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return {
      startDate: start,
      endDate: end,
    };
  }, [months]);

  // Transform data to HeatMap format
  const heatmapData = useMemo(() => {
    return data.map((item) => ({
      date: item.date,
      count: item.count,
    }));
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`overflow-x-auto ${className}`}
    >
      <HeatMap
        value={heatmapData}
        startDate={startDate}
        endDate={endDate}
        width="100%"
        style={{
          color: '#94a3b8', // neutral-400 for labels
        }}
        legendCellSize={0}
        rectSize={14}
        rectProps={{
          rx: 3,
        }}
        panelColors={{
          0: '#262626', // neutral-800 - no activity
          1: '#064e3b', // emerald-900 - low activity
          2: '#047857', // emerald-700 - medium activity
          3: '#059669', // emerald-600 - good activity
          4: '#10b981', // emerald-500 - high activity
        }}
        rectRender={(props) => {
          return (
            <rect
              {...props}
              className="transition-all duration-200 hover:opacity-80"
            />
          );
        }}
      />
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-neutral-500">
        <span>Moins</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-neutral-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span>Plus</span>
      </div>
    </motion.div>
  );
};

export default StreakHeatmap;
