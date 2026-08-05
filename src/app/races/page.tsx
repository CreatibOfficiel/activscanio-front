"use client";

import { NextPage } from "next";
import RaceHistory from "../components/race/RaceHistory";
import AddActivityButton from "../components/sport/AddActivityButton";
import BoardPanelHeading from "../components/sport/BoardPanelHeading";

/**
 * The race history as a standalone route.
 *
 * KEPT DELIBERATELY, as a real page rather than a redirect to `/?vue=courses`.
 *
 * The nav no longer offers it — Mario Kart collapsed to one tab, and the
 * ranking/history choice moved in-page to match ping-pong — but the URL has
 * been the way to reach the history for the whole life of the app. 21 people
 * use it daily, it is in browser history, bookmarks, iOS home screens and
 * anything anyone has pasted into Slack. Breaking it to tidy up a nav bar is a
 * bad trade.
 *
 * A redirect was the alternative and it is worse in two ways. It costs a
 * client-side round trip before the list appears, on the one screen people
 * open impatiently to check whether their race was recorded. And it would make
 * `/races` a URL that no longer exists in its own right: share it and the
 * recipient lands on the board with a tab pre-selected, which is a different
 * page. Two entry points, one implementation, no redirect.
 *
 * Everything that used to live here is in `RaceHistory` now, which the board's
 * "Courses" panel renders too. This file is what is left: the page title, and
 * the add control, which on this screen goes into the bottom bar's centre slot
 * exactly as it does on the board.
 *
 * The title is the same `BoardPanelHeading` the board's Courses panel uses, so
 * the two entry points read identically. It stayed here rather than moving
 * into `RaceHistory` because the countdown differs — this page shows one, the
 * board's panel suppresses it — and a component that titles itself would have
 * to be told which of its two callers it is, which is exactly the knowledge it
 * was extracted to avoid.
 *
 * It is also now the ONLY "Courses" on this screen. `RacesStatsHeader` used to
 * print an `<h1>Courses</h1>` of its own directly beneath this one, so both
 * this route and the board's panel shipped the heading twice.
 */
const RacesPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      <BoardPanelHeading title="Courses" className="pt-6 pb-2" />
      <RaceHistory renderAddControl={() => <AddActivityButton variant="floating" />} />
    </div>
  );
};

export default RacesPage;
