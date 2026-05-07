"use client";

import { AdminRuntimeConfigContent } from "./_components/admin-runtime-config-content";

export default function AdminConfigPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-admin-border bg-white px-5 py-[15px]">
        <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
          Runtime configuration
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-auto bg-white p-5 pb-16">
        <AdminRuntimeConfigContent />
      </div>
    </div>
  );
}
