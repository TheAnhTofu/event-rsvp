"use client";

type Props = {
  title: string;
  body: string;
  persistError: string | null;
  busy: boolean;
  pleaseWaitLabel: string;
  completeLabel: string;
  onComplete: () => void;
};

export function NoPaymentScreen({
  title,
  body,
  persistError,
  busy,
  pleaseWaitLabel,
  completeLabel,
  onComplete,
}: Props) {
  return (
    <div className="rounded-3xl border border-card-border bg-surface p-4 text-center shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)] md:p-10">
      <h2 className="text-lg font-bold text-ink md:text-xl">{title}</h2>
      <p className="mt-3 text-sm text-ink-soft md:mt-4 md:text-base">{body}</p>
      {persistError ? (
        <p className="mt-4 rounded-lg border border-error bg-[#fff5f5] px-3 py-2 text-sm text-error">
          {persistError}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void onComplete()}
        className="mt-6 flex w-full justify-center rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-accent-strong)_100%)] px-11 py-3 text-[15px] font-bold leading-6 text-white shadow-md transition hover:opacity-95 disabled:opacity-60 sm:mx-auto sm:inline-flex sm:w-auto sm:min-w-[280px] md:mt-8"
      >
        {busy ? pleaseWaitLabel : completeLabel}
      </button>
    </div>
  );
}
