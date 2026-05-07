"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { selectClassName } from "@/components/registration/input-classes";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Unique key when multiple options share the same `value` (e.g. +1). */
  id?: string;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  /** Visually match full-width select (Tailwind extras). */
  className?: string;
  "aria-label"?: string;
};

/**
 * Searchable dropdown (Margiela-style): filter list by typing; click-outside to close.
 */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );
  /** If options list changes (e.g. locale), keep showing stored ISO/value until user re-picks. */
  const closedLabel = selected?.label ?? value;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const displayValue = open ? query : closedLabel;
  const inputId = id ?? `${reactId}-input`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        disabled={disabled}
        readOnly={!open}
        placeholder={open ? searchPlaceholder : placeholder}
        value={displayValue}
        onChange={(e) => {
          if (open) setQuery(e.target.value);
        }}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery("");
        }}
        className={`${selectClassName} cursor-pointer ${open ? "cursor-text" : ""}`}
      />
      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onMouseDown={() => setOpen(false)}
          />
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 z-20 mt-1 max-h-[220px] overflow-auto rounded-lg border border-border-subtle bg-surface py-1 shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-muted">{emptyText}</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.id ?? `${opt.value}-${opt.label}`}
                  role="none"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    className="w-full px-3 py-2 text-left text-[16px] leading-6 text-ink hover:bg-[#f4f7ff]"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      ) : null}
    </div>
  );
}
