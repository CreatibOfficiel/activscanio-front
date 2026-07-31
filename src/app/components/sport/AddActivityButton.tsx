'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { MdAdd } from 'react-icons/md';
import AddActivitySheet from './AddActivitySheet';
import { Sport, useSportPreference } from '../../hooks/useSportPreference';

interface AddActivityButtonProps {
  className?: string;
}

/**
 * Each label names its sport. The control's whole advantage over the
 * both-sports variant is that the user knows the destination before pressing,
 * and "Ajouter un match" alone does not carry that for anyone who has not
 * already worked out which sport they are being shown.
 */
const SINGLE_SPORT: Record<Sport, { href: string; label: string }> = {
  'mario-kart': { href: '/races/add', label: 'Ajouter une course Mario Kart' },
  'ping-pong': { href: '/pingpong/add', label: 'Ajouter un match de ping-pong' },
};

const FAB_CLASSES =
  'fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary-500/20 backdrop-blur-xl border-2 border-primary-500/50 text-primary-400 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary-500/30 hover:border-primary-400 hover:text-primary-300 z-40 group';

/**
 * The floating add control.
 *
 * Its shape follows from how many sports the user follows, and the two are
 * genuinely different controls rather than one with a branch inside:
 *
 * - One sport: a link straight to that sport's entry screen, named after it.
 *   There is nothing to choose, so a sheet would be a dialog with one answer,
 *   and a generic "Ajouter" would throw away the one thing the direct link
 *   gives — knowing where you are going before you press.
 * - Both: a button opening a sheet with the two destinations.
 *
 * While the preference is still loading, this renders nothing. The hook
 * answers 'both' in flight, which is the right default for a leaderboard —
 * showing a sport someone ignores beats hiding one they play — and the wrong
 * one here. Trusting it would render the choice button, then swap it for a
 * direct link to a different destination the moment the real value lands, on
 * a phone, under a thumb already moving toward the target. A few hundred
 * milliseconds of nothing is cheaper than a wrong screen to back out of.
 */
const AddActivityButton: FC<AddActivityButtonProps> = ({ className = '' }) => {
  const { sports, followsBoth, loading } = useSportPreference();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (loading) return null;

  if (!followsBoth) {
    const sport = sports[0];
    if (!sport) return null;
    const { href, label } = SINGLE_SPORT[sport];

    return (
      <Link
        href={href}
        aria-label={label}
        data-testid="add-activity"
        className={`${FAB_CLASSES} ${className}`}
      >
        <div className="absolute inset-0 rounded-2xl bg-primary-500/10 blur-xl group-hover:bg-primary-500/20 transition-colors" />
        <MdAdd className="text-3xl relative z-10" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        aria-label="Ajouter une activité"
        aria-haspopup="dialog"
        aria-expanded={isSheetOpen}
        data-testid="add-activity"
        className={`${FAB_CLASSES} ${className}`}
      >
        <div className="absolute inset-0 rounded-2xl bg-primary-500/10 blur-xl group-hover:bg-primary-500/20 transition-colors" />
        <MdAdd className="text-3xl relative z-10" aria-hidden="true" />
      </button>

      {/* Mounted only for someone who has a choice to make: an unopened sheet
          still costs a portal and a keydown listener on every screen. */}
      {isSheetOpen && (
        <AddActivitySheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </>
  );
};

export default AddActivityButton;
