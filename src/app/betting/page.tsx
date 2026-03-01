"use client";

import { FC, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useUser } from '@clerk/nextjs';
import { BettingRepository } from '@/app/repositories/BettingRepository';
import { BettingWeek, BettingWeekStatus } from '@/app/models/BettingWeek';
import { Bet } from '@/app/models/Bet';
import { BettorRanking } from '@/app/models/CompetitorOdds';
import { Card, Badge, Button, Spinner, Countdown } from '@/app/components/ui';
import { getBettingDeadline } from '@/app/tv/display/utils/deadlines';
import {
  MdCasino,
  MdHistory,
  MdLeaderboard,
  MdCheckCircle,
  MdTrendingUp,
  MdEmojiEvents
} from 'react-icons/md';
import WeekOddsPreview from '@/app/components/betting/WeekOddsPreview';
import CommunityBetCard from '@/app/components/betting/CommunityBetCard';
import PositionMedal from '@/app/components/betting/PositionMedal';
import { formatOdds, formatCompetitorName } from '@/app/utils/formatters';
import { BetPosition } from '@/app/models/Bet';
import { MdBolt } from 'react-icons/md';
import { Duel, DuelStatus } from '@/app/models/Duel';
import { DuelRepository } from '@/app/repositories/DuelRepository';
import DuelCard from '@/app/components/duel/DuelCard';
import { MdSportsMma, MdCameraAlt, MdAutoAwesome } from 'react-icons/md';
import { SeasonsRepository } from '@/app/repositories/SeasonsRepository';
import SeasonRecapModal from '@/app/components/season/SeasonRecapModal';

