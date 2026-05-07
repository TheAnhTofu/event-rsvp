"use client";

import { Suspense } from "react";
import { CheckInPageContent } from "@/components/admin/check-in/check-in-page-content";

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-page-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <CheckInPageContent />
    </Suspense>
  );
}
