"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ScanSummary = {
  id: string; status: string; scan_mode: "simulated"; is_demo: true;
  progress_percent: number; estimated_demo_comments: number;
  animated_demo_comments_processed: number;
  started_at: string; completed_at: string | null;
  real_comments_fetched: false; ai_executed: false;
};
type HistoryResponse = { scans: ScanSummary[]; is_demo: true };

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function SimulatedScanHistory() {
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<HistoryResponse>("/scans")
      .then((response) => setScans(response.scans))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load scan history."))
      .finally(() => setLoading(false));
  }, []);

  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 text-slate-100">
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-sky-300 hover:underline">← Dashboard</Link>
        <h1 className="mt-3 text-3xl font-bold">Simulated Scan History</h1>
        <p className="mt-2 text-sm text-slate-400">The 20 most recent scripted demo runs in your workspace.</p>
      </div>
      <Link href="/posts" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold hover:bg-sky-500">
        Select Facebook Posts
      </Link>
    </header>
    <aside className="mb-6 rounded-xl border-2 border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-100">
      <strong>DEMO DATA ONLY.</strong> This history is not a log of real Facebook comments or AI analysis.
      Each run uses fixed fictional accounts and labels attached to selected posts.
    </aside>
    {loading && <p className="text-slate-400">Loading history…</p>}
    {error && <p role="alert" className="rounded-lg border border-rose-700 p-4 text-rose-200">{error}</p>}
    {!loading && !error && scans.length === 0 && <div className="rounded-xl border border-slate-700 bg-slate-900 p-8">
      <h2 className="text-xl font-bold">No simulated scans yet</h2>
      <p className="mt-2 text-sm text-slate-400">Open Facebook Posts, select one or more posts, and click Start Simulated Scan.</p>
    </div>}
    <div className="grid gap-3">
      {scans.map((scan) => <Link key={scan.id} href={"/scans/" + scan.id}
        className="rounded-xl border border-slate-700 bg-slate-900 p-5 hover:border-sky-600 hover:bg-slate-800/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">{displayDate(scan.started_at)}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {scan.estimated_demo_comments} scripted examples · {scan.progress_percent}% of demo timeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-700 px-3 py-1 text-xs font-semibold text-amber-200">Fictional</span>
            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs capitalize">{scan.status}</span>
            <span aria-hidden="true" className="text-sky-300">→</span>
          </div>
        </div>
      </Link>)}
    </div>
  </main>;
}
