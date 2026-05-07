"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

import "react-toastify/dist/ReactToastify.css";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname?.includes("/admin/login");

  const shell = isLogin ? (
    <div className="min-h-screen font-display">{children}</div>
  ) : (
    <div className="flex min-h-screen font-display">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-admin-sidebar-bg">
        {children}
      </div>
    </div>
  );

  return (
    <>
      {shell}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        newestOnTop
        limit={4}
      />
    </>
  );
}
