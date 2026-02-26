import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-stone-200 bg-white">
        <div className="flex h-16 items-center border-b border-stone-200 px-6">
          <Link href="/dashboard" className="text-xl font-bold text-stone-900">
            Invoice Gen
          </Link>
        </div>
        <DashboardNav />
      </aside>
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
