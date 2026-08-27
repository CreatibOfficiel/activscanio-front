/**
 * How many seasons in a row someone has played, per sport.
 *
 * This replaces the "Saisons Consécutives" card on the stats tab, which read
 * `UserStats.consecutiveMonthlyWins` — a betting-era field the API stopped
 * sending, so the card rendered its label above an empty space. The number
 * people actually want is participation, and it is already derivable from the
 * season archives: a competitor appears in a season's rankings only if they
 * played it.
 *
 * Split by sport rather than combined because the two started at different
 * times. Mario Kart has run since season 1; ping-pong only since season 7. A
 * single figure would silently mean "seasons of whichever sport existed",
 * which is not a streak anyone can act on.
 */

/** One archived season, newest first or oldest first — order does not matter. */
export interface SeasonParticipation {
  /** Sortable season key. Seasons are monthly, so year*100+month orders them. */
  sortKey: number;
  /** Whether the player took part in this season. */
  played: boolean;
}

/**
 * The current run of consecutive seasons played, counting back from the most
 * recent archived season.
 *
 * Counts back from the LATEST season rather than reporting the longest run
 * ever: the card sits next to live streak figures, and a streak that silently
 * refers to two years ago would read as current. Someone who skipped the last
 * season gets 0, which is the truthful answer to "how many in a row are you on".
 *
 * @param seasons - Every archived season with whether the player took part
 * @returns The length of the current streak, 0 when the latest season was missed
 */
export function currentSeasonStreak(seasons: SeasonParticipation[]): number {
  // Newest first, so the streak is a prefix scan.
  const ordered = [...seasons].sort((a, b) => b.sortKey - a.sortKey);

  let streak = 0;
  for (const season of ordered) {
    if (!season.played) break;
    streak += 1;
  }
  return streak;
}

/**
 * The longest run of consecutive seasons played, anywhere in the history.
 *
 * Shown as the record beside the current streak, the same pairing the win
 * streak block already uses ("en cours" / "record").
 */
export function bestSeasonStreak(seasons: SeasonParticipation[]): number {
  const ordered = [...seasons].sort((a, b) => a.sortKey - b.sortKey);

  let best = 0;
  let run = 0;
  for (const season of ordered) {
    run = season.played ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}
