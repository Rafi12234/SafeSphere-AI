"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Me } from "@/lib/api";
import FacebookPanel from "@/components/FacebookPanel";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Me>("/auth/me").then(setMe).catch(() => {
      setError("Please log in again."); router.replace("/login");
    });
  }, [router]);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
    }
  }

  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 md:px-7">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-6">
      <div>
        <p className="text-sm font-bold tracking-widest text-sky-400">SAFESPHERE AI</p>
        <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
      </div>
      <button onClick={logout} className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">Log out</button>
    </header>
    {!me ? <p className="text-slate-400">{error || "Loading your workspace…"}</p> : <>
      <p className="mb-7 text-slate-300">Welcome, <strong>{me.display_name || me.email}</strong> · Workspace: <strong>{me.workspace_name}</strong> · {me.role}</p>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Account</p><h2 className="mt-1 text-xl font-bold">Active</h2>
          <p className="mt-2 text-sm text-emerald-300">Real authentication enabled</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Facebook</p><h2 className="mt-1 text-xl font-bold">Connected Pages</h2>
          <p className="mt-2 text-sm text-slate-300">Phase 2 authorization + Phase 3 post dashboard</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Scanning</p><h2 className="mt-1 text-xl font-bold">Phase 4 · Demo</h2>
          <p className="mt-2 text-sm text-amber-200">Fictional comments and scripted findings only</p>
        </div>
      </div>
      <FacebookPanel canManage={me.role === "owner" || me.role === "admin"} />
      <div className="mt-5 rounded-lg border border-amber-700/70 bg-amber-950/20 p-4 text-sm text-amber-200">Phase 4 results are scripted DEMO DATA only. No genuine Facebook comments are collected or analyzed.</div>
      <section className="mt-6 rounded-xl border border-sky-800 bg-slate-900 p-6">
        <h2 className="text-xl font-bold">Phase 3 · Facebook Posts</h2>
        <p className="mt-2 text-sm text-slate-300">View real published Page posts, refresh the cache, and select multiple posts. Scanning is simulated in Phase 4.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/posts" className="inline-block rounded-lg bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-500">View Facebook Posts →</Link>
          <Link href="/scans" className="inline-block rounded-lg border border-amber-700 px-5 py-2 font-semibold text-amber-200 hover:bg-amber-950/40">Simulated Scan History</Link>
        </div>
      </section>
    </>}
  </main>;
}
