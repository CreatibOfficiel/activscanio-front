'use client';

import { FC, useId, useMemo, useState } from 'react';
import { MdSearch } from 'react-icons/md';
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

  const visible = useMemo(
    () =>
      players
        .filter((player) => player.competitorId !== excludedId)
        .filter((player) =>
          matchesSearch(`${player.firstName} ${player.lastName}`, query),
        ),
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
    </div>
  );
};

export default PlayerPicker;
