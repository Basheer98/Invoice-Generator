import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 px-4">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Invoice Generator
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          Create GST-compliant invoices for Indian companies. Support for
          domestic (India) and export (USA) invoices.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-amber-600 px-8 py-3.5 font-medium text-white transition-colors hover:bg-amber-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl border-2 border-stone-300 bg-white px-8 py-3.5 font-medium text-stone-700 transition-colors hover:border-amber-500 hover:bg-amber-50/50"
          >
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
