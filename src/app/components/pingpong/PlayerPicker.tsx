'use client';

import { FC, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { MdPersonAdd, MdSearch } from 'react-icons/md';
import { SelectablePlayer } from '../../models/Pingpong';
import { formatCompetitorName } from '../../utils/formatters';
import { matchesSearch } from '../../utils/search-text';
import { UserAvatar } from '../ui';

interface PlayerPickerProps {
  /** Names the side of the table, e.g. "Joueur A". Shown and announced. */
  label: string;
  /**
   * Everyone pickable, enrolled or not. The form lists the whole office:
   * on day one nobody has played, and a picker showing only enrolled
   * players would be empty with no way forward.
   */
  players: SelectablePlayer[];
  selectedId: string | null;
  /** Whoever holds the other side. Left out of the list entirely. */
  excludedId: string | null;
  onSelect: (playerId: string) => void;
  className?: string;
}

/**
 * Milliseconds since epoch, or null when they have never played.
 *
 * The field is optional as well as nullable — an older cached response
 * predates it — and both mean the same thing here. An unparseable date is
 * folded into null too: `Date.parse` returns NaN, and NaN in a comparator
 * makes the sort inconsistent, which is unspecified behaviour rather than
 * merely a wrong order.
 */
const lastPlayedAt = (player: SelectablePlayer): number | null => {
  if (!player.lastMatchAt) return null;
  const parsed = Date.parse(player.lastMatchAt);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Most recently played first; never-played last, alphabetically.
 *
 * The office plays in a small rotation, so whoever is being entered has
 * usually played in the last few days. Recency puts them within the first
 * couple of rows of a list that would otherwise need a search.
 *
 * Never-played colleagues go last rather than first even though they are the
 * ones you cannot find by memory. The roster is the whole office while only
 * a fraction of it plays, so seeding the top with them would push every
 * regular below the fold of a capped, scrolling list — costing a scroll on
 * every entry to save one on the rare first-timer, who is reachable by
 * search anyway.
 *
 * Their tiebreak is the name because they have no other: they are
 * indistinguishable on recency, and API order would reshuffle the tail each
 * time a competitor is added. `localeCompare` so French accents collate
 * where a reader expects (É beside E, not after Z).
 */
const byMostRecentlyPlayed = (
  a: SelectablePlayer,
  b: SelectablePlayer,
): number => {
  const playedA = lastPlayedAt(a);
  const playedB = lastPlayedAt(b);

  if (playedA !== null && playedB !== null) return playedB - playedA;
  if (playedA !== null) return -1;
  if (playedB !== null) return 1;

  return `${a.firstName} ${a.lastName}`.localeCompare(
    `${b.firstName} ${b.lastName}`,
    'fr',
  );
};

/**
 * Picks the player on one side of the table.
 *
 * Single-select, one instance per side, rather than one multi-select for
 * both. A match has two named roles — the scores are recorded from A's point
 * of view — so asking "who is A" and "who is B" separately matches the data
 * being entered. A shared multi-select would leave the user to work out
 * which of their two ticks became the left-hand column.
 *
 * The opponent is filtered out rather than disabled. The API refuses a
 * self-match with a CHECK constraint, so the pick can never succeed; NN/g's
 * position on disabled controls is that an option you cannot use and cannot
 * be told why is worse than an option that is not there. Here the reason is
 * self-evident from the other picker, which shows the same person selected.
 *
 * `listbox`/`option` rather than a native `<select>`: the rows carry an
 * avatar, and the list is searched in place. A native select on mobile opens
 * a system wheel that shows text only.
 */
const PlayerPicker: FC<PlayerPickerProps> = ({
  label,
  players,
  selectedId,
  excludedId,
  onSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const searchId = useId();

  // Recency ordering survives the search rather than giving way to relevance
  // ranking. A query narrows ~35 people to a handful, where the order barely
  // matters — and re-ranking on each keystroke moves rows under a finger
  // already on its way to one.
  const visible = useMemo(
    () =>
      players
        .filter((player) => player.competitorId !== excludedId)
        .filter((player) =>
          matchesSearch(`${player.firstName} ${player.lastName}`, query),
        )
        // Sorted after filtering, and on a copy: `players` is a prop, and
        // sorting in place would mutate the caller's array.
        .slice()
        .sort(byMostRecentlyPlayed),
    [players, excludedId, query],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={searchId}
        className="text-sm font-semibold text-neutral-300"
      >
        {label}
      </label>

      <div className="relative">
        <MdSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un joueur"
          autoComplete="off"
          aria-label={`Rechercher ${label}`}
          className="w-full h-11 pl-10 pr-3 rounded-lg bg-neutral-800 text-neutral-100
            border border-neutral-700 placeholder:text-neutral-500
            focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40
            transition-colors"
        />
      </div>

      <ul
        role="listbox"
        aria-label={label}
        // Read by the page test to assert which player each side holds
        // without depending on how selection is styled.
        data-selected-id={selectedId ?? ''}
        // A capped, scrolling list: on a phone, an unbounded roster would
        // push the score fields — the reason the user opened the page — off
        // the bottom of the screen.
        className="max-h-52 overflow-y-auto flex flex-col gap-1 rounded-lg
          bg-neutral-800/40 border border-neutral-700 p-1"
      >
        {visible.map((player) => {
          const isSelected = player.competitorId === selectedId;
          return (
            <li key={player.competitorId}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(player.competitorId)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left
                  min-h-[44px] transition-colors
                  ${
                    isSelected
                      ? 'bg-primary-500/20 ring-1 ring-primary-500'
                      : 'hover:bg-neutral-700/50'
                  }`}
              >
                <UserAvatar
                  src={player.profilePictureUrl}
                  name={`${player.firstName} ${player.lastName}`}
                  size="sm"
                />
                <span className="text-sm font-medium text-white truncate">
                  {formatCompetitorName(player.firstName, player.lastName)}
                </span>
              </button>
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="px-3 py-4 text-sm text-neutral-400 text-center">
            Aucun joueur trouvé
          </li>
        )}
      </ul>

      {/* Outside the listbox on purpose: it navigates away rather than
          picking someone, so announcing it as an option would promise the
          wrong thing. Always shown, and most useful precisely when the
          search found nobody — that is when you want to add them. Mirrors
          the row the Mario Kart race form already ends its picker with. */}
      <Link
        href="/competitors/add"
        data-testid="picker-add-player"
        className="flex items-center gap-3 py-3 px-2 mt-1 text-left rounded-lg hover:bg-neutral-800/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center flex-shrink-0">
          <MdPersonAdd size={20} className="text-neutral-400" />
        </div>
        <span className="text-neutral-300 font-medium text-sm">
          Ajouter un joueur
        </span>
      </Link>
    </div>
  );
};

export default PlayerPicker;
