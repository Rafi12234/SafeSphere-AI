"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Me } from "@/lib/api";

type Post = {
  id: string;
  provider_post_id: string;
  caption: string | null;
  post_type: string;
  thumbnail_url: string | null;
  permalink: string | null;
  published_at: string | null;
  is_demo: boolean;
  comment_count: null;
};
type PageConnection = {
  id: string;
  name: string;
  is_demo: boolean;
  status: string;
  last_synced_at: string | null;
  has_older_on_facebook: boolean;
  can_sync: boolean;
};
type PostsResponse = {
  page: PageConnection | null;
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};
type SyncResult = {
  synced: number;
  is_demo: boolean;
  has_older_on_facebook: boolean;
  last_synced_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PostsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<PostsResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPosts = useCallback(async (offset = 0, append = false) => {
    const result = await api<PostsResponse>("/posts?limit=24&offset=" + offset);
    setData((previous) => append && previous && previous.page?.id === result.page?.id
      ? { ...result, posts: [...previous.posts, ...result.posts] }
      : result);
    return result;
  }, []);

  useEffect(() => {
    Promise.all([api<Me>("/auth/me"), loadPosts()])
      .then(([person]) => setMe(person))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to load posts.");
        if (err instanceof Error && /401|log in|session/i.test(err.message)) {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [loadPosts, router]);

  const posts = useMemo(() => data?.posts ?? [], [data?.posts]);
  const filtered = useMemo(() => posts.filter((post) => {
    const textMatch = (post.caption || "").toLowerCase().includes(search.toLowerCase())
      || post.provider_post_id.includes(search);
    const kindMatch = kind === "all" || post.post_type === kind;
    return textMatch && kindMatch;
  }), [posts, search, kind]);
  const visibleIds = filtered.map((p) => p.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const canManage = me?.role === "owner" || me?.role === "admin";

  function toggleOne(id: string) {
    setSelected((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  }

  function toggleAllVisible() {
    setSelected((old) => allVisibleSelected
      ? old.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...old, ...visibleIds])));
  }

  async function synchronize(mode: "latest" | "older") {
    setBusy(mode);
    setError("");
    setNotice("");
    try {
      const result = await api<SyncResult>("/posts/sync", {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      await loadPosts(0);
      setSelected([]);
      setNotice(result.is_demo
        ? "Demo Data: fictional sample posts loaded. No Meta data was accessed."
        : String(result.synced) + " real Facebook posts retrieved from this batch. The dashboard cache is updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Facebook post sync failed.");
    } finally {
      setBusy("");
    }
  }

  async function startScan() {
    if (selected.length < 1 || selected.length > 20 || busy || !canManage) return;
    setBusy("scan");
    setError("");
    setNotice("");
    try {
      const result = await api<{ id: string }>("/scans", {
        method: "POST",
        body: JSON.stringify({ post_ids: selected }),
      });
      router.push(`/scans/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start demo scan.");
      setBusy("");
    }
  }

  async function loadMore() {
    if (!data || busy) return;
    setBusy("more");
    setError("");
    try {
      await loadPosts(data.posts.length, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more cached posts.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-9 text-slate-100 md:px-7">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-6">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-sky-300 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Facebook Posts</h1>
          <p className="mt-2 text-sm text-slate-400">
            Phases 3–4 · Real published posts · Fictional comments and simulated scan results
          </p>
        </div>
        {data?.page?.is_demo && (
          <span className="rounded-full border border-amber-600 bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-200">
            DEMO DATA — FICTIONAL POSTS
          </span>
        )}
      </header>

      {loading && <p className="text-slate-300">Loading your selected Facebook Page…</p>}
      {error && <p role="alert" className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-lg border border-sky-700 bg-sky-950/40 p-4 text-sm text-sky-100">{notice}</p>}

      {!loading && data && !data.page && (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-8">
          <h2 className="text-xl font-bold">No Facebook Page selected</h2>
          <p className="mt-3 text-slate-300">
            Connect Facebook and select one of your authorized Pages on the dashboard first.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-sky-600 px-4 py-2 font-semibold hover:bg-sky-500">
            Manage Facebook Pages
          </Link>
        </section>
      )}

      {!loading && data?.page && (
        <>
          <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">Selected Page</p>
                <h2 className="mt-1 text-2xl font-bold">{data.page.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {data.page.is_demo ? "Fictional showcase Page" : "Real Facebook Page"}
                  {" · "}Status: {data.page.status.replaceAll("_", " ")}
                  {" · "}Last synced: {data.page.last_synced_at ? formatDate(data.page.last_synced_at) : "Never"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => synchronize("latest")}
                  disabled={Boolean(busy) || !canManage || !data.page?.can_sync}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "latest" ? "Fetching posts…" : data.page.is_demo ? "Load Demo Posts" : "Refresh latest posts"}
                </button>
                {data.page.has_older_on_facebook && (
                  <button
                    type="button"
                    onClick={() => synchronize("older")}
                    disabled={Boolean(busy) || !canManage || !data.page.can_sync}
                    className="rounded-lg border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-slate-800 disabled:opacity-40"
                  >
                    {busy === "older" ? "Fetching older posts…" : "Fetch older from Facebook"}
                  </button>
                )}
              </div>
            </div>
            {!canManage && <p className="mt-4 text-sm text-amber-200">Only workspace owners and admins can sync posts; you may still view cached posts.</p>}
            {data.page.status !== "connected" && (
              <p className="mt-4 text-sm text-amber-200">
                Your Facebook authorization needs attention. Reconnect the Page on the dashboard to sync new posts.
              </p>
            )}
            {data.page.is_demo && (
              <p className="mt-4 text-sm text-amber-200">
                This Page and every post shown below are fictional. This mode does not retrieve Facebook content.
              </p>
            )}
          </section>

          <section className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Published posts</h2>
              <p className="mt-1 text-sm text-slate-400">
                {data.total} cached {data.page.is_demo ? "demo" : "Facebook"} posts · {selected.length} selected
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="post-search">Search loaded posts</label>
              <input
                id="post-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search loaded posts"
                className="min-w-48 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
              />
              <label className="sr-only" htmlFor="post-kind">Filter by post type</label>
              <select
                id="post-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
              >
                <option value="all">All types</option>
                <option value="text">Text</option>
                <option value="image">With image</option>
                <option value="unknown">Other</option>
              </select>
            </div>
          </section>

          <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
            <input
              id="select-visible"
              type="checkbox"
              checked={allVisibleSelected}
              disabled={visibleIds.length === 0}
              onChange={toggleAllVisible}
              className="h-4 w-4 accent-sky-500"
            />
            <label htmlFor="select-visible" className="cursor-pointer">Select all currently visible posts ({visibleIds.length})</label>
            {selected.length > 0 && (
              <button type="button" onClick={() => setSelected([])} className="ml-auto text-sky-300 hover:underline">
                Clear selection
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <section className="rounded-xl border border-dashed border-slate-600 p-10 text-center">
              <h3 className="text-lg font-bold">No posts cached yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                {data.page.is_demo
                  ? "Select Load Demo Posts to see clearly labeled fictional posts."
                  : "Click Refresh latest posts. If Facebook returns no posts, publish a test post on your Page and retry."}
              </p>
            </section>
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-slate-700 p-6 text-sm text-slate-400">
              No loaded posts match your current search/filter. Clear the filter or load more posts.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((post) => (
                <article
                  key={post.id}
                  className={"overflow-hidden rounded-xl border bg-slate-900 " +
                    (selected.includes(post.id) ? "border-sky-500" : "border-slate-700")}
                >
                  {post.thumbnail_url && (
                    /* Remote images are returned by Meta; no local media is ingested in Phase 3. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.thumbnail_url} alt="Facebook post attachment" loading="lazy" className="h-48 w-full bg-slate-800 object-cover" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <input
                        aria-label={"Select post " + post.provider_post_id}
                        type="checkbox"
                        checked={selected.includes(post.id)}
                        onChange={() => toggleOne(post.id)}
                        className="mt-1 h-5 w-5 accent-sky-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>{formatDate(post.published_at)}</span>
                          <span>· {post.post_type}</span>
                          {post.is_demo && <span className="rounded bg-amber-950 px-2 py-0.5 font-bold text-amber-200">Demo Data</span>}
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-slate-100">
                          {post.caption || "(No text caption available)"}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <span className="break-all">ID: {post.provider_post_id}</span>
                          {post.permalink && !post.is_demo && (
                            <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 font-semibold text-sky-300 hover:underline">
                              View on Facebook ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {data.has_more && (
            <div className="my-6 text-center">
              <button type="button" onClick={loadMore} disabled={Boolean(busy)}
                className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-40">
                {busy === "more" ? "Loading…" : "Load more cached posts"}
              </button>
            </div>
          )}

          <section className="mt-7 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold">Selected posts: {selected.length}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Start a scripted demo scan of the selected posts. All comments and results are fictional; no Facebook comments or AI models are used.
                </p>
              </div>
              <button type="button" onClick={startScan}
                disabled={!canManage || selected.length === 0 || selected.length > 20 || Boolean(busy)}
                title="Creates clearly labeled fictional demo comments and scripted classifications. Does not fetch Facebook comments."
                className="rounded-lg bg-sky-600 px-5 py-2 font-bold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
                {busy === "scan" ? "Starting demo…" : `Start Simulated Scan (${selected.length})`}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              A scan saves the selected post IDs and creates fictional demonstration comments in PostgreSQL.
              Maximum 20 posts per scan. No genuine comment count is fetched or estimated from Facebook.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
