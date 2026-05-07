"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

/** Tab/session only — cleared when the tab or browser session ends. */
const SESSION_KEY = "event-rsvp-launch-unlocked";
const CODE = "0411";

function isGateDisabled(): boolean {
  return process.env.NEXT_PUBLIC_LAUNCH_GATE_DISABLED === "true";
}

export function LaunchGate({ children }: { children: ReactNode }) {
  const gateOff = isGateDisabled();
  const [unlocked, setUnlocked] = useState<boolean | null>(() =>
    gateOff ? true : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const unlock = useCallback(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    setUnlocked(true);
  }, []);

  useEffect(() => {
    if (gateOff) return;
    try {
      setUnlocked(window.sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
  }, [gateOff]);

  const digitBufRef = useRef("");

  const tryUnlockFromInputValue = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "");
      if (digits.slice(-CODE.length) === CODE) {
        unlock();
      }
    },
    [unlock],
  );

  useEffect(() => {
    if (unlocked !== false || gateOff) return;

    const onWindowKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k.length === 1 && k >= "0" && k <= "9") {
        digitBufRef.current = (digitBufRef.current + k).slice(-CODE.length);
        if (digitBufRef.current === CODE) {
          unlock();
        }
      }
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [unlocked, gateOff, unlock]);

  useEffect(() => {
    if (unlocked !== false || gateOff) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [unlocked, gateOff]);

  if (gateOff) {
    return <>{children}</>;
  }

  if (unlocked === null) {
    return (
      <div
        className="fixed inset-0 z-9999 bg-white"
        aria-busy="true"
        aria-label="Loading"
      />
    );
  }

  if (!unlocked) {
    return (
      <div
        className="fixed inset-0 z-9999 bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Coming soon"
      >
        <p
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-lg font-normal tracking-tight text-black"
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          We will launch soon
        </p>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-hidden
          tabIndex={0}
          className="absolute inset-0 z-10 cursor-default opacity-0 caret-transparent"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            tryUnlockFromInputValue(e.target.value)
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
