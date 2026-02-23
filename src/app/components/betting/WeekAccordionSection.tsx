'use client';

import { FC } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MdLock } from 'react-icons/md';
import { Bet } from '@/app/models/Bet';
import { BettingWeekStatus } from '@/app/models/BettingWeek';
import { Card, Badge } from '@/app/components/ui';
import { AchievementCard } from '@/app/components/achievements';
import { formatWeekDateRange, formatPoints } from '@/app/utils/formatters';
import CommunityBetCard from './CommunityBetCard';
import { WeekGroup } from '@/app/hooks/useBetsByWeek';

interface WeekAccordionSectionProps {
  group: WeekGroup;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrentWeek: boolean;
  currentUserHasBet: boolean;
  internalUserId: string | null;
  activeTab: 'all' | 'mine';
}

function getStatusBadge(status: string) {
  switch (status) {
    case BettingWeekStatus.OPEN:
      return <Badge variant="warning" size="sm">Ouverte</Badge>;
    case BettingWeekStatus.FINALIZED:
      return <Badge variant="success" size="sm">Finalisée</Badge>;
    case BettingWeekStatus.CLOSED:
      return <Badge variant="default" size="sm">Fermée</Badge>;
    case BettingWeekStatus.CALIBRATION:
      return <Badge variant="default" size="sm">Calibration</Badge>;
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
}

function getHeaderStyles(status: string, isCurrentWeek: boolean) {
  if (isCurrentWeek && status === BettingWeekStatus.OPEN) {
    return {
      container: 'bg-gradient-to-r from-primary-600 to-primary-500 border-primary-400/30',
      text: 'text-white',
      subtext: 'text-white/70',
      chevron: 'text-white/70 group-hover:text-white',
      label: 'Semaine en cours',
    };
  }
  switch (status) {
    case BettingWeekStatus.FINALIZED:
      return {
        container: 'bg-success-500/10 border-success-500/30 hover:border-success-500/50',
        text: 'text-white',
        subtext: 'text-neutral-400',
        chevron: 'text-neutral-400 group-hover:text-white',
        label: null,
      };
    case BettingWeekStatus.OPEN:
      return {
        container: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50',
        text: 'text-white',
        subtext: 'text-neutral-400',
        chevron: 'text-neutral-400 group-hover:text-white',
        label: null,
      };
    default:
      return {
        container: 'bg-neutral-800 border-neutral-600 hover:border-neutral-500',
        text: 'text-white',
        subtext: 'text-neutral-400',
        chevron: 'text-neutral-400 group-hover:text-white',
        label: null,
      };
  }
}

const WeekAccordionSection: FC<WeekAccordionSectionProps> = ({
  group,
  isExpanded,
  onToggle,
  isCurrentWeek,
  currentUserHasBet,
  internalUserId,
  activeTab,
}) => {
  const weekClosed = group.status !== BettingWeekStatus.OPEN;
  const showLockBanner = isCurrentWeek && !currentUserHasBet && activeTab === 'all';
  const headerStyles = getHeaderStyles(group.status, isCurrentWeek);

  return (
    <div className="w-full">
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-xl border ${headerStyles.container} transition-all group`}
        aria-expanded={isExpanded}
        aria-controls={`week-content-${group.key}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${headerStyles.text} text-left`}>
              {formatWeekDateRange(group.startDate, group.endDate)}
            </p>
            {headerStyles.label && (
              <p className={`text-xs ${headerStyles.subtext} text-left`}>{headerStyles.label}</p>
            )}
          </div>
          {getStatusBadge(group.status)}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs ${headerStyles.subtext}`}>
            {group.totalBets} pari{group.totalBets > 1 ? 's' : ''}
          </span>
          {group.status === BettingWeekStatus.FINALIZED && group.totalPoints > 0 && (
            <span className="text-xs font-bold text-success-500">
              +{formatPoints(group.totalPoints, 0)} pts
            </span>
          )}
          <div className={`${headerStyles.chevron} transition-colors`}>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`week-content-${group.key}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Lock banner — only for current week when user hasn't bet */}
              {showLockBanner && (
                <Link href="/betting/place-bet">
                  <Card className="p-4 border-primary-500/50 hover:border-primary-500 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-500/10 flex-shrink-0">
                        <MdLock className="text-xl text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Placez votre pari pour découvrir les pronostics des autres joueurs
                        </p>
                        <p className="text-xs text-primary-400 mt-0.5">Parier maintenant →</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Empty state CTA — current week with no bets */}
              {group.bets.length === 0 && isCurrentWeek && (
                <Link href="/betting/place-bet">
                  <div className="border-2 border-dashed border-neutral-600 rounded-xl p-6 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
                    <p className="text-sm text-neutral-400">Aucun pari cette semaine</p>
                    <p className="text-sm font-medium text-primary-400 mt-1">Parier maintenant →</p>
                  </div>
                </Link>
              )}

              {/* Bet cards */}
              {group.bets.map((bet) => (
                <div key={bet.id}>
                  <CommunityBetCard
                    bet={bet}
                    isCurrentUser={!!internalUserId && bet.userId === internalUserId}
                    variant="full"
                    currentUserHasBet={currentUserHasBet}
                    weekClosed={weekClosed}
                    isCurrentWeek={isCurrentWeek}
                  />

                  {/* Achievement Timeline — only on "mine" tab for own bets */}
                  {activeTab === 'mine' && bet.achievementsUnlocked && bet.achievementsUnlocked.length > 0 && (
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-neutral-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-primary-400">
                          Achievements débloqués
                        </span>
                      </div>
                      <div className="space-y-2">
                        {bet.achievementsUnlocked.map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={{
                              ...achievement,
                              isUnlocked: true,
                            }}
                            variant="compact"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeekAccordionSection;
