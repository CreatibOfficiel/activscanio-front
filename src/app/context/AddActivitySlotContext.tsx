'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import AddActivityButton from '../components/sport/AddActivityButton';

interface AddActivitySlotValue {
  /** Set by the nav once its centre holder is mounted. */
  register: (node: HTMLElement | null) => void;
  container: HTMLElement | null;
}

const AddActivitySlotContext = createContext<AddActivitySlotValue>({
  register: () => {},
  container: null,
});

/**
 * Lets a page put the add control into the bottom bar.
 *
 * The control used to be mounted by each board directly, as a FAB floating
 * bottom-right over the list. Moving it into the bar raises a question the FAB
 * never had to answer: the bar is global chrome, mounted once in the layout,
 * but whether the button should appear at all is page knowledge. The two
 * boards suppress it on an empty board — the empty state carries its own call
 * to action a few pixels away, and two prompts to do the same thing on one
 * screen is one too many.
 *
 * Route-sniffing from the nav was the alternative and it cannot work: `/` and
 * `/pingpong` are boards that sometimes want the button and sometimes do not,
 * and only the page knows which, after its fetch resolves. A path list would
 * have to guess, and it would guess wrong on exactly the empty boards the gate
 * exists for.
 *
 * So the pages keep the decision. They render `<AddActivitySlot />` under the
 * same condition they used to render the FAB, and it portals into the bar's
 * centre. The gate is unchanged; only where the button lands moved.
 *
 * A portal rather than lifting state: the button's own logic reads
 * `useSportPreference` and may open a sheet, and keeping it mounted from the
 * page means that logic, its loading behaviour and its tests are all untouched
 * by the move.
 */
export function AddActivitySlotProvider({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const register = useCallback((node: HTMLElement | null) => {
    setContainer(node);
  }, []);

  return (
    <AddActivitySlotContext.Provider value={{ register, container }}>
      {children}
    </AddActivitySlotContext.Provider>
  );
}

/** Used by the bottom nav to offer its centre holder as the portal target. */
export function useAddActivitySlotTarget() {
  return useContext(AddActivitySlotContext).register;
}

/**
 * Mounted by a board that wants the add control in the bar.
 *
 * Renders nothing until the nav has registered its holder, which on a cold
 * load is the first paint after the layout mounts. On desktop the bar is
 * hidden entirely and no holder is ever registered, so this is inert there —
 * the sidebar has its own add entry.
 */
export function AddActivitySlot() {
  const { container } = useContext(AddActivitySlotContext);
  // Portals need a DOM node, so nothing can render on the server pass.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !container) return null;

  return createPortal(<AddActivityButton variant="nav" />, container);
}
