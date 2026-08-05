'use client';

import { FC } from 'react';
import ViewTabs, { viewPanelId, viewTabId } from '../ui/ViewTabs';

export type MarioKartView = 'ranking' | 'races';

interface MarioKartViewTabsProps {
  value: MarioKartView;
  onChange: (view: MarioKartView) => void;
  className?: string;
}

const ID_PREFIX = 'mariokart';

const VIEWS: { id: MarioKartView; label: string }[] = [
  { id: 'ranking', label: 'Classement' },
  { id: 'races', label: 'Courses' },
];

/** Shared with the board, which puts them on the panels. */
export const panelId = (view: MarioKartView) => viewPanelId(ID_PREFIX, view);
export const tabId = (view: MarioKartView) => viewTabId(ID_PREFIX, view);

/**
 * The Classement / Courses switch on the Mario Kart board.
 *
 * These two used to be separate bottom-nav tabs, `/` and `/races`, which was
 * half the nav spent on one sport while ping-pong made the same choice
 * in-page. This is the ping-pong shape applied to Mario Kart: same component,
 * same keyboard behaviour, same vocabulary — "Classement" on the left.
 *
 * The labels are deliberately the ones the nav used, so the change reads as
 * two tabs moving into the page rather than two features being renamed.
 *
 * Its own id namespace, because `ViewTabs` mints ids from the prefix and both
 * boards have a view called 'ranking'. Sharing a prefix would put duplicate
 * `mariokart-panel-ranking` / `pingpong-panel-ranking` ids in one document if
 * the two ever render together, and `aria-controls` would then resolve to
 * whichever came first.
 *
 * It writes nothing to the URL. `/races` still exists and still renders the
 * same history component, so the history has a shareable address; this control
 * is the in-page way to reach it, and keeping the router out means the back
 * button leaves the board rather than unwinding a toggle.
 */
const MarioKartViewTabs: FC<MarioKartViewTabsProps> = ({
  value,
  onChange,
  className = '',
}) => (
  <ViewTabs
    views={VIEWS}
    value={value}
    onChange={onChange}
    idPrefix={ID_PREFIX}
    label="Vue Mario Kart"
    className={className}
  />
);

export default MarioKartViewTabs;
