"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CookiesModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CookiesModalContext = createContext<CookiesModalContextValue | null>(
  null,
);

export function CookiesModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, open, close }),
    [isOpen, open, close],
  );

  return (
    <CookiesModalContext.Provider value={value}>
      {children}
    </CookiesModalContext.Provider>
  );
}

export function useCookiesModal() {
  const ctx = useContext(CookiesModalContext);
  if (!ctx) {
    throw new Error("useCookiesModal must be used within CookiesModalProvider");
  }
  return ctx;
}
