'use client';

import { NextPage } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { MdSwapVert, MdEmojiEvents } from 'react-icons/md';
import { Button, PageHeader, Spinner } from '@/app/components/ui';
import PlayerPicker from '@/app/components/pingpong/PlayerPicker';
import ScoreInput from '@/app/components/pingpong/ScoreInput';
import { useMatchEntry } from '@/app/hooks/useMatchEntry';
import { PingpongPlayer } from '@/app/models/Pingpong';
import { pingpongRepository } from '@/app/repositories/PingpongRepository';
import { formatCompetitorName } from '@/app/utils/formatters';

/**
 * Strip the repository's own prefix off a rejection.
 *
 * `recordMatch` throws `Error recording match: <server text>`. The part after
 * the colon is the server naming which scoring rule broke — the only part
 * that tells the user what to change — so it is what gets shown, and the
 * English prefix is not.
 */
function serverMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const withoutPrefix = raw.replace(/^Error recording match:\s*/, '').trim();
  return withoutPrefix === '' ? 'Le match n’a pas pu être enregistré' : withoutPrefix;
}

/**
 * Record a ping-pong match.
 *
 * Both sides are picked by name and the winner is reported back by name,
 * never as the letters A and B. A and B are how the scores are stored — from
 * A's point of view — but they are an implementation of the data model, and
 * confirming "Marc a gagné" is the only readback that lets someone catch a
 * mis-entry before it moves two ratings.
 *
 * The scores are the exception to the single-column form rule. Baymard's
 * one-thing-per-row guidance exempts "highly associated" fields, and the two
 * halves of a set score are the canonical case: 11-5 is one fact, and
 * splitting it across two rows would break the reading order of the thing
 * being copied off the scoreboard.
 */
const AddMatchPage: NextPage = () => {
  const router = useRouter();
  const { getToken } = useAuth();

  const [players, setPlayers] = useState<PingpongPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    playerAId,
    playerBId,
    setPlayerA,
    setPlayerB,
    sets,
    setScore,
    swapSides,
    invalidSetIndices,
    error,
    winner,
    setsA,
    setsB,
    canSubmit,
    buildPayload,
  } = useMatchEntry();

  useEffect(() => {
    let cancelled = false;

    pingpongRepository
      .fetchLeaderboard()
      .then((list) => {
        if (!cancelled) setPlayers(list);
      })
      .catch(() => {
        if (!cancelled) toast.error('Impossible de charger les joueurs');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  const nameOf = useCallback(
    (id: string | null): string | null => {
      const player = id === null ? undefined : byId.get(id);
      if (!player) return null;
      return formatCompetitorName(player.firstName, player.lastName);
    },
    [byId],
  );

  // The hook says 'A' or 'B'; the page is what turns that back into a person.
  const winnerName =
    winner === 'A' ? nameOf(playerAId) : winner === 'B' ? nameOf(playerBId) : null;

  const nameA = nameOf(playerAId) ?? 'joueur A';
  const nameB = nameOf(playerBId) ?? 'joueur B';

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (payload === null) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken();
      await pingpongRepository.recordMatch(payload, token ?? '');
      toast.success('Match enregistré !');
      router.push('/pingpong');
    } catch (err) {
      // The server re-validates the scores and names the rule that broke.
      // Swallowing that for a generic message leaves the user re-typing the
      // same rejected match.
      setSubmitError(serverMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-6 pb-28">
      <div className="max-w-lg mx-auto">
        <PageHeader
          variant="flow"
          title="Enregistrer un match"
          subtitle="Deux sets gagnants"
          backHref="/pingpong"
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Sides. Stacked, never side by side: two rosters in half a
                phone width truncates every name to a first syllable. */}
            <PlayerPicker
              label="Joueur A"
              players={players}
              selectedId={playerAId}
              excludedId={playerBId}
              onSelect={setPlayerA}
            />

            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={swapSides}
                leftIcon={<MdSwapVert size={18} />}
              >
                Inverser les côtés
              </Button>
            </div>

            <PlayerPicker
              label="Joueur B"
              players={players}
              selectedId={playerBId}
              excludedId={playerAId}
              onSelect={setPlayerB}
            />

            {/* Scores */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-12 shrink-0" aria-hidden="true" />
                <p className="flex-1 text-center text-sm font-semibold text-neutral-300 truncate">
                  {nameA}
                </p>
                <p className="flex-1 text-center text-sm font-semibold text-neutral-300 truncate">
                  {nameB}
                </p>
              </div>

              {sets.map((set, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm font-medium text-neutral-400">
                    Set {index + 1}
                  </span>
                  {/* Two columns on one row: the two halves of a set score
                      are one fact, and the single-column rule exempts
                      highly associated fields for exactly this. */}
                  <ScoreInput
                    label={`Set ${index + 1}, joueur A`}
                    value={set.a}
                    onChange={(value) => setScore(index, 'a', value)}
                    invalid={invalidSetIndices.includes(index)}
                    className="flex-1"
                  />
                  <ScoreInput
                    label={`Set ${index + 1}, joueur B`}
                    value={set.b}
                    onChange={(value) => setScore(index, 'b', value)}
                    invalid={invalidSetIndices.includes(index)}
                    className="flex-1"
                  />
                </div>
              ))}
            </section>

            {/* The readback. A name, because 'A' is not a person. */}
            {winnerName !== null && (
              <div
                data-testid="match-winner"
                className="flex items-center justify-center gap-2 rounded-lg
                  bg-success-500/15 ring-1 ring-success-500/30 px-4 py-3"
              >
                <MdEmojiEvents size={20} className="text-success-500 shrink-0" />
                <p className="text-sm font-semibold text-neutral-100">
                  {winnerName} gagne {Math.max(setsA, setsB)}-
                  {Math.min(setsA, setsB)}
                </p>
              </div>
            )}

            {/* Validation the form can do on its own, before the network. */}
            {error !== null && (
              <p className="text-sm text-error-500 text-center">{error}</p>
            )}

            {/* What the server said, verbatim. */}
            {submitError !== null && (
              <p role="alert" className="text-sm text-error-500 text-center">
                {submitError}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              Enregistrer le match
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMatchPage;
