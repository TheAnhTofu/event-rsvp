import { Suspense } from "react";
import { PrintBadgePageContent } from "@/app/[locale]/admin/print-badge/_components/print-badge-page-content";

export default function PrintBadgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-page-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <PrintBadgePageContent />
    </Suspense>
  );
}
