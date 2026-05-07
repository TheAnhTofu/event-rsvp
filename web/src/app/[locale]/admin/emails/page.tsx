"use client";

import { Suspense } from "react";
import { AdminEmailsPageContent } from "./_components/admin-emails-page-content";

export default function EmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-page-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <AdminEmailsPageContent />
    </Suspense>
  );
}
