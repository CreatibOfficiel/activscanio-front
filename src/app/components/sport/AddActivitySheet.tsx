'use client';

import { FC } from 'react';
import Link from 'next/link';
import { MdChevronRight } from 'react-icons/md';
import Modal from '../ui/Modal';

interface AddActivitySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHOICES = [
  {
    href: '/races/add',
    icon: '🏎️',
    label: 'Ajouter une course',
    description: 'Mario Kart',
  },
  {
    href: '/pingpong/add',
    icon: '🏓',
    label: 'Ajouter un match',
    description: 'Ping-Pong',
  },
];

/**
 * The two entry screens, for someone who follows both sports.
 *
 * A sheet rather than a speed-dial FAB. Two actions sits below MUI's own
 * documented three-to-six floor for speed dial, and Material 3's Compose
 * guidance dropped the pattern altogether. The sheet also keeps both targets
 * at full thumb width near the bottom edge, where stacked mini-FABs give
 * small targets in the hardest part of the screen to reach precisely.
 *
 * Both choices are links. They navigate, so middle-click, long-press and
 * cmd-click have to work — a button calling router.push breaks all three and
 * gives no sign it has.
 */
const AddActivitySheet: FC<AddActivitySheetProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    placement="sheet"
    title="Que veux-tu ajouter ?"
  >
    <div className="flex flex-col gap-3" data-testid="add-activity-sheet">
      {CHOICES.map((choice) => (
        <Link
          key={choice.href}
          href={choice.href}
          onClick={onClose}
          className="flex items-center gap-4 p-4 min-h-[72px] rounded-xl bg-neutral-800 border border-neutral-700 hover:border-primary-500/50 hover:bg-neutral-750 active:bg-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="text-3xl shrink-0" aria-hidden="true">
            {choice.icon}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-bold text-white">{choice.label}</span>
            <span className="block text-sub text-neutral-400">
              {choice.description}
            </span>
          </span>
          <MdChevronRight
            className="text-xl text-neutral-500 shrink-0"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  </Modal>
);

export default AddActivitySheet;
