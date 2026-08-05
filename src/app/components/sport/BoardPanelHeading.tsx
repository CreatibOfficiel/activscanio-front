'use client';

import { FC, ReactNode } from 'react';

interface BoardPanelHeadingProps {
  /** The panel's name. Becomes the page's only h1 while that panel is open. */
  title: string;
  /**
   * The line under the title. The ranking panels use it for their tier counts;
   * the history panels pass nothing, and neither does ping-pong on a cold
   * start.
   */
  subtitle?: ReactNode;
  className?: string;
}

/**
 * The title a sport board's tab panel puts on itself.
 *
 * IT IS AN h1, AND IT LIVES INSIDE THE PANEL. Both facts are the fix for a
 * reported bug, and both are unusual enough to be worth the paragraph.
 *
 * Both boards used to title themselves above the tab selector: "Classement des
 * pilotes" on `/` with the competitor counts and the season countdown beneath
 * it, "Classement ping-pong" on `/pingpong` with its tier counts. None of it
 * moved when the tab did. Pick Courses and the reader got a ranking's title, a
 * ranking's counts and a ranking's deadline stacked over a race history —
 * "on voit a la fois classement des pilotes et à la courses". The heading was
 * describing a panel that was no longer rendered.
 *
 * Two shapes fix that. One keeps a single heading above the tabs and rewrites
 * its text on every switch. The other, taken here, deletes that heading and
 * lets each panel name itself.
 *
 * The panel-owned version wins on two counts.
 *
 * Layout: nothing above the tab strip changes when the selection does, so the
 * tabs sit at a fixed offset from the top of the page. The rewriting version
 * would put a variable-height block over them — "Classement des pilotes" plus
 * a counts line is two lines, "Courses" is one — and the strip would jump under
 * the reader's thumb on the tap that moved it.
 *
 * Semantics: an h1 whose text mutates in place is a strange thing to hand a
 * screen reader. The document's subject appears to change while the document
 * stays the same. Here the old h1 is removed with its panel and a new one
 * mounts inside the panel the pressed tab points at, which is what actually
 * happened — one section of the page was replaced by another. The tab already
 * carries the same word, and that repetition is deliberate: the tab is the
 * control, the heading is the landmark, and a document with no h1 at all is
 * the worse trade.
 *
 * Level 1 rather than 2 follows from the same choice. With nothing above the
 * tabs titling the page, an h2 here would leave the whole board without a
 * top-level heading.
 */
const BoardPanelHeading: FC<BoardPanelHeadingProps> = ({
  title,
  subtitle,
  className = '',
}) => (
  <div className={`flex flex-col items-center ${className}`}>
    <h1 className="text-title mb-2">{title}</h1>
    {/* Rendered only when there is one. An empty <p> would still claim its
        line height, which on the history panels would push the list down by a
        row of nothing. */}
    {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
  </div>
);

export default BoardPanelHeading;
