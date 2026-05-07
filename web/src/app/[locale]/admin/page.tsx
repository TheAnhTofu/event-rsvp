"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function AdminIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/emails");
  }, [router]);

  return (
    <div className="flex min-h-[30vh] flex-1 items-center justify-center text-sm text-admin-col-muted">
      Loading…
    </div>
  );
}
