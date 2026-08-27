'use client';

import { FC, useEffect, useState } from 'react';
import { SeasonsRepository } from '../../repositories/SeasonsRepository';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import {
  SeasonParticipation,
  bestSeasonStreak,
  currentSeasonStreak,
} from '../../utils/consecutive-seasons';
import { Skeleton } from '../ui';

interface ConsecutiveSeasonsSectionProps {
  /** The competitor this profile belongs to. Absent for a spectator. */
  competitorId?: string | null;
  /** Whether this user follows ping-pong, so the second block matches the tabs. */
  showsPingpong?: boolean;
  className?: string;
}

interface SportStreak {
  current: number;
  best: number;
  /** Seasons of this sport that have been archived at all. */
  seasonsAvailable: number;
}

interface Loaded {
  marioKart: SportStreak;
  pingpong: SportStreak;
}

interface BlockProps {
  title: string;
  icon: string;
  streak: SportStreak;
  accent: string;
  /** Shown instead of the figures when the sport has no archived season yet. */
  emptyHint: string;
}

const StreakBlock: FC<BlockProps> = ({
  title,
  icon,
  streak,
  accent,
  emptyHint,
}) => (
  <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700 border-l-4 border-l-emerald-500">
    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
      <span>{icon}</span>
      <span>{title}</span>
    </h3>
    <p className="text-xs text-neutral-500 mb-4">
      Saisons consécutives où tu as joué.
    </p>

    {streak.seasonsAvailable === 0 ? (
      <p className="py-4 text-center text-sm text-neutral-400">{emptyHint}</p>
    ) : (
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div
            data-testid={`consecutive-current-${title}`}
            className={`text-4xl font-bold tabular-nums ${accent}`}
          >
            {streak.current}
          </div>
          <p className="mt-1 text-sm text-neutral-400">en cours</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold tabular-nums text-yellow-400">
            {streak.best}
          </div>
          <p className="mt-1 text-sm text-neutral-400">record</p>
        </div>
      </div>
    )}
  </div>
);

/**
 * Consecutive seasons played, one block per sport.
 *
 * Replaces the single "Saisons Consécutives" card, which read a betting-era
 * field (`consecutiveMonthlyWins`) the API no longer sends and so rendered
 * blank. Participation is derived from the season archives instead: a player
 * appears in a season's rankings only if they played it.
 *
 * The two sports are counted separately because they did not start together —
 * Mario Kart has run since season 1, ping-pong only since season 7. One
 * combined figure would mean "seasons of whichever sport existed at the time",
 * which is not a streak anyone can act on.
 */
const ConsecutiveSeasonsSection: FC<ConsecutiveSeasonsSectionProps> = ({
  competitorId,
  showsPingpong = true,
  className = '',
}) => {
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const seasons = await SeasonsRepository.getAllSeasons();

        // The ping-pong archives are keyed on `playerId`, which is NOT the
        // competitor id — the two are different strings and both are strings,
        // so matching on the wrong one silently finds nothing. Resolve it once
        // off the live board rather than per season.
        const players = await pingpongRepository
          .fetchLeaderboard()
          .catch(() => []);
        const myPlayerId =
          players.find((p) => p.competitorId === competitorId)?.id ?? null;

        const perSeason = await Promise.all(
          seasons.map(async (season) => {
            const [mk, pp] = await Promise.all([
              SeasonsRepository.getCompetitorRankings(
                season.year,
                season.month,
              ).catch(() => []),
              SeasonsRepository.getPingpongRankings(
                season.year,
                season.month,
              ).catch(() => []),
            ]);

            const sortKey = season.year * 100 + season.month;
            return {
              sortKey,
              // A season counts as played only if it actually holds a
              // standing for this sport; an empty archive means the sport
              // had not started, not that the player skipped it.
              mkHeld: mk.length > 0,
              ppHeld: pp.length > 0,
              mkPlayed: mk.some((r) => r.competitorId === competitorId),
              ppPlayed: myPlayerId
                ? pp.some((r) => r.playerId === myPlayerId)
                : false,
            };
          }),
        );

        if (cancelled) return;

        const toStreak = (
          held: (s: (typeof perSeason)[number]) => boolean,
          played: (s: (typeof perSeason)[number]) => boolean,
        ): SportStreak => {
          const relevant = perSeason.filter(held);
          const participation: SeasonParticipation[] = relevant.map((s) => ({
            sortKey: s.sortKey,
            played: played(s),
          }));
          return {
            current: currentSeasonStreak(participation),
            best: bestSeasonStreak(participation),
            seasonsAvailable: relevant.length,
          };
        };

        setData({
          marioKart: toStreak((s) => s.mkHeld, (s) => s.mkPlayed),
          pingpong: toStreak((s) => s.ppHeld, (s) => s.ppPlayed),
        });
      } catch (error) {
        console.error('Error loading consecutive seasons:', error);
        // Leave the blocks off rather than showing zeroes a failed request
        // cannot back up — a 0 here reads as "you never played".
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [competitorId]);

  // A spectator has no seasons to count.
  if (!competitorId) return null;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <Skeleton className="h-40 rounded-xl" />
        {showsPingpong && <Skeleton className="h-40 rounded-xl" />}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <StreakBlock
        title="Mario Kart"
        icon="🏁"
        streak={data.marioKart}
        accent="text-emerald-400"
        emptyHint="Ton palmarès démarrera à la fin de la saison."
      />
      {showsPingpong && (
        <StreakBlock
          title="Ping-pong"
          icon="🏓"
          streak={data.pingpong}
          accent="text-primary-400"
          emptyHint="Aucune saison de ping-pong archivée pour l'instant."
        />
      )}
    </div>
  );
};

export default ConsecutiveSeasonsSection;
