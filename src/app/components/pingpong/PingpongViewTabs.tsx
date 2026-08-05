'use client';

import { FC } from 'react';
import ViewTabs, { viewPanelId, viewTabId } from '../ui/ViewTabs';

export type PingpongView = 'ranking' | 'matches';

interface PingpongViewTabsProps {
  value: PingpongView;
  onChange: (view: PingpongView) => void;
  className?: string;
}

const ID_PREFIX = 'pingpong';

const VIEWS: { id: PingpongView; label: string }[] = [
  { id: 'ranking', label: 'Classement' },
  { id: 'matches', label: 'Matchs' },
];

/** Shared with the page, which puts them on the panels. */
export const panelId = (view: PingpongView) => viewPanelId(ID_PREFIX, view);
export const tabId = (view: PingpongView) => viewTabId(ID_PREFIX, view);

/**
 * The Classement / Matchs switch.
 *
 * A `tablist`, not a radiogroup, and the distinction is not cosmetic. A
 * radiogroup filters one thing down; a tablist swaps between two different
 * things sharing a screen. A ranking and a match history are two different
 * things — the history is not a subset of the board — and `tablist` is what
 * tells assistive tech an entire panel is about to be replaced.
 *
 * The same page used to carry a segmented radiogroup that navigated to
 * another route, which was the bug that got it deleted. This is the opposite
 * control: it stays on the page, swaps a panel, and touches no router.
 *
 * Keyboard behaviour, ids and markup now come from the shared `ViewTabs`. This
 * file was where that behaviour was first written; the Mario Kart board grew
 * the same control when the nav collapsed to one tab per sport, which made it
 * the third copy of `TimePeriodToggle`'s keyboard handling in the repo and the
 * point where extracting won. What remains here is the ping-pong vocabulary —
 * its two views, its labels, its id namespace — so call sites and the page's
 * panel ids are untouched.
 *
 * The shared component keeps the property that mattered: a scoped ref array,
 * not `ProfileTabs`' document-wide `querySelectorAll('[role="tab"]')`, which
 * makes every tablist on a page one keyboard group.
 */
const PingpongViewTabs: FC<PingpongViewTabsProps> = ({
  value,
  onChange,
  className = '',
}) => (
  <ViewTabs
    views={VIEWS}
    value={value}
    onChange={onChange}
    idPrefix={ID_PREFIX}
    label="Vue ping-pong"
    className={className}
  />
);

export default PingpongViewTabs;
