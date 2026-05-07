"use client";

import { Suspense } from "react";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-admin-sidebar-bg text-sm text-admin-col-muted">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
