import { useCallback, useMemo, useState } from 'react';

/**
 * A tiny reusable hook for open/close state (dialogs, drawers, menus, popovers).
 *
 * Why extract it? The open/close/toggle triad is written dozens of times across an app.
 * A custom hook names the pattern, tests it once, and removes the boilerplate — this is
 * exactly what custom hooks are for: reusing *stateful logic*, not markup.
 */
export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useDisclosure(initialOpen = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
}
