"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/invoices/new", label: "New Invoice", icon: Plus },
  { href: "/invoices/trash", label: "Trash", icon: Trash2 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:max-h-none md:h-[calc(100dvh-4rem)] md:overflow-visible md:pb-4">
      <div className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : href === "/invoices"
            ? pathname === "/invoices" ||
              (pathname.startsWith("/invoices/") &&
                !pathname.startsWith("/invoices/new") &&
                !pathname.startsWith("/invoices/trash"))
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors active:opacity-90 md:min-h-0 md:py-2.5 ${
              isActive
                ? "bg-amber-50 text-amber-700"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
      </div>
      <div className="mt-auto shrink-0 border-t border-stone-200 pt-3 md:pt-4">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut({ callbackUrl: "/" });
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 md:min-h-0 md:py-2.5"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </nav>
  );
}
