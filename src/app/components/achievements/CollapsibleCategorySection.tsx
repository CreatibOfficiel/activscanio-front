'use client';

import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Achievement, AchievementCategory } from '@/app/models/Achievement';
import AchievementCard from './AchievementCard';

interface CollapsibleCategorySectionProps {
  categoryKey: AchievementCategory;
  categoryName: string;
  categoryIcon: string;
  achievements: Achievement[];
  defaultExpanded?: boolean;
  onAchievementClick?: (achievement: Achievement) => void;
}

/**
 * CollapsibleCategorySection Component
 *
 * A collapsible section for grouping achievements by category.
 * Features:
 * - Clickable header with expand/collapse toggle
 * - Smooth animation for expand/collapse
 * - Counter showing unlocked/total achievements
 * - Responsive grid layout for achievement cards
 */
const CollapsibleCategorySection: FC<CollapsibleCategorySectionProps> = ({
  categoryKey,
  categoryName,
  categoryIcon,
  achievements,
  defaultExpanded = true,
  onAchievementClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Category Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 hover:border-neutral-600 transition-all group"
        aria-expanded={isExpanded}
        aria-controls={`category-content-${categoryKey}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryIcon}</span>
          <h3 className="text-lg font-bold text-white">{categoryName}</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Unlocked counter */}
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                unlockedCount === totalCount
                  ? 'text-success-400'
                  : 'text-neutral-400'
              }`}
            >
              {unlockedCount}/{totalCount}
            </span>
            {unlockedCount === totalCount && (
              <span className="text-success-400 text-sm">
                Complet
              </span>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div className="text-neutral-400 group-hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`category-content-${categoryKey}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={
                    onAchievementClick
                      ? () => onAchievementClick(achievement)
                      : undefined
                  }
                  variant="default"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleCategorySection;
