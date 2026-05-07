"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  RegistrationDetailChrome,
  type RegistrationDetailTab,
} from "@/components/admin/registration-detail/registration-detail-chrome";
import { PaymentInformationTab } from "@/components/admin/registration-detail/payment-information-tab";
import { EmailSentRecordTab } from "@/components/admin/registration-detail/email-sent-record-tab";
import { RegistrantInformationTab } from "@/components/admin/registration-detail/registrant-information-tab";
import { fetchAdminRegistrationAdminDetail } from "@/lib/fetch-admin-registration-detail";
import {
  IconChevronLeft,
  IconProfileCircle,
} from "@/components/icons/admin";
import type { PipelineStepView } from "@/types/admin-pipeline";
import type { RegistrationDetailResponse } from "@/types/crm";
import type { AdminRegistrationAdminDetailResponse } from "@/types/admin-registration-detail";

function registrantDisplayName(payload: Record<string, unknown>): string {
  const first = typeof payload.firstName === "string" ? payload.firstName : "";
  const last = typeof payload.lastName === "string" ? payload.lastName : "";
  const name = `${first} ${last}`.trim();
  return name || "Registrant";
}

function parseTab(raw: string | null): RegistrationDetailTab {
  if (raw === "info" || raw === "payment" || raw === "emails") return raw;
  return "payment";
}

function AdminRegistrationDetailPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reference = params.reference;
  const decodedRef = useMemo(() => {
    if (typeof reference !== "string" || !reference) return "";
    return decodeURIComponent(reference);
  }, [reference]);

  const activeTab = parseTab(searchParams?.get("tab") ?? null);

  const [row, setRow] = useState<RegistrationDetailResponse | null>(null);
  const [emailLogs, setEmailLogs] = useState<
    AdminRegistrationAdminDetailResponse["emailLogs"]
  >([]);
  const [pipelineTimeline, setPipelineTimeline] = useState<PipelineStepView[]>(
    [],
  );
  const [pipelineSnapshot, setPipelineSnapshot] = useState<
    AdminRegistrationAdminDetailResponse["pipelineSnapshot"]
  >(null);
  const [bankTransferSlips, setBankTransferSlips] = useState<
    AdminRegistrationAdminDetailResponse["bankTransferSlips"]
  >([]);
  const [checkInLogs, setCheckInLogs] = useState<
    AdminRegistrationAdminDetailResponse["checkInLogs"]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const reloadRegistration = useCallback(async () => {
    if (!decodedRef) return;
    try {
      const data: AdminRegistrationAdminDetailResponse =
        await fetchAdminRegistrationAdminDetail(decodedRef);
      setRow(data.row);
      setEmailLogs(data.emailLogs);
      setPipelineTimeline(data.pipelineTimeline);
      setPipelineSnapshot(data.pipelineSnapshot ?? null);
      setBankTransferSlips(data.bankTransferSlips ?? []);
      setCheckInLogs(data.checkInLogs ?? []);
    } catch (e) {
      console.error("[admin registration detail] reload failed", e);
    }
  }, [decodedRef]);

  useEffect(() => {
    if (!decodedRef) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data: AdminRegistrationAdminDetailResponse =
          await fetchAdminRegistrationAdminDetail(decodedRef);
        if (cancelled) return;
        setRow(data.row);
        setEmailLogs(data.emailLogs);
        setPipelineTimeline(data.pipelineTimeline);
        setPipelineSnapshot(data.pipelineSnapshot ?? null);
        setBankTransferSlips(data.bankTransferSlips ?? []);
        setCheckInLogs(data.checkInLogs ?? []);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load registration";
        if (msg === "Not found") {
          setNotFound(true);
          setRow(null);
        } else {
          setError(msg);
          setRow(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decodedRef]);

  useEffect(() => {
    if (!decodedRef || !row) return;
    document.title = `${row.reference} | CRM Admin`;
  }, [decodedRef, row]);

  const displayName = row
    ? registrantDisplayName(row.payload)
    : "Registrant";
  const breadcrumbTitle = row
    ? `${displayName} #${row.reference}`
    : decodedRef;

  const infoTabHref = `/admin/registrations/${encodeURIComponent(decodedRef)}?tab=info`;
  const paymentTabHref = `/admin/registrations/${encodeURIComponent(decodedRef)}?tab=payment`;

  if (!decodedRef) {
    return (
      <div className="flex-1 overflow-auto p-8 text-sm text-admin-col-muted">
        Invalid reference.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-admin-sidebar-bg text-sm text-admin-col-muted">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <p className="text-sm text-admin-col-muted">Registration not found.</p>
        <Link
          href="/admin"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-admin-navy hover:underline"
        >
          <IconChevronLeft className="size-4" />
          Back to list
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="border-b border-admin-border bg-white px-8 py-6">
          <div className="flex items-center gap-3">
            <IconProfileCircle className="shrink-0 text-admin-navy" />
            <div>
              <h1 className="text-xl font-bold text-admin-navy">Registration</h1>
              <p className="mt-1 text-sm text-admin-col-muted">
                Something went wrong while loading this registration.
              </p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="rounded-xl border border-error/30 bg-red-50/80 p-6 text-sm text-error">
            {error}
          </div>
          <div className="mt-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm font-medium text-admin-navy hover:underline"
            >
              <IconChevronLeft className="size-4" />
              Back to list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!row) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col border-x border-admin-border bg-white">
      <RegistrationDetailChrome
        reference={decodedRef}
        breadcrumbTitle={breadcrumbTitle}
        active={activeTab}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#fafafa] p-5">
        {activeTab === "payment" ? (
          <PaymentInformationTab
            reference={decodedRef}
            displayTitle={`${displayName} #${row.reference}`}
            row={row}
            pipelineTimeline={pipelineTimeline}
            infoTabHref={infoTabHref}
            pipelineSnapshot={pipelineSnapshot}
            emailLogs={emailLogs}
            bankTransferSlips={bankTransferSlips}
            onReloadRegistration={reloadRegistration}
          />
        ) : null}

        {activeTab === "info" ? (
          <div className="mx-auto w-full max-w-[1280px] space-y-6">
            <RegistrantInformationTab
              reference={decodedRef}
              row={row}
              pipelineTimeline={pipelineTimeline}
              displayTitle={`${displayName} #${row.reference}`}
              paymentTabHref={paymentTabHref}
              pipelineSnapshot={pipelineSnapshot}
              emailLogs={emailLogs}
              checkInLogs={checkInLogs}
              onReloadRegistration={reloadRegistration}
            />
          </div>
        ) : null}

        {activeTab === "emails" ? (
          <EmailSentRecordTab
            emailLogs={emailLogs}
            registrationReference={decodedRef}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function AdminRegistrationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-admin-sidebar-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <AdminRegistrationDetailPageInner />
    </Suspense>
  );
}
