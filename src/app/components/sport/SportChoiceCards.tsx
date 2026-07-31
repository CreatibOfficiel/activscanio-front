'use client';

import { FC, KeyboardEvent } from 'react';
import { MdCheck } from 'react-icons/md';
import { SportPreference } from '../../repositories/UsersRepository';

/** Which sports are ticked. Not a SportPreference — see below. */
export interface SportChoice {
  marioKart: boolean;
  pingpong: boolean;
}

interface SportChoiceCardsProps {
  marioKart: boolean;
  pingpong: boolean;
  onChange: (next: SportChoice) => void;
  className?: string;
}

/**
 * Convert two ticks into the stored preference.
 *
 * The column is 'mario-kart' | 'ping-pong' | 'both' and has no value for
 * "neither", so this returns null there rather than picking one. Every
 * plausible pick is the opposite of what the user just did: 'both' turns
 * "none of this" into "all of it", and either single sport keeps a sport they
 * just removed. Callers must decide what to do with null — onboarding
 * disables Continue, settings refuses the write.
 */
export function toSportPreference(choice: SportChoice): SportPreference | null {
  if (choice.marioKart && choice.pingpong) return 'both';
  if (choice.marioKart) return 'mario-kart';
  if (choice.pingpong) return 'ping-pong';
  return null;
}

const SPORTS = [
  {
    key: 'marioKart' as const,
    icon: '🏎️',
    label: 'Mario Kart',
    description: 'Courses et classement ELO',
  },
  {
    key: 'pingpong' as const,
    icon: '🏓',
    label: 'Ping-Pong',
    description: 'Matchs et classement ELO',
  },
];

/**
 * Pick which sports you follow.
 *
 * Two checkboxes rather than three exclusive options. "Both" is not something
 * a user picks; it is what the storage column calls two boxes being ticked.
 * Modelling it as a third choice forces an ordering question with no good
 * answer, and makes following both read as a different kind of answer from
 * following one.
 *
 * The keyboard handling is onKeyDown, not the onKeyPress used by the
 * onboarding step this mirrors. onKeyPress is deprecated in React and never
 * fires for Space — the one key role="checkbox" actually mandates — so those
 * cards cannot be toggled by the key their own role promises. Space is also
 * preventDefault'd, otherwise it scrolls the answer off screen.
 */
const SportChoiceCards: FC<SportChoiceCardsProps> = ({
  marioKart,
  pingpong,
  onChange,
  className = '',
}) => {
  const value: SportChoice = { marioKart, pingpong };

  const toggle = (key: keyof SportChoice) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    key: keyof SportChoice,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Space scrolls the page by default, which would push the choice the
      // user just made out of view.
      event.preventDefault();
      toggle(key);
    }
  };

  return (
    <div className={`grid grid-cols-1 gap-3 ${className}`}>
      {SPORTS.map((sport) => {
        const checked = value[sport.key];

        return (
          <div
            key={sport.key}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={() => toggle(sport.key)}
            onKeyDown={(event) => handleKeyDown(event, sport.key)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              checked
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl shrink-0" aria-hidden="true">
                {sport.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-bold text-white">{sport.label}</h3>
                <p className="text-sub text-neutral-400">{sport.description}</p>
              </div>
              <div
                aria-hidden="true"
                className={`w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                  checked
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-neutral-600'
                }`}
              >
                {checked && <MdCheck className="text-white text-sm" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SportChoiceCards;
