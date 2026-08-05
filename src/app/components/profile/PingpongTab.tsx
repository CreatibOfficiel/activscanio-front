'use client';

import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import { PingpongBestWin, PingpongMatch, PingpongPlayer } from '../../models/Pingpong';
import { pingpongRepository } from '../../repositories/PingpongRepository';
import { calibrationProgress, winRate } from '../../utils/pingpong-leaderboard';
import { Skeleton } from '../ui';
import HeadToHeadSection from '../pingpong/HeadToHeadSection';
import BestWinCard from '../pingpong/BestWinCard';

interface PingpongTabProps {
  /**
   * The competitor this profile belongs to. The ping-pong API is keyed on
   * `competitorId` and resolves it to a `PingpongPlayer.id` itself — the two
   * are different strings, and both are strings, so passing the wrong one
   * compiles cleanly and 404s.
   */
  competitorId: string;
  /**
   * Who is reading. 'self' addresses the player directly; the profile page
   * passes nothing and so keeps the copy this component was written with.
   *
   * The leaderboard opens the same component in a sheet for whoever was
   * tapped, and there the second person addresses the wrong person: "tes
   * stats", "ton rang" and a "record a match" button on a colleague's card
   * each claim the numbers belong to the reader.
   */
  perspective?: 'self' | 'other';
  className?: string;
}

/** Weighted matches needed to leave calibration. Mirrors the API. */
const MATCHES_TO_CALIBRATE = 8;

interface Loaded {
  player: PingpongPlayer | null;
  matches: PingpongMatch[];
  opponents: PingpongPlayer[];
  /** Null for a player who has never won. */
  bestWin: PingpongBestWin | null;
}

interface StatProps {
  testId: string;
  label: string;
  value: string;
  accent?: string;
}

const Stat: FC<StatProps> = ({ testId, label, value, accent = 'text-white' }) => (
  <div className="rounded-lg bg-neutral-900/50 p-3 text-center">
    <div
      data-testid={testId}
      className={`text-xl font-bold tabular-nums ${accent}`}
    >
      {value}
    </div>
    <div className="mt-0.5 text-xs text-neutral-400">{label}</div>
  </div>
);

/**
 * The ping-pong section of a player's profile.
 *
 * The rating carries the word "elo" in the layout beside it, not in a
 * tooltip. "1480" alone means nothing to a casual player, and NN/g is
 * explicit that information vital to reading a screen must not require a
 * hover — a tooltip is unreachable on touch and invisible to anyone
 * scanning.
 *
 * A competitor who has never played is a normal state, not a failure.
 * `fetchPlayer` returns null for them by design, and that null is kept
 * strictly apart from a thrown request: one gets an invitation to record a
 * first match, the other an error. Collapsing them would either tell a
 * 40-match player to start playing because the network blinked, or dress a
 * newcomer's empty profile up as a broken app.
 *
 * The match list and leaderboard are secondary and are allowed to fail on
 * their own: losing the rivalry section must not take the rating and record
 * down with it.
 */
