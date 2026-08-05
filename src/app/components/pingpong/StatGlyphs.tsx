'use client';

import { FC } from 'react';
import { MdPercent, MdShowChart } from 'react-icons/md';

interface GlyphProps {
  className?: string;
}

/**
 * The two marks the ping-pong board labels its numbers with.
 *
 * They live here rather than in each caller because the podium cards and the
 * list rows show the same pair, and a rating icon that differed between the
 * top three and everyone else would read as two different statistics.
 *
 * Both are `aria-hidden`. They carry no information a screen reader can use —
 * the numbers beside them get `sr-only` labels instead, so a row reads
 * "1030 ELO, 63 % de victoires" rather than "1030 63".
 */
export const EloGlyph: FC<GlyphProps> = ({ className = '' }) => (
  <MdShowChart className={className} aria-hidden="true" />
);

export const WinRateGlyph: FC<GlyphProps> = ({ className = '' }) => (
  <MdPercent className={className} aria-hidden="true" />
);
