"use client";

import { FC, ReactNode, RefObject } from 'react';
import { Card } from '@/app/components/ui';
import {
  SeasonSuperlative,
  SeasonWithHighlights,
  SeasonsOverview,
} from '@/app/repositories/SeasonsRepository';

interface Props {
  seasons: SeasonWithHighlights[];
  overview: SeasonsOverview | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
}

/**
 * How a superlative's names are printed.
 *
 * Ties keep every name. Season 2 ended with Don Joran and Léo Mibord on 34
 * races each, and picking one would report a result that season did not
 * produce. Past two names the list is abbreviated rather than allowed to
 * push the value off the card.
 */
function formatNames(names: string[]): string {
  if (names.length <= 2) return names.join(' & ');
  return `${names[0]} +${names.length - 1}`;
}

/** A signed ELO figure. The sign is the point, so it is always shown. */
function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * The four weeks a season covered, as "29 juin → 26 juil.".
 *
 * WHY THIS EXISTS AT ALL: nothing else on the card says when the season
 * happened. `seasonNumber` counts from the app's launch week and `month`
 * is the same number under a legacy name, so "Saison 6" is an identifier,
 * not a date. Seasons are 4-week blocks that drift across month boundaries
 * — season 6 ran from late June into late July — which is exactly why a
 * single month label was wrong here before.
 *
 * The month is printed once when both ends share it ("6 → 26 juil."), twice
 * when they do not. Repeating an identical month is noise on a card this
 * dense; dropping it when the season crosses into a new one would be a lie.
 *
 * Returns null rather than a partial range if either end is unparseable —
 * `toLocaleDateString` on an invalid Date yields "Invalid Date", which would
 * be printed verbatim on a screen nobody is standing at.
 */
export function formatSeasonRange(
  startDate: string | undefined,
  endDate: string | undefined,
): string | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const day = (d: Date) => d.getUTCDate();
  const month = (d: Date) =>
    d.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' });

  const left =
    month(start) === month(end)
      ? String(day(start))
      : `${day(start)} ${month(start)}`;

  return `${left} → ${day(end)} ${month(end)}`;
}

/**
 * One line of a season card: an icon, who, and how much.
 *
 * `value` is null when the figure cannot be computed — which is a real state,
 * not an empty one. The first archived season has no earlier season to
 * subtract, so its ELO movement is unknown rather than zero, and the row
 * prints an em dash. Dropping the row instead would make the cards different
 * heights and imply the season was somehow lesser.
 */
const StatLine: FC<{
  icon: string;
  stat: SeasonSuperlative | null;
  format: (value: number) => string;
  tone?: string;
  /** Shown in place of the dash, when the reason the figure is absent is
   *  worth stating — a season in flight has no ELO movement to report yet. */
  emptyLabel?: string;
}> = ({ icon, stat, format, tone = 'text-neutral-300', emptyLabel }) => (
  <div className="flex items-baseline gap-1.5 min-w-0">
    <span aria-hidden="true" className="shrink-0 text-[11px]">
      {icon}
    </span>
    {stat === null ? (
      <span className="text-[11px] text-neutral-600">{emptyLabel ?? '—'}</span>
    ) : (
      <>
        <span className="truncate text-[11px] text-neutral-400">
          {formatNames(stat.names)}
        </span>
        <span className={`ml-auto shrink-0 text-[11px] font-bold tabular-nums ${tone}`}>
          {format(stat.value)}
        </span>
      </>
    )}
  </div>
);

/** One headline figure in the bar above the list. */
const Kpi: FC<{ label: string; value: ReactNode; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="min-w-0">
    <p className="truncate text-[9px] uppercase tracking-wide text-neutral-500">
      {label}
    </p>
    <p className="truncate text-lg font-bold tabular-nums text-white">{value}</p>
    {sub && <p className="truncate text-[9px] text-neutral-400">{sub}</p>}
  </div>
);

/**
 * The archive board: fixed headline figures, then every season.
 *
 * THE KPI BAR SITS OUTSIDE THE SCROLL CONTAINER. `scrollRef` is handed to the
 * list alone, so `useAutoScroll` moves the seasons while the totals stay put
 * under the page's own h1 — the arrangement asked for, and the reason the bar
 * is not simply the first row of the scrolling column.
 *
 * NO ROW CAP. This used to render `slice(0, 12)` with an "et N autres…" line,
 * which silently withheld the rest of the archive on a screen nobody is
 * standing at. The auto-scroll already derives its speed from the content
 * height against the view's dwell, so a 40-season list scrolls faster rather
 * than getting truncated.
 */
