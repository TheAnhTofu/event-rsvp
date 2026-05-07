"use client";

import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import {
  IconChevronsUpDown,
  IconCheckin,
  IconDashboard,
  IconPrinter,
  IconProfileCircle,
  IconUserEdit,
} from "@/components/icons/admin";

function navInactiveClass(): string {
  return "text-admin-navy hover:bg-white/70";
}

/** Active “Registrant List” uses solid sidebar highlight; other items use muted hover. */
function registrantNavClass(active: boolean): string {
  if (active) {
    return "bg-admin-sidebar-active-solid text-white shadow-sm";
  }
  return navInactiveClass();
}

export function AdminSidebar() {
  const pathname = usePathname();

  const usersActive = pathname?.startsWith("/admin/users");

  const registrantListActive =
    pathname?.startsWith("/admin/emails") ||
    pathname?.startsWith("/admin/registrations");

  return (
    <aside className="flex w-[290px] shrink-0 flex-col border-r border-admin-border bg-admin-sidebar-bg px-5 pb-5 pt-10 font-display">
      <div className="shrink-0">
        <Link href="/admin/emails" className="block">
          <Image
            src="/admin/iais-logo-sidebar.png"
            alt="IAIS — International Association of Insurance Supervisors"
            width={220}
            height={47}
            priority
            className="h-[47px] w-auto max-w-[220px] object-contain object-left"
          />
        </Link>
      </div>

      <nav className="mt-[30px] flex w-full max-w-[250px] flex-col gap-2 self-center">
        <span
          className={`flex cursor-not-allowed items-center justify-between rounded-[12px] px-5 py-2.5 text-[14px] font-medium opacity-60 ${navInactiveClass()}`}
          title="Coming soon"
        >
          <span className="flex items-center gap-2.5">
            <IconDashboard className="shrink-0" />
            Dashboard
          </span>
        </span>

        <Link
          href="/admin/users"
          className={`flex items-center justify-between rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors ${
            usersActive
              ? "bg-admin-sidebar-active-solid text-white shadow-sm"
              : navInactiveClass()
          }`}
        >
          <span className="flex items-center gap-2.5">
            <IconProfileCircle
              className={`shrink-0 ${usersActive ? "text-white" : ""}`}
            />
            User
          </span>
        </Link>

        <Link
          href="/admin/emails"
          className={`flex items-center justify-between rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors ${registrantNavClass(registrantListActive)}`}
        >
          <span className="flex items-center gap-2.5">
            <IconUserEdit
              className={`shrink-0 ${registrantListActive ? "text-white" : ""}`}
            />
            Registrant List
          </span>
        </Link>

        <Link
          href="/admin/check-in"
          className={`flex items-center justify-between rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors ${
            pathname?.startsWith("/admin/check-in")
              ? "bg-admin-sidebar-active-solid text-white shadow-sm"
              : navInactiveClass()
          }`}
        >
          <span className="flex items-center gap-2.5">
            <IconCheckin
              className={`shrink-0 ${pathname?.startsWith("/admin/check-in") ? "text-white" : ""}`}
            />
            On-Site Check-In
          </span>
        </Link>

        <Link
          href="/admin/print-badge"
          className={`flex items-center justify-between rounded-[12px] px-5 py-2.5 text-[14px] font-medium transition-colors ${
            pathname?.startsWith("/admin/print-badge")
              ? "bg-admin-sidebar-active-solid text-white shadow-sm"
              : navInactiveClass()
          }`}
        >
          <span className="flex items-center gap-2.5">
            <IconPrinter
              className={`shrink-0 ${pathname?.startsWith("/admin/print-badge") ? "text-white" : ""}`}
            />
            Print Badges
          </span>
        </Link>
      </nav>

      <div className="mt-auto flex w-full max-w-[250px] flex-col gap-3 self-center pt-10">
        <Link
          href="/admin/config"
          className={`flex w-full items-center justify-between rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors ${
            pathname?.startsWith("/admin/config")
              ? "bg-admin-sidebar-active-solid text-white shadow-sm"
              : navInactiveClass()
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className="shrink-0 text-[16px] leading-none" aria-hidden>
              ⚙
            </span>
            Runtime config
          </span>
        </Link>
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex size-[41px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-admin-navy">
            <span className="text-[17px] font-medium leading-none text-white">M</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#3f3f46]">Admin</p>
            <p className="truncate text-[11px] font-medium text-[#3f3f46]">admin@example.com</p>
          </div>
          <IconChevronsUpDown className="size-[22px] shrink-0 text-[#3f3f46]/70" aria-hidden />
        </div>
      </div>
    </aside>
  );
}
