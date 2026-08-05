"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdPerson,
  MdSportsEsports,
  MdSportsTennis,
} from "react-icons/md";
import { useSoundboard } from "../../context/SoundboardContext";
import { useAddActivitySlotTarget } from "../../context/AddActivitySlotContext";
import { BOTTOM_NAV_HIDDEN_PATHS } from "@/app/config/routes";
import { matchesAnyPath } from "@/app/utils/path-matching";
import { isActiveRoute } from "@/app/utils/is-active-route";

/**
 * The mobile bottom navigation.
 *
 * ONE TAB PER SPORT. Mario Kart used to hold two of the four entries —
 * Classement (`/`) and Courses (`/races`) — while ping-pong held one and
 * switched between its ranking and its match history with an in-page tablist.
 * That was one information architecture expressed two different ways in the
 * same bar. The asymmetry was an accident of order rather than a decision:
 * Mario Kart shipped first and alone, when spending half the bar on it cost
 * nothing.
 *
 * It costs something now. A four-item bar where two items are the same sport
 * reads as an app that is mostly Mario Kart with ping-pong bolted on, and a
 * third sport would want a fifth and sixth slot. Both boards now behave
 * identically: one tab each, and the ranking-versus-history choice lives
 * in-page on both.
 *
 * `/races` is still a real route and still renders the history — 21 people use
 * this app daily and the URL is in muscle memory — it simply is no longer a
 * peer of the board in the nav. `activePaths` keeps the Mario Kart tab lit for
 * anyone who lands there from a bookmark.
 *
 * The items are identical for everyone whatever sport they follow, which is
 * deliberate: `useSportPreference` answers 'both' whenever the value is
 * missing (signed out, an older row, or any moment in flight), so a
 * preference-driven bar would paint three items and drop to two a few hundred
 * milliseconds later, moving targets under a thumb already reaching.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { state, open } = useSoundboard();
  const registerAddSlot = useAddActivitySlotTarget();

  /**
   * The soundboard easter egg, KEPT and deliberately re-pointed.
   *
   * It used to hang off the Classement tab, which no longer exists. Dropping
   * it silently would have deleted a feature someone unlocked on purpose;
   * moving it to the Mario Kart tab keeps it on the same destination (`/`) and
   * the same thumb position, so for anyone who has unlocked it nothing
   * changed. It still swallows the navigation: once unlocked, the tab opens
   * the soundboard rather than routing. That is the existing bargain — `/` is
   * already what you are looking at when you press it — and it is left exactly
   * as it was rather than quietly re-tuned inside a nav restructure.
   */
  const handleMarioKartClick = useCallback((e: React.MouseEvent) => {
    if (state.isUnlocked) {
      e.preventDefault();
      open();
    }
    // Otherwise, normal navigation to the Mario Kart board.
  }, [state.isUnlocked, open]);

  // Hide navigation during onboarding and task flows
  if (matchesAnyPath(pathname, BOTTOM_NAV_HIDDEN_PATHS)) {
    return null;
  }

  const items = [
    // activePaths is required for anything but an exact match, or the tab goes
    // dark inside its own section. For Mario Kart that section includes
    // /races, which the board's own selector now reaches but which remains a
    // navigable URL of its own.
    {
      href: "/",
      icon: MdSportsEsports,
      label: "Mario Kart",
      activePaths: ["/races"],
    },
    {
      href: "/pingpong",
      icon: MdSportsTennis,
      label: "Ping-Pong",
      activePaths: ["/pingpong"],
    },
    {
      href: "/profile",
      icon: MdPerson,
      label: "Profil",
      activePaths: ["/profile", "/achievements"],
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 lg:hidden pointer-events-none">
      {/* The wrapper the bar and the add button share. Relative so the button
          can be positioned against the bar's box without living inside it. */}
      <div className="mx-auto max-w-lg relative">
        {/* The add control's holder.

            A sibling of the bar rather than a child, because the bar is
            `overflow-hidden` — it has to be, the rounded corners clip the
            active-tab highlight — and a button meant to protrude above the top
            edge would simply be sliced off there. That failure is silent: the
            button would just look short, not broken.

            Positioned dead centre horizontally and pulled up so a little over
            half its height sits above the bar's top edge, which is what makes
            it read as the bar's primary action rather than a fourth tab. The
            three tabs below space themselves evenly and ignore it; with an odd
            tab count the centre of the bar falls on the middle tab's label, so
            the button is nudged above rather than through it.

            Empty and zero-size until a page portals into it, so it never
            intercepts a tap on a screen with no add action. */}
        <div
          ref={registerAddSlot}
          data-testid="add-activity-slot"
          className="absolute left-1/2 -translate-x-1/2 -top-[36px] z-10 pointer-events-auto"
        />

        <nav
          className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around p-1.5 pointer-events-auto relative overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
          }}
          role="navigation"
          aria-label="Navigation mobile"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href, item.activePaths);
            const isMarioKart = item.href === "/";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMarioKart ? handleMarioKartClick : undefined}
                className={`
                  relative flex flex-col items-center justify-center flex-1
                  py-2.5 rounded-2xl
                  transition-all duration-300
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  ${isActive ? "text-primary-400" : "text-neutral-400 hover:text-neutral-200"}
                `}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <div className="absolute inset-x-1 inset-y-1 bg-primary-500/10 rounded-xl" />
                )}

                <div className="relative">
                  <Icon className={`text-2xl transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} aria-hidden="true" />
                  {isMarioKart && state.isUnlocked && (
                    <span className="absolute -top-1 -right-1 text-[8px]" aria-hidden="true">🔊</span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
