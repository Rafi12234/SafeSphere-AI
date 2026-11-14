"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Finding = {
  id: string; post_id: string; post_caption: string | null; post_is_demo: boolean;
  author_id: string; author_name: string | null; comment_text: string | null;
  label: string; severity: string; language_code: string; explanation: string | null;
  source_type: "demo_fixture"; is_demo: true; confidence: null;
};
type RepeatAccount = {
  author_id: string; display_name: string; flagged_comments: number;
  affected_posts: number; max_severity: string; meets_incident_threshold: boolean;
};
type Stats = {
  fictional_comments: number; flagged: number; safe_or_uncertain: number; critical: number;
  severity: Record<string, number>; languages: Record<string, number>;
  labels: Record<string, number>; repeat_accounts: RepeatAccount[]; repeat_incidents: number;
};
type Incident = {
  id: string; incident_type: string; status: string; max_severity: string;
  flagged_comment_count: number; affected_post_count: number; summary: string | null;
  is_demo: true;
};
type ScanDetail = {
  id: string; status: string; scan_mode: "simulated"; is_demo: true;
  data_source: "scripted_demo_fixtures"; real_comments_fetched: false; ai_executed: false;
  progress_percent: number; estimated_demo_comments: number;
  animated_demo_comments_processed: number; started_at: string;
  completed_at: string | null; duration_seconds: number;
  selected_posts: Array<{
    id: string; provider_post_id: string; caption: string | null; post_is_demo: boolean;
  }>;
  statistics: Stats | null; findings: Finding[]; incidents: Incident[];
};

const levelOrder = ["critical", "high", "medium", "low", "none"];
const levelRank: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };
const languageNames: Record<string, string> = {
  bn: "Bangla", en: "English", banglish: "Banglish", mixed: "Mixed", unknown: "Unknown",
};
const severityClass: Record<string, string> = {
  critical: "border-rose-600 bg-rose-950/40 text-rose-200",
  high: "border-orange-600 bg-orange-950/40 text-orange-200",
  medium: "border-amber-600 bg-amber-950/40 text-amber-200",
  low: "border-sky-700 bg-sky-950/40 text-sky-200",
  none: "border-emerald-700 bg-emerald-950/40 text-emerald-200",
};

function labelize(value: string) { return value.replaceAll("_", " "); }
function dateTime(value: string | null) {
  if (!value) return "Not completed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function SummaryCard({ title, number, note }: { title: string; number: number; note: string }) {
  return <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
    <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
    <p className="mt-2 text-3xl font-bold">{number}</p>
    <p className="mt-1 text-xs text-slate-400">{note}</p>
  </div>;
}

function Bars({ title, values, total }: {
  title: string; values: Array<{ label: string; count: number }>; total: number;
}) {
  return <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
    <h3 className="font-bold">{title}</h3>
    <div className="mt-4 space-y-3">
      {values.filter((v) => v.count > 0).map((v) => <div key={v.label}>
        <div className="flex justify-between gap-2 text-sm">
          <span className="capitalize text-slate-300">{v.label}</span><strong>{v.count}</strong>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-sky-500"
            style={{ width: String(total ? (v.count / total) * 100 : 0) + "%" }} />
        </div>
      </div>)}
    </div>
  </section>;
}

