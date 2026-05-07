"use client";

import { Suspense } from "react";
import { AdminUsersPageContent } from "./_components/admin-users-page-content";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-page-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <AdminUsersPageContent />
    </Suspense>
  );
}
