'use client';

import { FC, ReactNode, useEffect } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import RankingTransitionCard from './RankingTransitionCard';
import {
  AnimationPhase,
  CompetitorAnimData,
} from '@/app/hooks/useRankingAnimation';

interface Props {
  phase: AnimationPhase;
  displayOrder: CompetitorAnimData[];
  changedIds: Set<string>;
  variant?: 'mobile' | 'tv';
  onTransitionComplete: () => void;
  children: ReactNode;
}

const RankingAnimationOverlay: FC<Props> = ({
  phase,
  displayOrder,
  changedIds,
  variant = 'mobile',
  onTransitionComplete,
  children,
}) => {
  const showUniformCards =
    phase === 'showing-old' || phase === 'shuffling' || phase === 'crossfading';

  // When phase becomes 'done', trigger the transition complete callback after a short delay
  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(() => {
        onTransitionComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [phase, onTransitionComplete]);

  // When idle or done, just render children
  if (!showUniformCards && phase !== 'done') {
    return <>{children}</>;
  }

  const isTV = variant === 'tv';

  return (
    <div className="relative">
      {/* Layer 1: Uniform transition cards */}
      <AnimatePresence>
        {showUniformCards && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 'crossfading' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`${phase === 'crossfading' ? 'absolute inset-0 z-10' : 'relative z-10'}`}
          >
            <LayoutGroup>
              <div className={`space-y-1 ${isTV ? 'space-y-3 max-w-5xl mx-auto' : ''}`}>
                {displayOrder.map((comp) => (
                  <RankingTransitionCard
                    key={comp.id}
                    competitor={comp}
                    isChanged={changedIds.has(comp.id)}
                    variant={variant}
                  />
                ))}
              </div>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 2: Real layout (children) */}
      <motion.div
        initial={{ opacity: showUniformCards ? 0 : 1 }}
        animate={{
          opacity:
            showUniformCards && phase !== 'crossfading'
              ? 0
              : 1,
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className={showUniformCards && phase !== 'crossfading' ? 'absolute inset-0 pointer-events-none' : 'relative'}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default RankingAnimationOverlay;
