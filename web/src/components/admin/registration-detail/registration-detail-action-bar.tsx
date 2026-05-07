"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  IconCardTick,
  IconChevronRight,
  IconClipboardTick,
  IconSmsEnvelope,
} from "@/components/icons/admin";
import {
  FigmaArrowRightLinear,
  FigmaCardTickBold,
} from "@/components/admin/registration-detail/figma-payment-received-icons";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { resolvePrimaryRegistrationAction } from "@/lib/admin/registration-detail-action-visibility";
import type { RegistrationPipelineSnapshot } from "@/types/admin-registration-detail";
import type { EmailLogRow } from "@/types/email-log";
import type { RegistrationDetailResponse } from "@/types/crm";

type Props = {
  reference: string;
  variant: "payment" | "info";
  pipelineSnapshot: RegistrationPipelineSnapshot | null;
  row: RegistrationDetailResponse;
  emailLogs: EmailLogRow[];
  onActionsComplete: () => void | Promise<void>;
};

/** Figma 125:7928 — Payment Received / primary teal */
const BTN_TEAL =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0e7490] px-3 text-[12.7px] font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40";
/** Registrant tab — Approve (list uses emerald) */
const BTN_APPROVE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[12.7px] font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40";
const BTN_NAVY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-admin-navy px-3 text-[12.7px] font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40";
export function RegistrationDetailActionBar({
  reference,
  variant,
  pipelineSnapshot,
  row,
  emailLogs,
  onActionsComplete,
}: Props) {
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const primary = resolvePrimaryRegistrationAction(
    pipelineSnapshot,
    row,
    emailLogs,
  );

  const verifyBankTransfer = useCallback(async () => {
    setBusyAction("verify");
    try {
      const res = await fetch("/api/admin/bank-transfers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          action: "verify",
          verifiedBy: "admin",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(
        "Payment marked as received (no automatic payment confirmation email).",
      );
      await onActionsComplete();
    } catch {
      toast.error("Verification failed.");
    } finally {
      setBusyAction(null);
    }
  }, [reference, onActionsComplete]);

  const confirmRegistration = useCallback(async () => {
    setBusyAction("confirm");
    try {
      const res = await fetch("/api/admin/registrations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        emailConfirmationQueuedOrSent?: boolean;
      };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed");
      }
      toast.success(
        data.emailConfirmationQueuedOrSent === true
          ? "Registration confirmed. Confirmation email queued or sent."
          : "Registration confirmed. If email is not configured, check server logs for confirmation send.",
      );
      await onActionsComplete();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed.");
    } finally {
      setBusyAction(null);
    }
  }, [reference, onActionsComplete]);

  const sendThankYou = useCallback(async () => {
    setBusyAction("thank_you");
    try {
      const res = await fetchWithRetry(
        "/api/admin/emails/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            references: [reference],
            templateKey: "thank_you",
          }),
        },
        { retries: 4, baseDelayMs: 500 },
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { queued?: boolean };
      toast.success(
        data.queued ? "Thank you email queued." : "Thank you email sent.",
      );
      await onActionsComplete();
    } catch {
      toast.error("Failed to send thank you email.");
    } finally {
      setBusyAction(null);
    }
  }, [reference, onActionsComplete]);

  const busy = busyAction !== null;

  if (primary == null) {
    return null;
  }

  if (primary === "bank_verify") {
    const isPaymentTab = variant === "payment";
    const label = isPaymentTab ? "Payment Received" : "Approve";
    const className = isPaymentTab ? BTN_TEAL : BTN_APPROVE;
    return (
      <div className="flex max-w-full flex-col items-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void verifyBankTransfer()}
          className={className}
        >
          {isPaymentTab ? (
            <>
              <FigmaCardTickBold className="size-5 shrink-0" />
              {busyAction === "verify" ? "Updating…" : label}
              <FigmaArrowRightLinear className="size-5 shrink-0" />
            </>
          ) : (
            <>
              <IconCardTick className="size-5 text-white" />
              {busyAction === "verify" ? "Updating…" : label}
              <IconChevronRight className="size-5 text-white" />
            </>
          )}
        </button>
      </div>
    );
  }

  if (primary === "registration_confirm") {
    return (
      <div className="flex max-w-full flex-col items-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void confirmRegistration()}
          className={BTN_NAVY}
        >
          <IconClipboardTick className="size-5 text-white" />
          {busyAction === "confirm" ? "Updating…" : "Registration Confirm"}
        </button>
      </div>
    );
  }

  if (primary === "send_thank_you") {
    return (
      <div className="flex max-w-full flex-col items-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => void sendThankYou()}
          className={BTN_TEAL}
        >
          <IconSmsEnvelope className="size-5 shrink-0 text-white" />
          {busyAction === "thank_you" ? "Sending…" : "Send Thank you Email"}
        </button>
      </div>
    );
  }

  return null;
}
