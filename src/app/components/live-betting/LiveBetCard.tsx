"use client";

import { FC } from 'react';
import { LiveBet, LiveBetStatus } from '@/app/models/LiveBet';
import { Card, Badge } from '@/app/components/ui';
import { formatOdds } from '@/app/utils/formatters';
import { MdCasino, MdTimer, MdCheck, MdClose, MdHourglassEmpty } from 'react-icons/md';

interface LiveBetCardProps {
  liveBet: LiveBet;
  compact?: boolean;
}

const statusConfig: Record<LiveBetStatus, { label: string; variant: 'primary' | 'success' | 'error' | 'warning' | 'default' }> = {
  [LiveBetStatus.DETECTING]: { label: 'Analyse...', variant: 'warning' },
  [LiveBetStatus.ACTIVE]: { label: 'En attente', variant: 'primary' },
  [LiveBetStatus.WON]: { label: 'Gagné', variant: 'success' },
  [LiveBetStatus.LOST]: { label: 'Perdu', variant: 'error' },
  [LiveBetStatus.CANCELLED]: { label: 'Annulé', variant: 'default' },
};

const LiveBetCard: FC<LiveBetCardProps> = ({ liveBet, compact }) => {
  const config = statusConfig[liveBet.status];
  const competitorName = liveBet.competitor
    ? `${liveBet.competitor.firstName} ${liveBet.competitor.lastName}`
    : `#${liveBet.competitorId.slice(0, 8)}`;

  const isActive = liveBet.status === LiveBetStatus.ACTIVE || liveBet.status === LiveBetStatus.DETECTING;

  return (
    <Card className={`p-3 ${compact ? '' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${
            liveBet.status === LiveBetStatus.WON ? 'bg-green-500/10' :
            liveBet.status === LiveBetStatus.LOST ? 'bg-red-500/10' :
            isActive ? 'bg-primary-500/10' : 'bg-neutral-700'
          }`}>
            {liveBet.status === LiveBetStatus.DETECTING ? (
              <MdHourglassEmpty className="text-xl text-warning-400" />
            ) : liveBet.status === LiveBetStatus.WON ? (
              <MdCheck className="text-xl text-green-400" />
            ) : liveBet.status === LiveBetStatus.LOST ? (
              <MdClose className="text-xl text-red-400" />
            ) : isActive ? (
              <MdTimer className="text-xl text-primary-400" />
            ) : (
              <MdCasino className="text-xl text-neutral-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white truncate">
                {competitorName}
              </span>
              <Badge variant={config.variant} size="sm">{config.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>Cote {formatOdds(liveBet.oddAtBet)}</span>
              {liveBet.pointsEarned != null && (
                <span className={liveBet.pointsEarned >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {liveBet.pointsEarned >= 0 ? '+' : ''}{formatOdds(liveBet.pointsEarned)} pts
                </span>
              )}
            </div>
          </div>
        </div>

        {liveBet.user && (
          <span className="text-xs text-neutral-500 shrink-0">
            {liveBet.user.firstName}
          </span>
        )}
      </div>
    </Card>
  );
};

export default LiveBetCard;