const PingpongTab: FC<PingpongTabProps> = ({
  competitorId,
  perspective = 'self',
  className = '',
}) => {
  const isSelf = perspective === 'self';
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const player = await pingpongRepository.fetchPlayer(competitorId);

        // Nobody to build a rivalry list for, and no reason to ask.
        if (!player) {
          if (!cancelled) setData({ player: null, matches: [], opponents: [], bestWin: null });
          return;
        }

        // Secondary data. `allSettled` rather than `all` so one failure
        // leaves the stats above it standing.
        const [matchesResult, boardResult, bestWinResult] =
          await Promise.allSettled([
            pingpongRepository.fetchPlayerMatches(competitorId),
            pingpongRepository.fetchLeaderboard(),
            pingpongRepository.fetchBestWin(competitorId),
          ]);

        if (cancelled) return;
        setData({
          player,
          matches: matchesResult.status === 'fulfilled' ? matchesResult.value : [],
          opponents: boardResult.status === 'fulfilled' ? boardResult.value : [],
          bestWin:
            bestWinResult.status === 'fulfilled' ? bestWinResult.value : null,
        });
      } catch (caught) {
        console.error('Error fetching ping-pong profile:', caught);
        // A flag, not a sentence. The wording depends on who is reading, and
        // storing the finished string here would make `perspective` a
        // dependency of the fetch — a re-read of the API for a copy change.
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [competitorId]);

  if (loading) {
    return (
      <div data-testid="pingpong-tab-loading" className={`space-y-4 ${className}`}>
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="pingpong-tab-error"
        className={`rounded-xl border border-error-500 bg-error-500/10 p-5 text-error-400 ${className}`}
      >
        {isSelf
          ? 'Impossible de charger tes stats ping-pong'
          : 'Impossible de charger ces stats ping-pong'}
      </div>
    );
  }

  // A competitor who has never played. Not an error, and not an empty box.
  if (!data?.player) {
    return (
      <div
        data-testid="pingpong-tab-never-played"
        className={`rounded-xl border border-neutral-700 bg-neutral-800 p-6 text-center ${className}`}
      >
        <p className="mb-3 text-4xl">🏓</p>
        <h3 className="mb-2 text-lg font-bold text-white">
          Pas encore de match
        </h3>
        <p className="mb-4 text-sm text-neutral-400">
          {isSelf
            ? 'Enregistre ton premier match pour lancer ton classement ping-pong.'
            : "Ce joueur n'a pas encore de match enregistré."}
        </p>
        {/* The call to action belongs to whoever owns the profile. On a
            colleague's card it invites the reader to record a match that is
            not theirs to record. */}
        {isSelf && (
          <Link
            href="/pingpong/add"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-primary-400"
          >
            Enregistrer un match
          </Link>
        )}
      </div>
    );
  }

  const { player, matches, opponents } = data;
  const rate = winRate(player);
  // The weighted count is a sum of weights, not a tally — "2.6/8 matchs"
  // reads as a bug, so it is rounded for display only.
  const weighted = Math.round(
    calibrationProgress(player, MATCHES_TO_CALIBRATE) * MATCHES_TO_CALIBRATE,
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <section className="rounded-xl border border-neutral-700 bg-neutral-800 p-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            {/* The word sits beside the number in the layout: a rating with
                no unit is a number nobody can act on. */}
            <p
              data-testid="pingpong-tab-rating"
              className="text-3xl font-bold tabular-nums text-primary-500"
            >
              {Math.round(player.conservativeScore)}
              <span className="ml-1.5 text-xs font-medium uppercase text-neutral-500">
                elo
              </span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Classement ping-pong
            </p>
          </div>

          {player.rank !== null && (
            <p
              data-testid="pingpong-tab-rank"
              className="text-right text-2xl font-bold text-white"
            >
              {player.rank === 1 ? '1er' : `${player.rank}e`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat
            testId="pingpong-tab-record"
            label="Bilan"
            value={`${player.wins}V · ${player.losses}D`}
          />
          <Stat
            testId="pingpong-tab-streak"
            label="Série"
            value={String(player.currentStreak)}
            accent={player.currentStreak > 0 ? 'text-success-500' : 'text-white'}
          />
          <Stat
            testId="pingpong-tab-best-streak"
            label="Record"
            value={String(player.bestStreak)}
            accent="text-primary-400"
          />
        </div>

        {rate !== null && (
          <p className="mt-3 text-center text-xs text-neutral-400">
            <span className="tabular-nums">{rate}%</span> de victoires
          </p>
        )}

        {/* Progress, never a provisional rank: the API withholds the rank on
            purpose, and a number that later moves is worse than none. */}
        {player.provisional && (
          <div className="mt-4 border-t border-neutral-700/60 pt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-neutral-400">En calibrage</span>
              <span
                data-testid="pingpong-tab-calibration"
                className="font-semibold tabular-nums text-white"
              >
                {weighted}/{MATCHES_TO_CALIBRATE} matchs
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-neutral-900"
              role="progressbar"
              aria-valuenow={weighted}
              aria-valuemin={0}
              aria-valuemax={MATCHES_TO_CALIBRATE}
              aria-label="Progression du calibrage"
            >
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{
                  width: `${calibrationProgress(player, MATCHES_TO_CALIBRATE) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">
              {isSelf
                ? 'Ton rang apparaîtra une fois le calibrage terminé.'
                : 'Le rang apparaîtra une fois le calibrage terminé.'}
            </p>
          </div>
        )}
      </section>

      {/* Two personal surfaces, side by side: a record nobody can take, and
          the rivalries that are true whatever your rank. */}
      <BestWinCard bestWin={data.bestWin} perspective={perspective} />

      <HeadToHeadSection
        player={player}
        opponents={opponents.filter((o) => o.id !== player.id)}
        matches={matches}
        perspective={perspective}
      />
    </div>
  );
};

export default PingpongTab;
