"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Me } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Me>("/auth/me").then(setMe).catch(() => { setError("Please log in again."); router.replace("/login"); });
  }, [router]);
  async function logout() { await api("/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  return <main className="min-h-screen max-w-6xl mx-auto px-6 py-10">
    <header className="flex justify-between items-center border-b border-slate-700 pb-6 mb-10">
      <div><p className="text-sky-400 font-bold tracking-wider">SafeSphere AI</p><h1 className="text-3xl font-bold">Dashboard</h1></div>
      <button onClick={logout} className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">Log out</button>
    </header>
    {!me ? <p className="text-slate-400">{error || "Loading your workspace..."}</p> : <>
      <p className="mb-6 text-slate-300">Welcome, <b>{me.display_name || me.email}</b> · Workspace: <b>{me.workspace_name}</b> · {me.role}</p>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6"><p className="text-slate-400 text-sm">Account</p><h2 className="text-xl font-bold mt-2">Active</h2><p className="text-sm text-emerald-400 mt-3">✓ Real authentication working</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6"><p className="text-slate-400 text-sm">Facebook Page</p><h2 className="text-xl font-bold mt-2">Not connected</h2><p className="text-sm text-slate-400 mt-3">Phase 2: real Meta OAuth</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6"><p className="text-slate-400 text-sm">Scan results</p><h2 className="text-xl font-bold mt-2">Not available</h2><p className="text-sm text-slate-400 mt-3">Phase 4: simulated demo</p></div>
      </section>
      <div className="mt-8 rounded-xl border border-sky-900 bg-sky-950/40 p-5"><b>Phase 1 complete when:</b> registration, login, refresh persistence and logout all work with PostgreSQL. No Facebook tokens or AI results yet.</div>
    </>}
  </main>;
}