const BettingPage: FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<BettingWeek | null>(null);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [userRanking, setUserRanking] = useState<BettorRanking | null>(null);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [recentDuels, setRecentDuels] = useState<Duel[]>([]);
  const [showRecapBanner, setShowRecapBanner] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [recapMonth, setRecapMonth] = useState(0);
  const [recapYear, setRecapYear] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load current week + community bets (public, no auth needed)
      const [week, communityResponse] = await Promise.all([
        BettingRepository.getCurrentWeek(),
        BettingRepository.getCommunityBets(3, 0),
      ]);
      setCurrentWeek(week);
      setRecentBets(communityResponse.data);

      if (user) {
        const token = await getToken({ skipCache: true });
        if (token) {
          // Load current bet
          const bet = await BettingRepository.getCurrentBet(user.id, token);
          setCurrentBet(bet);
          if (bet) setInternalUserId(bet.userId);

          // Load user ranking for current season
          const { getCurrentSeasonNumber } = await import('@/app/utils/season-utils');
          const rankingsData = await BettingRepository.getMonthlyRankings(
            getCurrentSeasonNumber(),
            new Date().getFullYear()
          );
          const myRanking = rankingsData.rankings.find(
            (r) => r.userId === user.id
          );
          setUserRanking(myRanking || null);

          // Load duels
          const myDuels = await DuelRepository.getMyDuels(token);
          setActiveDuels(
            myDuels.filter(
              (d) => d.status === DuelStatus.PENDING || d.status === DuelStatus.ACCEPTED,
            ),
          );
          setRecentDuels(
            myDuels.filter((d) => d.status === DuelStatus.RESOLVED).slice(0, 3),
          );
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading betting data:', err);
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if we should show recap banner (first week of new season)
  useEffect(() => {
    import('@/app/utils/season-utils').then(({ getCurrentSeasonNumber }) => {
      const currentSeason = getCurrentSeasonNumber();
      const currentYear = new Date().getFullYear();
      const prevSeason = currentSeason === 1 ? 13 : currentSeason - 1;
      const prevYear = currentSeason === 1 ? currentYear - 1 : currentYear;

      const bannerDismissKey = 'recapBannerDismissed';
      const dismissedValue = `${prevYear}-${String(prevSeason).padStart(2, '0')}`;

      if (localStorage.getItem(bannerDismissKey) === dismissedValue) return;

      SeasonsRepository.getSeason(prevYear, prevSeason)
        .then((season) => {
          if (season && season.id) {
            setRecapMonth(prevSeason);
            setRecapYear(prevYear);
            setShowRecapBanner(true);
          }
        })
        .catch(() => {});
    });
  }, []);

  const dismissRecapBanner = useCallback(() => {
    setShowRecapBanner(false);
    const key = `${recapYear}-${String(recapMonth).padStart(2, '0')}`;
    localStorage.setItem('recapBannerDismissed', key);
  }, [recapMonth, recapYear]);

  const bettingDeadline = useMemo(
    () => (currentWeek?.startDate ? getBettingDeadline(currentWeek.startDate) : null),
    [currentWeek?.startDate]
  );

  const formatWeekDates = (week: BettingWeek) => {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-regular">Chargement...</p>
        </div>
      </div>
    );
  }

  // Empty state - no betting week active and no history
  if (!currentWeek && recentBets.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-center text-title mb-4">Paris</h1>

          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-6">
              <Image
                src="/illustrations/empty-bets.svg"
                alt="Aucun pari"
                width={240}
                height={200}
                priority
              />
            </div>

            <div className="text-center max-w-sm">
              <h2 className="text-heading text-white mb-2">
                Les paris arrivent bientôt !
              </h2>
              <p className="text-regular text-neutral-400 mb-6">
                Aucune semaine de paris n&apos;est active pour le moment.
                Revenez plus tard pour placer vos pronostics !
              </p>

              <Link href="/betting/rankings">
                <Button variant="primary" className="gap-2">
                  <MdLeaderboard className="text-lg" />
                  Voir le classement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <h1 className="text-center text-title mb-2">Paris</h1>

        {/* Season Recap Banner */}
        {showRecapBanner && recapMonth > 0 && (
          <div
            onClick={() => setShowRecapModal(true)}
            className="relative bg-gradient-to-r from-purple-600/20 to-primary-600/20 border border-purple-500/30 rounded-xl p-3 cursor-pointer hover:border-purple-500/50 transition-colors"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissRecapBanner();
              }}
              className="absolute top-2 right-2 text-neutral-500 hover:text-white text-xs p-1"
              aria-label="Fermer"
            >
              ✕
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <MdAutoAwesome className="text-xl text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  Le récap de {
                    ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                    ][recapMonth - 1]
                  } est disponible !
                </p>
                <p className="text-xs text-neutral-400">
                  Découvrez les highlights de la saison passée
                </p>
              </div>
              <span className="text-purple-400 text-sm shrink-0">→</span>
            </div>
          </div>
        )}

        {/* Main Action Card - Current Week */}
        {currentWeek && (
          <Card className="p-0 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-linear-to-r from-primary-600 to-primary-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-100 opacity-80">Semaine en cours</p>
                  <p className="text-bold text-white">{formatWeekDates(currentWeek)}</p>
                </div>
                {currentWeek.status === BettingWeekStatus.OPEN && bettingDeadline && (
                  <Countdown
                    label=""
                    targetDate={bettingDeadline}
                    thresholds={{ warningSeconds: 86400, criticalSeconds: 7200 }}
                    expiredLabel="Fermé"
                    compact
                  />
                )}
                {currentWeek.status !== BettingWeekStatus.OPEN && (
                  <Badge variant="default">Fermé</Badge>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {currentBet ? (
                // User has already bet - show picks + countdown
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <MdCheckCircle className="text-xl" />
                    <span className="text-bold">Pari enregistré</span>
                  </div>

                  {/* Bet picks */}
                  <div className="space-y-2">
                    {currentBet.picks
                      .sort((a, b) => {
                        const order = { [BetPosition.FIRST]: 1, [BetPosition.SECOND]: 2, [BetPosition.THIRD]: 3 };
                        return order[a.position] - order[b.position];
                      })
                      .map((pick) => (
                        <div
                          key={pick.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-800 border border-neutral-700"
                        >
                          <PositionMedal position={pick.position} isCorrect={undefined} isFinalized={false} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white truncate">
                                {pick.competitor
                                  ? formatCompetitorName(pick.competitor.firstName, pick.competitor.lastName)
                                  : `#${pick.competitorId.slice(0, 8)}`}
                              </span>
                              {pick.hasBoost && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning-500/20 text-warning-500 text-xs font-semibold">
                                  <MdBolt className="w-3 h-3" />
                                  x2
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-500">
                              Cote {formatOdds(pick.oddAtBet)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Countdown to results */}
                  <Countdown
                    label="Résultats dans"
                    targetDate={new Date(currentWeek.endDate)}
                    thresholds={{ warningSeconds: 86400, criticalSeconds: 7200 }}
                    expiredLabel="Résultats disponibles"
                  />

                  <Link href="/betting/history?tab=mine">
                    <Button variant="secondary" size="sm" className="w-full gap-2">
                      <MdCasino className="text-lg" />
                      Voir mes paris
                    </Button>
                  </Link>
                </div>
              ) : currentWeek.status === BettingWeekStatus.OPEN ? (
                // No bet yet, week is open
                <div className="space-y-3">
                  <p className="text-regular text-neutral-300">
                    Pronostiquez le podium de la semaine et gagnez des points !
                  </p>
                  <Link href="/betting/place-bet">
                    <Button variant="primary" className="w-full gap-2">
                      <MdCasino className="text-lg" />
                      Parier maintenant
                    </Button>
                  </Link>
                </div>
              ) : (
                // Week closed, no bet placed
                <div className="text-center py-2">
                  <p className="text-regular text-neutral-400">
                    Les paris sont fermés pour cette semaine
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Week Odds Preview — only when week is OPEN */}
        {currentWeek && currentWeek.status === BettingWeekStatus.OPEN && (
          <WeekOddsPreview weekId={currentWeek.id} />
        )}

        {/* Paris Live */}
        <Link href="/betting/live" className="block">
          <Card className="p-0 overflow-hidden hover:border-orange-500/50 transition-colors cursor-pointer">
            <div className="bg-linear-to-r from-orange-600 to-red-500 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MdCameraAlt className="text-xl text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-bold text-white">Paris en direct</p>
                  <p className="text-xs text-white/70">
                    Pariez sur le gagnant avant chaque course
                  </p>
                </div>
                <span className="text-white/60 text-sm">→</span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* User Ranking Card */}
          <Link href="/betting/rankings">
            <Card className="p-4 hover:border-primary-500 transition-colors cursor-pointer h-full">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2">
                  <MdEmojiEvents className="text-2xl text-yellow-400" />
                </div>
                <p className="text-sub text-neutral-400 mb-1">Mon rang</p>
                {userRanking ? (
                  <p className="text-statistic font-bold text-white">#{userRanking.rank}</p>
                ) : (
                  <p className="text-statistic font-bold text-neutral-500">-</p>
                )}
              </div>
            </Card>
          </Link>

          {/* Points Card */}
          <Card className="p-4 h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <MdTrendingUp className="text-2xl text-green-400" />
              </div>
              <p className="text-sub text-neutral-400 mb-1">Points cette saison</p>
              {userRanking ? (
                <p className="text-statistic font-bold text-white">{userRanking.totalPoints}</p>
              ) : (
                <p className="text-statistic font-bold text-neutral-500">0</p>
              )}
            </div>
          </Card>
        </div>

        {/* Duels Section */}
        {(activeDuels.length > 0 || recentDuels.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MdSportsMma className="text-lg text-primary-400" />
                <h2 className="text-bold text-white">Duels</h2>
                {activeDuels.length > 0 && (
                  <Badge variant="primary" size="sm">{activeDuels.length} actif{activeDuels.length > 1 ? 's' : ''}</Badge>
                )}
              </div>
              <Link href="/betting/duels" className="text-sm text-primary-400 hover:text-primary-300">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              {activeDuels.slice(0, 2).map((duel) => (
                <DuelCard key={duel.id} duel={duel} currentUserId={user?.id} compact />
              ))}
              {activeDuels.length === 0 && recentDuels.slice(0, 2).map((duel) => (
                <DuelCard key={duel.id} duel={duel} currentUserId={user?.id} compact />
              ))}
            </div>
          </div>
        )}

        {/* Recent Community Bets */}
        {recentBets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-bold text-white">Derniers paris</h2>
              <Link href="/betting/history" className="text-sm text-primary-400 hover:text-primary-300">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              {recentBets.map((bet) => (
                <CommunityBetCard
                  key={bet.id}
                  bet={bet}
                  isCurrentUser={!!internalUserId && bet.userId === internalUserId}
                  variant="compact"
                  currentUserHasBet={!!currentBet}
                  weekClosed={currentWeek?.status !== BettingWeekStatus.OPEN}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-2">
          <h2 className="text-bold text-white mb-3">Navigation</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/betting/history">
              <Card className="p-4 hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MdHistory className="text-xl text-blue-400" />
                  </div>
                  <span className="text-regular text-white">Historique</span>
                </div>
              </Card>
            </Link>
            <Link href="/betting/rankings">
              <Card className="p-4 hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <MdLeaderboard className="text-xl text-yellow-400" />
                  </div>
                  <span className="text-regular text-white">Classement</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Season Recap Modal */}
        {showRecapModal && recapMonth > 0 && (
          <SeasonRecapModal
            year={recapYear}
            month={recapMonth}
            onClose={() => setShowRecapModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BettingPage;
