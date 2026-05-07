"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { IconDotsVertical, IconPencilEdit } from "@/components/icons/admin";
import { RegistrationDetailActionBar } from "@/components/admin/registration-detail/registration-detail-action-bar";
import type {
  RegistrationPipelineSnapshot,
} from "@/types/admin-registration-detail";
import type { EmailLogRow } from "@/types/email-log";
import type { RegistrationDetailResponse } from "@/types/crm";

type Props = {
  displayTitle: string;
  paymentTabHref: string;
  reference: string;
  isEditing: boolean;
  saving: boolean;
  beginEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  pipelineSnapshot: RegistrationPipelineSnapshot | null;
  row: RegistrationDetailResponse;
  emailLogs: EmailLogRow[];
  onReloadRegistration: () => void | Promise<void>;
};

export function RegistrantInformationHeaderBar({
  displayTitle,
  paymentTabHref,
  reference,
  isEditing,
  saving,
  beginEdit,
  cancelEdit,
  saveEdit,
  pipelineSnapshot,
  row,
  emailLogs,
  onReloadRegistration,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const copyReference = useCallback(() => {
    void navigator.clipboard.writeText(row.reference);
    setMenuOpen(false);
  }, [row.reference]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
        Registrant Information ({displayTitle})
      </h1>
      <div className="flex max-w-full flex-wrap items-start justify-end gap-2">
        {!isEditing ? (
          <button
            type="button"
            onClick={beginEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-admin-navy bg-white px-4 text-[12.7px] font-medium text-admin-navy hover:bg-[#f8fafc]"
          >
            <IconPencilEdit className="size-5 text-admin-navy" />
            Edit
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveEdit()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[12.7px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={cancelEdit}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-admin-border bg-white px-4 text-[12.7px] font-medium text-ink hover:bg-admin-table-header-bg disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
        <Link
          href={paymentTabHref}
          title="Open Payment Information (amount, method, bank slip)"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-admin-navy px-4 text-[12.7px] font-medium text-white hover:opacity-95"
          scroll={false}
        >
          <IconPencilEdit className="size-5 text-white" />
          Payment Information
        </Link>
        {!isEditing ? (
          <RegistrationDetailActionBar
            reference={reference}
            variant="info"
            pipelineSnapshot={pipelineSnapshot}
            row={row}
            emailLogs={emailLogs}
            onActionsComplete={onReloadRegistration}
          />
        ) : null}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl border border-transparent text-admin-navy hover:bg-[#f2f2f2]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <IconDotsVertical className="size-4" />
          </button>
          {menuOpen ? (
            <ul
              className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-admin-border bg-white py-1"
              role="menu"
            >
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2 text-left text-[13px] text-ink hover:bg-admin-table-header-bg"
                  onClick={copyReference}
                >
                  Copy reference
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
