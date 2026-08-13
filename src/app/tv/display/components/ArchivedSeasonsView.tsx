"use client";

import { FC, ReactNode, RefObject } from 'react';
import { Card } from '@/app/components/ui';
import {
  SeasonSuperlative,
  SeasonWithHighlights,
  SeasonsOverview,
  SportHighlights,
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
 * One cell: who reached a superlative, and by how much.
 *
 * `stat` is null when the figure cannot be computed — a real state, not an
 * empty one. The first archived season has nothing earlier to subtract, so
 * its rating movement is unknown rather than zero, and the cell prints an em
 * dash rather than a misleading "+0".
 *
 * The name sits above the value rather than beside it: in a column barely
 * wider than a name, putting both on one line truncated whichever came
 * second. Ties print every name — see `formatNames`.
 */
const StatCell: FC<{
  stat: SeasonSuperlative | null;
  format: (value: number) => string;
  tone?: string;
  /** Replaces the dash when the reason for the absence is worth stating. */
  emptyLabel?: string;
}> = ({ stat, format, tone = 'text-neutral-300', emptyLabel }) => {
  if (stat === null) {
    return (
      <div className="min-w-0 text-[11px] text-neutral-600">
        {emptyLabel ?? '—'}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] leading-tight text-neutral-400">
        {formatNames(stat.names)}
      </p>
      <p className={`text-[11px] font-bold leading-tight tabular-nums ${tone}`}>
        {format(stat.value)}
      </p>
    </div>
  );
};

/**
 * The four superlatives, as a row per stat and a column per sport.
 *
 * The emoji in the header IS the column label — a wall screen is read from
 * across a room, and "Mario Kart" / "Ping-pong" spelled out twice on every
 * card costs more width than the figures underneath. Both carry a
 * screen-reader name so the shorthand is not the only cue.
 *
 * THE PING-PONG COLUMN APPEARS ONLY WHEN THAT SPORT HAS DATA. Every closed
 * season sits at zero today — ping-pong started in season 7, still being
 * played — so a permanent second column would be four dashes tall on all six
 * cards. The grid drops to a single sport instead, and picks the column back
 * up on its own the moment a season archives with matches in it.
 */
const SportsTable: FC<{
  mariokart: SportHighlights;
  pingpong: SportHighlights | null;
  inProgress?: boolean;
}> = ({ mariokart, pingpong, inProgress }) => {
  // Each sport counts a different thing, so the unit travels with the
  // column: "51 courses" on one side, "12 matchs" on the other.
  const columns = pingpong
    ? [
        {
          key: 'mk',
          icon: '🏎️',
          label: 'Mario Kart',
          stats: mariokart,
          unit: (v: number) => `${v} course${v > 1 ? 's' : ''}`,
        },
        {
          key: 'pp',
          icon: '🏓',
          label: 'Ping-pong',
          stats: pingpong,
          unit: (v: number) => `${v} match${v > 1 ? 's' : ''}`,
        },
      ]
    : [
        {
          key: 'mk',
          icon: '🏎️',
          label: 'Mario Kart',
          stats: mariokart,
          unit: (v: number) => `${v} course${v > 1 ? 's' : ''}`,
        },
      ];

  const rows = [
    {
      key: 'active',
      icon: '⚡',
      label: 'Le plus actif',
      pick: (s: SportHighlights) => s.mostActive,
      format: null,
      tone: undefined,
      emptyLabel: undefined,
    },
    {
      key: 'climb',
      icon: '📈',
      label: 'Plus grosse progression',
      pick: (s: SportHighlights) => s.biggestClimb,
      format: formatDelta,
      tone: 'text-emerald-400',
      emptyLabel: inProgress ? 'En fin de saison' : undefined,
    },
    {
      key: 'drop',
      icon: '📉',
      label: 'Plus grosse chute',
      pick: (s: SportHighlights) => s.biggestDrop,
      format: formatDelta,
      tone: 'text-red-400',
      emptyLabel: inProgress ? 'En fin de saison' : undefined,
    },
  ];

  const template = `1.25rem repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <div className="space-y-1.5">
      {/* Icons are centred in their cell, both here and on the rows below.
          Left-aligned they sat off to one side of the values they head,
          reading as attached to whatever was nearest rather than to the
          column. */}
      <div className="grid items-center gap-x-2" style={{ gridTemplateColumns: template }}>
        <span />
        {columns.map((column) => (
          <span
            key={column.key}
            className="text-center text-[13px]"
            title={column.label}
          >
            <span aria-hidden="true">{column.icon}</span>
            <span className="sr-only">{column.label}</span>
          </span>
        ))}
      </div>

      {/* The winner keeps its emphasis — a tinted band across the row — but
          lives in the table so ping-pong gets one too. A season in flight has
          a LEADER, not a winner: the trophy and the gold go with having won,
          so a standing that can still change gets a clock and cooler colours
          rather than a title awarded four weeks early. */}
      <div
        className={`grid items-start gap-x-2 rounded-lg px-1.5 py-1 ${
          inProgress ? 'bg-primary-500/10' : 'bg-amber-500/10'
        }`}
        style={{ gridTemplateColumns: template }}
      >
        <span
          className="text-center text-[11px] leading-tight"
          title={inProgress ? 'Leader actuel' : 'Vainqueur'}
        >
          <span aria-hidden="true">{inProgress ? '⏱' : '🏆'}</span>
          <span className="sr-only">
            {inProgress ? 'Leader actuel' : 'Vainqueur'}
          </span>
        </span>
        {columns.map((column) => (
          <div key={column.key} className="min-w-0">
            {column.stats.winner ? (
              <>
                <p
                  className={`truncate text-[11px] font-bold leading-tight ${
                    inProgress ? 'text-primary-100' : 'text-amber-100'
                  }`}
                >
                  {column.stats.winner.name}
                </p>
                <p
                  className={`text-[11px] font-bold leading-tight tabular-nums ${
                    inProgress ? 'text-primary-200/80' : 'text-amber-200/80'
                  }`}
                >
                  {column.stats.winner.rating}
                </p>
              </>
            ) : (
              <p className="text-[11px] leading-tight text-neutral-600">
                {inProgress ? 'Pas de leader' : 'Non classé'}
              </p>
            )}
          </div>
        ))}
      </div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid items-start gap-x-2 px-1.5"
          style={{ gridTemplateColumns: template }}
        >
          <span
            className="text-center text-[11px] leading-tight"
            title={row.label}
          >
            <span aria-hidden="true">{row.icon}</span>
            <span className="sr-only">{row.label}</span>
          </span>
          {columns.map((column) => (
            <StatCell
              key={column.key}
              stat={row.pick(column.stats)}
              // A null `format` means the row counts events, which each
              // sport names differently.
              format={row.format ?? column.unit}
              tone={row.tone}
              emptyLabel={row.emptyLabel}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

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
            {/* Both sports on the totals line. Naming only the races made
                the archive look like a Mario-Kart-only record on a board
                that holds two sports. The ping-pong half is omitted rather
                than shown as 0 while no closed season has any — the sport
                started in season 7, which is still being played. */}
            <Kpi
              label="Saisons"
              value={overview.seasonCount}
              sub={
                overview.totalPingpongMatches > 0
                  ? `${overview.totalRaces} courses · ${overview.totalPingpongMatches} matchs`
                  : `${overview.totalRaces} courses`
              }
            />
            {/* Every value carries its unit. A bare "111" or "+415" on a
                wall screen is a number without a noun — the reader has to
                infer whether it counts races, matches or ELO points, and
                the labels above them do not say. */}
            <Kpi
              label="Courses / saison"
              value={`${overview.avgRacesPerSeason} courses`}
              sub="en moyenne"
            />
            {/* Ping-pong arrived mid-life, so its average is over the seasons
                that HAD it — dividing by every season would fold in a run
                where the sport did not exist and understate it. */}
            <Kpi
              label="Matchs / saison"
              value={
                overview.pingpongSeasonCount > 0
                  ? `${overview.avgPingpongMatchesPerSeason} matchs`
                  : '—'
              }
              sub={
                overview.pingpongSeasonCount > 0
                  ? 'ping-pong, en moyenne'
                  : 'ping-pong pas encore joué'
              }
            />
            {/* "Pilote", not just "Plus titré": the title is won on the
                Mario Kart board and nowhere else. The archive holds two
                sports, so an unqualified superlative leaves the reader to
                guess which one it belongs to. */}
            <Kpi
              label="Pilote le plus titré"
              value={
                overview.mostTitles
                  ? formatNames(overview.mostTitles.names)
                  : '—'
              }
              sub={
                overview.mostTitles
                  ? `${overview.mostTitles.value} saison${overview.mostTitles.value > 1 ? 's' : ''} gagnée${overview.mostTitles.value > 1 ? 's' : ''}`
                  : undefined
              }
            />
            <Kpi
              label="Saison la plus dense"
              value={
                overview.busiestSeason
                  ? `${overview.busiestSeason.totalRaces} courses`
                  : '—'
              }
              sub={overview.busiestSeason?.seasonName}
            />
            {/* Only once a CLOSED season recorded matches. Every archived
                season sits at 0 today, and a tile reading "0 matchs" would
                describe a sport that simply had not started yet. */}
            {overview.busiestPingpongSeason && (
              <Kpi
                label="Saison ping-pong la plus dense"
                value={`${overview.busiestPingpongSeason.totalMatches} matchs`}
                sub={overview.busiestPingpongSeason.seasonName}
              />
            )}
            {/* Also Mario Kart: the climb is measured on the competitor
                ratings, which is the only sport the archive stores rankings
                for today. */}
            <Kpi
              label="Plus grosse progression pilote"
              value={
                overview.bestClimbEver
                  ? `${formatDelta(overview.bestClimbEver.value)} ELO`
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
        {/* Three across, not four. The cards carry a two-column table now,
            and at a quarter of the width a name and its figure could not
            share a line without truncating. */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {seasons.map(({ season, inProgress, sports }) => {
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

              <SportsTable
                mariokart={sports.mariokart}
                pingpong={sports.pingpong}
                inProgress={inProgress}
              />
            </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
