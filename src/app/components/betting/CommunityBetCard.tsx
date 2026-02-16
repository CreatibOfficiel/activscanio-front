'use client';

import { FC } from 'react';
import { Bet, BetStatus, BetPosition } from '@/app/models/Bet';
import { Card, Badge, UserAvatar } from '@/app/components/ui';
import PositionMedal from './PositionMedal';
import { formatPoints, formatOdds, formatRelativeDate, formatCompetitorName } from '@/app/utils/formatters';
import { MdCheckCircle, MdCancel, MdPending, MdBolt, MdLock } from 'react-icons/md';

interface CommunityBetCardProps {
  bet: Bet;
  isCurrentUser: boolean;
  variant: 'compact' | 'full';
  currentUserHasBet?: boolean;
}

const positionOrder = {
  [BetPosition.FIRST]: 1,
  [BetPosition.SECOND]: 2,
  [BetPosition.THIRD]: 3,
};

function getUserDisplayName(bet: Bet, isCurrentUser: boolean): string {
  if (isCurrentUser) return 'Vous';
  if (bet.user) {
    return `${bet.user.firstName} ${bet.user.lastName.charAt(0)}.`;
  }
  return 'Joueur';
}

function getStatusBadge(status: BetStatus, pointsEarned?: number) {
  switch (status) {
    case BetStatus.WON:
      return (
        <span className="flex items-center gap-1 text-sm text-green-400 font-medium">
          <MdCheckCircle className="w-4 h-4" />
          +{formatPoints(pointsEarned ?? 0, 1)} pts
        </span>
      );
    case BetStatus.LOST:
      return (
        <span className="flex items-center gap-1 text-sm text-red-400 font-medium">
          <MdCancel className="w-4 h-4" />
          0 pts
        </span>
      );
    case BetStatus.CANCELLED:
      return <Badge variant="default" size="sm">Annulé</Badge>;
    default:
      return <Badge variant="warning" size="sm">En attente</Badge>;
  }
}

const CompactCard: FC<CommunityBetCardProps> = ({ bet, isCurrentUser, currentUserHasBet }) => {
  const displayName = getUserDisplayName(bet, isCurrentUser);
  const avatarName = bet.user ? `${bet.user.firstName} ${bet.user.lastName}` : 'Joueur';
  const picksHidden = !isCurrentUser && bet.status === BetStatus.PENDING && !currentUserHasBet;

  return (
    <Card
      className={`p-3 ${
        isCurrentUser ? 'border-l-4 border-l-primary-500 bg-primary-500/5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            src={bet.user?.profilePictureUrl}
            name={avatarName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">{displayName}</p>
            <p className="text-xs text-neutral-400">
              {formatRelativeDate(bet.placedAt)}
              {' · '}
              {picksHidden
                ? `${bet.picks.length} pronostics`
                : bet.picks
                    .sort((a, b) => positionOrder[a.position] - positionOrder[b.position])
                    .map((p) =>
                      p.competitor
                        ? formatCompetitorName(p.competitor.firstName, p.competitor.lastName)
                        : '?'
                    )
                    .join(', ')}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {getStatusBadge(bet.status, bet.pointsEarned)}
        </div>
      </div>
    </Card>
  );
};

const FullCard: FC<CommunityBetCardProps> = ({ bet, isCurrentUser, currentUserHasBet }) => {
  const displayName = getUserDisplayName(bet, isCurrentUser);
  const avatarName = bet.user ? `${bet.user.firstName} ${bet.user.lastName}` : 'Joueur';
  const picksHidden = !isCurrentUser && bet.status === BetStatus.PENDING && !currentUserHasBet;
  const isPerfectPodium =
    bet.isFinalized && bet.picks.every((pick) => pick.isCorrect === true);

  return (
    <Card
      className={`p-4 ${
        isCurrentUser ? 'border-l-4 border-l-primary-500 bg-primary-500/5' : ''
      } ${
        bet.isFinalized
          ? (bet.pointsEarned ?? 0) > 0
            ? 'border-success-500/30'
            : 'border-neutral-700'
          : 'border-primary-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={bet.user?.profilePictureUrl}
            name={avatarName}
            size="md"
          />
          <div>
            <p className="text-base font-semibold text-white">{displayName}</p>
            <p className="text-sm text-neutral-400">
              {formatRelativeDate(bet.placedAt)}
              {bet.user?.level && (
                <span className="ml-2 text-xs text-neutral-500">Niv. {bet.user.level}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bet.isFinalized ? (
            <>
              {(bet.pointsEarned ?? 0) > 0 ? (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-success-500/20 text-success-500">
                  <MdCheckCircle className="w-4 h-4" />
                  <span className="font-semibold">+{formatPoints(bet.pointsEarned ?? 0, 1)} pts</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-500/20 text-error-500">
                  <MdCancel className="w-4 h-4" />
                  <span className="font-semibold">0 pts</span>
                </div>
              )}
              {isPerfectPodium && (
                <Badge variant="gold" size="sm">Parfait!</Badge>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-warning-500/20 text-warning-500">
              <MdPending className="w-4 h-4" />
              <span className="font-medium">En attente</span>
            </div>
          )}
        </div>
      </div>

      {/* Picks */}
      {picksHidden ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-800 border border-neutral-700">
          <MdLock className="w-5 h-5 text-neutral-500 flex-shrink-0" />
          <p className="text-sm text-neutral-400">
            Pariez pour découvrir les pronostics
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bet.picks
            .sort((a, b) => positionOrder[a.position] - positionOrder[b.position])
            .map((pick) => (
              <div
                key={pick.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  bet.isFinalized
                    ? pick.isCorrect
                      ? 'bg-success-500/10 border border-success-500/30'
                      : 'bg-neutral-800/50 border border-neutral-700/50'
                    : 'bg-neutral-800 border border-neutral-700'
                }`}
              >
                <PositionMedal
                  position={pick.position}
                  isCorrect={pick.isCorrect}
                  isFinalized={bet.isFinalized}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium truncate ${
                        bet.isFinalized && !pick.isCorrect ? 'text-neutral-400' : 'text-white'
                      }`}
                    >
                      {pick.competitor
                        ? formatCompetitorName(pick.competitor.firstName, pick.competitor.lastName)
                        : `#${pick.competitorId.slice(0, 8)}`}
                    </span>
                    {pick.hasBoost && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-500 text-xs font-semibold">
                        <MdBolt className="w-3 h-3" />
                        x2
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-neutral-500">
                    Cote {formatOdds(pick.oddAtBet)}
                  </span>
                </div>
                {bet.isFinalized && (
                  <div className="flex flex-col items-end">
                    {pick.isCorrect ? (
                      <MdCheckCircle className="w-6 h-6 text-success-500" />
                    ) : (
                      <MdCancel className="w-6 h-6 text-error-500/60" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        pick.isCorrect ? 'text-success-500' : 'text-neutral-500'
                      }`}
                    >
                      {formatPoints(pick.pointsEarned ?? 0, 1)} pts
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </Card>
  );
};

const CommunityBetCard: FC<CommunityBetCardProps> = (props) => {
  return props.variant === 'compact' ? <CompactCard {...props} /> : <FullCard {...props} />;
};

export default CommunityBetCard;