export default function SimulatedScanPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<ScanDetail | null>(null);
  const [error, setError] = useState("");
  const [severity, setSeverity] = useState("all");
  const [language, setLanguage] = useState("all");
  const [search, setSearch] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(true);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const result = await api<ScanDetail>("/scans/" + encodeURIComponent(id));
        if (disposed) return;
        setDetail(result);
        setError("");
        if (result.status === "running") timer = setTimeout(poll, 900);
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : "Could not load scan results.");
      }
    }
    if (id) void poll();
    return () => { disposed = true; if (timer) clearTimeout(timer); };
  }, [id]);

  const completed = detail?.status === "completed";
  const stats = completed ? detail?.statistics : null;
  const visible = useMemo(() => (detail?.findings ?? []).filter((finding) => {
    if (flaggedOnly && finding.label === "safe") return false;
    if (severity !== "all" && finding.severity !== severity) return false;
    if (language !== "all" && finding.language_code !== language) return false;
    const q = search.trim().toLowerCase();
    return !q || [finding.comment_text, finding.author_name, finding.post_caption, finding.label]
      .some((value) => (value ?? "").toLowerCase().includes(q));
  }).sort((a,b) => levelRank[b.severity] - levelRank[a.severity]),
  [detail?.findings, flaggedOnly, severity, language, search]);

  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 text-slate-100 md:px-7">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Link href="/posts" className="text-sm font-semibold text-sky-300 hover:underline">← Back to Facebook Posts</Link>
        <h1 className="mt-3 text-3xl font-bold">Simulated Harassment Scan</h1>
        <p className="mt-2 text-sm text-slate-400">Phase 4 · Scripted multilingual examples · Timed demo progress</p>
      </div>
      <Link href="/scans" className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800">Scan history</Link>
    </header>

    <aside role="note" className="mb-7 rounded-xl border-2 border-amber-600 bg-amber-950/30 p-5">
      <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-slate-950">DEMO DATA — FICTIONAL</span>
      <h2 className="mt-3 font-bold text-amber-100">Not a real harassment assessment</h2>
      <p className="mt-2 text-sm leading-6 text-amber-100">
        Selected Facebook posts may be real. All displayed comments, author names, labels,
        severities, repeat-account indicators and incidents are fictional scripted examples.
        No Facebook comments are retrieved, no AI models are executed, and no actual people are accused.
      </p>
    </aside>

    {error && <p role="alert" className="mb-5 rounded-lg border border-rose-700 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</p>}
    {!detail && !error && <p className="text-slate-300">Loading demo scan…</p>}

    {detail && <>
      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-300">Simulated run</p>
            <h2 className="mt-2 text-xl font-bold">{completed ? "Demo scan completed" : "Simulating comment review…"}</h2>
            <p className="mt-2 text-xs text-slate-400">
              Started {dateTime(detail.started_at)} · {detail.selected_posts.length} selected posts
            </p>
          </div>
          <span className="rounded-full border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-200">
            {completed ? "Completed · Demo" : "Running · Demo"}
          </span>
        </div>
        <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-700" aria-label="Scripted demo progress">
          <div className="h-full rounded-full bg-sky-500 transition-[width] duration-700"
            style={{ width: String(detail.progress_percent) + "%" }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-300">
          <span>{detail.progress_percent}% of scripted timeline</span>
          <span>{detail.animated_demo_comments_processed} / {detail.estimated_demo_comments} fictional examples</span>
        </div>
        {!completed && <p className="mt-4 text-sm text-amber-200">
          This is a clock-based animation, not actual AI processing. Results appear after the demo timeline.
        </p>}
      </section>

      <section className="mb-7 rounded-xl border border-slate-700 bg-slate-900 p-5">
        <h2 className="font-bold">Selected posts</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {detail.selected_posts.map((post) => <span key={post.id}
            className="max-w-full truncate rounded-full border border-slate-600 px-3 py-1 text-xs">
            {post.post_is_demo ? "Demo post" : "Real post"}: {post.caption?.slice(0,60) || post.provider_post_id}
          </span>)}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Real post context only. The simulated comments below were not posted by Facebook users.
        </p>
      </section>

      {stats && <>
        <section aria-label="Fictional scan statistics" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Fictional comments" number={stats.fictional_comments} note="Not actual Facebook comment counts" />
          <SummaryCard title="Flagged examples" number={stats.flagged} note="Scripted labels, not AI classifications" />
          <SummaryCard title="Critical examples" number={stats.critical} note="No real-world threats were detected" />
          <SummaryCard title="Recurring demo accounts" number={stats.repeat_accounts.length} note="Across at least 2 selected posts" />
        </section>
        <section className="mb-7 grid gap-4 md:grid-cols-3">
          <Bars title="Severity · Demo Data" total={stats.fictional_comments}
            values={levelOrder.map((label) => ({ label, count: stats.severity[label] ?? 0 }))} />
          <Bars title="Languages · Demo Data" total={stats.fictional_comments}
            values={Object.entries(stats.languages).map(([code,count]) => ({label: languageNames[code] || code, count}))} />
          <Bars title="Labels · Demo Data" total={stats.fictional_comments}
            values={Object.entries(stats.labels).map(([label,count]) => ({label: labelize(label), count})).sort((a,b)=>b.count-a.count)} />
        </section>

        <section className="mb-7 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-lg font-bold">Recurring fictional accounts</h2>
            <p className="mt-2 text-xs text-slate-400">
              Recurrence means 2+ selected posts; a repeat-harassment incident requires 3+ posts.
            </p>
            <div className="mt-4 space-y-3">
              {stats.repeat_accounts.length === 0 && <p className="text-sm text-slate-400">
                No cross-post activity for these fixtures. Try selecting two or more posts.
              </p>}
              {stats.repeat_accounts.map((account) => <div key={account.author_id}
                className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{account.display_name}</strong>
                  <span className="text-xs text-amber-200">
                    {account.meets_incident_threshold ? "3+ posts · Demo incident" : "Below incident threshold"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {account.flagged_comments} fictional flags · {account.affected_posts} posts
                </p>
              </div>)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-lg font-bold">Fictional incidents</h2>
            <p className="mt-2 text-xs text-slate-400">Not evidence, accusations or law-enforcement reports.</p>
            <div className="mt-4 space-y-3">
              {detail.incidents.length === 0 && <p className="text-sm text-slate-400">
                No scripted incident entries for this run.
              </p>}
              {detail.incidents.map((incident) => <div key={incident.id}
                className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="text-sm capitalize">{labelize(incident.incident_type)}</strong>
                  <span className="text-xs text-amber-200">{incident.max_severity}</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  {incident.flagged_comment_count} fictional flags · {incident.affected_post_count} posts
                </p>
                <p className="mt-1 text-xs text-amber-200">{incident.summary}</p>
              </div>)}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Scripted comment examples</h2>
              <p className="mt-1 text-xs text-slate-400">
                {visible.length} displayed of {stats.fictional_comments} examples. No model confidence scores exist.
              </p>
            </div>
            <span className="rounded-full border border-amber-600 px-3 py-1 text-xs font-bold text-amber-200">Demo fixtures only</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={flaggedOnly} onChange={(e)=>setFlaggedOnly(e.target.checked)}
                className="h-4 w-4 accent-sky-500" /> Flagged only
            </label>
            <select value={severity} onChange={(e)=>setSeverity(e.target.value)}
              aria-label="Filter fictional severity"
              className="rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm">
              <option value="all">All severities</option>
              {levelOrder.map((level)=><option key={level} value={level}>{level}</option>)}
            </select>
            <select value={language} onChange={(e)=>setLanguage(e.target.value)}
              aria-label="Filter fictional language"
              className="rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm">
              <option value="all">All languages</option>
              <option value="bn">Bangla</option>
              <option value="banglish">Banglish</option>
              <option value="en">English</option>
            </select>
            <label className="sr-only" htmlFor="demo-comment-search">Search fictional comments</label>
            <input id="demo-comment-search" type="search" placeholder="Search scripted examples"
              value={search} onChange={(e)=>setSearch(e.target.value)}
              className="min-w-48 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm" />
          </div>

          <div className="mt-5 grid gap-3">
            {visible.length === 0 && <p className="text-sm text-slate-400">No fictional examples match these filters.</p>}
            {visible.map((f) => <article key={f.id}
              className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{f.author_name}</strong>
                  <span className="text-xs text-amber-200">Fictional account</span>
                  <span className="text-xs text-slate-400">{languageNames[f.language_code] || f.language_code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-600 px-2 py-1 text-xs capitalize">{labelize(f.label)}</span>
                  <span className={"rounded-full border px-2 py-1 text-xs " + (severityClass[f.severity] || severityClass.none)}>
                    {f.severity}
                  </span>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">{f.comment_text}</p>
              <p className="mt-2 text-xs text-slate-400">{f.explanation}</p>
              <p className="mt-3 truncate text-xs text-slate-500">
                {f.post_is_demo ? "Demo" : "Real"} selected post: {f.post_caption || f.post_id}
              </p>
              <p className="mt-2 text-xs font-semibold text-amber-200">
                DEMO DATA · Scripted label · Not a real Facebook comment
              </p>
            </article>)}
          </div>
        </section>
      </>}
    </>}
  </main>;
}
