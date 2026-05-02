"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";
import { Menu, X } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transform border-r border-stone-200 bg-white transition-transform duration-200 ease-in-out md:max-w-none md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-14 items-center justify-between border-b border-stone-200 px-3 pt-[env(safe-area-inset-top,0px)] sm:px-4 md:px-6">
          <Link href="/dashboard" className="text-xl font-bold text-stone-900" onClick={() => setSidebarOpen(false)}>
            Invoice Gen
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 active:bg-stone-200 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <DashboardNav onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Narrow screens only: hamburger opens side nav */}
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-stone-200 bg-white px-3 pt-[env(safe-area-inset-top,0px)] sm:px-4 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 active:bg-stone-200"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="text-lg font-bold text-stone-900">
            Invoice Gen
          </Link>
          <div className="min-w-11" aria-hidden />
        </header>

        <main className="flex-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6 sm:pt-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
