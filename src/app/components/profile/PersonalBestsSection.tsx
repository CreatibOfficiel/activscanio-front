'use client';

import { FC, ReactNode, useMemo } from 'react';
import {
  MdEmojiEvents,
  MdLocalFireDepartment,
  MdSportsTennis,
  MdTrendingUp,
} from 'react-icons/md';
import { Competitor } from '../../models/Competitor';
import { PingpongPlayer } from '../../models/Pingpong';
import type { CompetitorStats } from '../../profile/page';
import { buildPersonalBests, FormReading } from '../../utils/personal-bests';

interface PersonalBestsSectionProps {
  /** Whose profile this is. The only competitor read anywhere below. */
  competitor: Competitor | null;
  stats: CompetitorStats | null;
  /** Present only for players who have played ping-pong. */
  pingpongPlayer?: PingpongPlayer | null;
  /**
   * Accepted and deliberately unused, both of these.
   *
   * A caller already holding the leaderboard will pass it without thinking,
   * and a prop that quietly does nothing is safer than one that tempts
   * someone into a comparison. Their presence is asserted on in the tests:
   * the section must render byte-identically whatever they contain.
   */
  allCompetitors?: Competitor[];
  competitorRank?: number;
  className?: string;
}

/**
 * Personal bests. The records nobody else can take away.
 *
 * The rest of the app is built on rank, and rank is zero-sum: in a
 * 25-person office, half the players are in the bottom half by
 * construction, and no effort of theirs changes that unless a colleague
 * gets worse. Strava, Peloton, Garmin and Apple Fitness all resolved this
 * the same way — two surfaces over one event. One comparative leaderboard
 * anyone can be displaced from, and one set of medals "awarded for your
 * best personal performances", in Strava's words, that nobody else touches.
 *
 * This is the second surface. The rule it holds itself to: can another
 * person's activity change this number? Everything here answers no. That is
 * also why `allCompetitors` and `competitorRank` are accepted and ignored,
 * and why a test renders the section twice with wildly different fields and
 * asserts the HTML is identical.
 *
 * A card whose figure is unavailable is dropped rather than rendered as 0.
 * "Meilleure position : 0" is not a position, and "0 %" reads as having
 * lost everything. When no card survives, the section invites a first race
 * instead of showing an empty box.
 *
 * Not here, on purpose:
 * - Peak rating: Glicko-2 falls as well as rises and the RD decay cron
 *   lowers a rating over a holiday. A peak you sit below is a failed goal.
 * - "Most improved": a ranking in disguise, one winner and 24 losers,
 *   gameable by sandbagging, unwinnable for a top-4 player.
 * - Race and match counts: the achievement system already tells that story.
 */
const PersonalBestsSection: FC<PersonalBestsSectionProps> = ({
  competitor,
  stats,
  pingpongPlayer = null,
  className = '',
}) => {
  const bests = useMemo(
    () => buildPersonalBests({ competitor, stats, pingpongPlayer }),
    [competitor, stats, pingpongPlayer],
  );

  return (
    <section
      data-testid="pb-section"
      className={`rounded-xl border border-neutral-700 bg-neutral-800 p-4 ${className}`}
    >
      <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-white">
        <MdEmojiEvents className="text-gold-500" />
        <span>Mes records</span>
      </h3>
      <p className="mb-3 text-xs text-neutral-500">
        Tes performances à toi. Personne ne peut te les enlever.
      </p>

      {bests.isEmpty ? (
        <div data-testid="pb-empty" className="py-6 text-center">
          <p className="mb-2 text-3xl">🏁</p>
          <p className="text-sm text-neutral-400">Aucun record pour l’instant</p>
          <p className="mt-1 text-xs text-neutral-500">
            Lance une première course pour ouvrir ton palmarès.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {bests.bestPosition !== null && (
            <BestCard
              testId="pb-best-position"
              icon={<MdEmojiEvents className="text-gold-500" />}
              label="Meilleure position"
              value={formatPosition(bests.bestPosition)}
              valueClass="text-gold-500"
              caption="Ton sommet personnel"
            />
          )}

          {bests.streak !== null && (
            <BestCard
              testId="pb-streak"
              icon={<MdLocalFireDepartment className="text-emerald-400" />}
              label="Plus longue série"
              value={`${bests.streak.best} j`}
              valueClass="text-emerald-400"
              caption={
                bests.streak.isAtBest
                  ? 'Record égalé en ce moment'
                  : `Série en cours : ${bests.streak.current} j`
              }
            />
          )}

          {bests.form !== null && (
            <BestCard
              testId="pb-form"
              dataDirection={bests.form.direction}
              icon={<MdTrendingUp className={FORM_STYLES[bests.form.direction]} />}
              label="Forme du moment"
              value={formatForm(bests.form)}
              valueClass={FORM_STYLES[bests.form.direction]}
              // Named explicitly so nobody reads this as a comparison with
              // the rest of the office.
              caption={`Ta moyenne de toujours : ${bests.form.lifetimeAvg.toFixed(1)}`}
            />
          )}

          {bests.setsRatio !== null && (
            <BestCard
              testId="pb-sets-ratio"
              icon={<MdSportsTennis className="text-primary-400" />}
              label="Sets gagnés"
              value={`${bests.setsRatio} %`}
              valueClass="text-primary-400"
              caption="Sur tous tes sets joués"
            />
          )}
        </div>
      )}
    </section>
  );
};

const FORM_STYLES: Record<FormReading['direction'], string> = {
  better: 'text-success-500',
  worse: 'text-error-500',
  level: 'text-neutral-300',
};

/** "1er" reads better than "1" for a podium finish; the rest take "e". */
function formatPosition(position: number): string {
  return position === 1 ? '1er' : `${position}e`;
}

/**
 * Form as a signed number of places, in the direction a human reads.
 *
 * `delta` is a magnitude and `direction` carries the sign, so "+1,5" here
 * always means "one and a half places higher up the field" — never the
 * raw subtraction, which is negative for an improvement and would be read
 * as a loss by everyone who saw it.
 */
function formatForm(form: FormReading): string {
  if (form.direction === 'level') return 'Stable';
  const sign = form.direction === 'better' ? '+' : '−';
  return `${sign}${form.delta.toFixed(1)} pl.`;
}

interface BestCardProps {
  testId: string;
  dataDirection?: string;
  icon: ReactNode;
  label: string;
  value: string;
  valueClass: string;
  caption: string;
}

const BestCard: FC<BestCardProps> = ({
  testId,
  dataDirection,
  icon,
  label,
  value,
  valueClass,
  caption,
}) => (
  <div
    data-testid={testId}
    data-direction={dataDirection}
    className="rounded-lg border border-neutral-600/60 bg-neutral-900/40 p-3"
  >
    <div className="mb-1 flex items-center gap-1.5 text-xs text-neutral-400">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    <p className="mt-0.5 text-[11px] leading-tight text-neutral-500">{caption}</p>
  </div>
);

export default PersonalBestsSection;