export const ArchivedSeasonsView: FC<Props> = ({
  seasons,
  overview,
  scrollRef,
}) => {
  if (!seasons || seasons.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-heading text-neutral-400">Aucune saison archivée</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {overview && (
        <div className="mb-3 shrink-0 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 lg:grid-cols-6">
            <Kpi
              label="Saisons"
              value={overview.seasonCount}
              sub={`${overview.totalRaces} courses`}
            />
            <Kpi
              label="Courses / saison"
              value={overview.avgRacesPerSeason}
              sub="en moyenne"
            />
            {/* Ping-pong arrived mid-life, so its average is over the seasons
                that HAD it — dividing by every season would fold in a run
                where the sport did not exist and understate it. */}
            <Kpi
              label="Matchs ping-pong"
              value={overview.totalPingpongMatches}
              sub={
                overview.pingpongSeasonCount > 0
                  ? `${overview.avgPingpongMatchesPerSeason} / saison`
                  : 'pas encore joué'
              }
            />
            <Kpi
              label="Plus titré"
              value={
                overview.mostTitles
                  ? formatNames(overview.mostTitles.names)
                  : '—'
              }
              sub={
                overview.mostTitles
                  ? `${overview.mostTitles.value} saison${overview.mostTitles.value > 1 ? 's' : ''}`
                  : undefined
              }
            />
            <Kpi
              label="Saison la plus dense"
              value={overview.busiestSeason?.totalRaces ?? '—'}
              sub={overview.busiestSeason?.seasonName}
            />
            <Kpi
              label="Plus grosse progression"
              value={
                overview.bestClimbEver
                  ? formatDelta(overview.bestClimbEver.value)
                  : '—'
              }
              sub={
                overview.bestClimbEver
                  ? `${formatNames(overview.bestClimbEver.names)} · ${overview.bestClimbEver.seasonName}`
                  : undefined
              }
            />
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-hide"
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
          {seasons.map(({ season, inProgress, winner, mostActive, biggestClimb, biggestDrop }) => {
            const seasonRange = formatSeasonRange(
              season.startDate,
              season.endDate,
            );

            return (
            <Card
              key={season.id}
              className={`p-3 transition-colors ${
                inProgress
                  ? 'border-primary-500/60 bg-primary-500/5'
                  : 'hover:border-primary-500'
              }`}
            >
              <div className="mb-2">
                {/* Name and dates, in that order, because they answer
                    different questions. The name is the identifier people
                    actually say ("la S6"); the dates are the only thing on
                    the card that says WHEN. `season.month` holds the SEASON
                    NUMBER for backward compatibility, so the old
                    `monthNames[month - 1]` printed "Juin" on season 6 — a
                    label with no relation to the four weeks it covers. */}
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-base font-bold text-white">
                    {season.seasonName ?? `Saison ${season.seasonNumber}`}
                  </h3>
                  {/* The badge is what separates a season being played from
                      the finished ones around it. Without it the live card
                      reads as just another archive whose numbers happen to
                      be low — a part-played season looks like a quiet one. */}
                  {inProgress && (
                    <span className="shrink-0 rounded-full bg-primary-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary-300">
                      En cours
                    </span>
                  )}
                </div>
                {seasonRange && (
                  <p className="mb-0.5 text-[10px] text-neutral-500">
                    {seasonRange}
                  </p>
                )}
                <p className="text-[10px] text-neutral-400">
                  {season.totalRaces} course{season.totalRaces > 1 ? 's' : ''}
                  {season.totalPingpongMatches !== undefined &&
                    ` · ${season.totalPingpongMatches} match${season.totalPingpongMatches > 1 ? 's' : ''} ping-pong`}
                </p>
              </div>

              {/* A season in flight has a LEADER, not a winner. The trophy
                  and the gold go with having won; using them on a standing
                  that can still change would award a title four weeks early.
                  Same slot, same layout, deliberately cooler colours. */}
              {winner ? (
                <div
                  className={`mb-2 flex items-baseline gap-1.5 rounded-lg px-2 py-1.5 ${
                    inProgress ? 'bg-primary-500/10' : 'bg-amber-500/10'
                  }`}
                >
                  <span aria-hidden="true" className="shrink-0 text-sm">
                    {inProgress ? '⏱' : '🏆'}
                  </span>
                  <span
                    className={`truncate text-xs font-bold ${
                      inProgress ? 'text-primary-100' : 'text-amber-100'
                    }`}
                  >
                    {winner.name}
                  </span>
                  <span
                    className={`ml-auto shrink-0 text-xs font-bold tabular-nums ${
                      inProgress ? 'text-primary-200/80' : 'text-amber-200/80'
                    }`}
                  >
                    {winner.rating}
                  </span>
                </div>
              ) : (
                <div className="mb-2 rounded-lg bg-neutral-800/40 px-2 py-1.5 text-[11px] text-neutral-600">
                  {inProgress ? 'Pas encore de leader' : 'Pas de vainqueur classé'}
                </div>
              )}

              <div className="space-y-1">
                <StatLine
                  icon="⚡"
                  stat={mostActive}
                  format={(v) => `${v} course${v > 1 ? 's' : ''}`}
                />
                {/* On the live card the ELO movement is not missing, it is
                    not measurable yet: the current rating already carries
                    the soft reset applied when the season opened, so a delta
                    against last season's final would report the reset as the
                    player's own doing. Saying so beats a bare dash. */}
                <StatLine
                  icon="📈"
                  stat={biggestClimb}
                  format={formatDelta}
                  tone="text-emerald-400"
                  emptyLabel={inProgress ? 'En fin de saison' : undefined}
                />
                {!inProgress && (
                  <StatLine
                    icon="📉"
                    stat={biggestDrop}
                    format={formatDelta}
                    tone="text-red-400"
                  />
                )}
              </div>
            </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
