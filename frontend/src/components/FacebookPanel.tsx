"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type PageConnection = {
  id: string;
  page_id: string;
  name: string;
  status: string;
  is_demo: boolean;
  selected: boolean;
  tasks: string[];
  granted_scopes: string[];
  has_token: boolean;
};

type ConnectionResponse = {
  pages: PageConnection[];
  facebook_ready: boolean;
  demo_available: boolean;
};

const messageForStatus: Record<string, string> = {
  connected: "Facebook authorization completed. Your accessible Pages are listed below.",
  cancelled: "Facebook authorization was cancelled or declined. You can try again.",
  no_pages: "Only Facebook Pages you manage can be connected. Personal Facebook profiles and timelines are not supported. Meta did not return any eligible Page. Confirm that you manage a Facebook Page, granted SafeSphere access to that Page, and try again.",
  error: "Facebook authorization did not finish. Check your app credentials, Page permissions and backend logs (never log tokens).",
  invalid_state: "Authorization expired or was already used. Please start Connect Facebook again.",
  session_expired: "Your SafeSphere login session expired during Facebook authorization. Log in again and retry.",
};

export default function FacebookPanel({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<ConnectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const result = await api<ConnectionResponse>("/facebook/connection");
    setData(result);
  }, []);

  useEffect(() => {
    const outcome = new URLSearchParams(window.location.search).get("facebook");
    if (outcome && messageForStatus[outcome]) {
      setNotice(messageForStatus[outcome]);
      // Clear the status after presenting it, so a later refresh doesn't repeat it.
      window.history.replaceState({}, "", "/dashboard");
    }
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load Facebook connections"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function selectPage(page: PageConnection) {
    setBusyId(page.id); setError(""); setNotice("");
    try {
      await api("/facebook/select-page", {
        method: "POST", body: JSON.stringify({ connection_id: page.id }),
      });
      await refresh();
      setNotice(`${page.name} is now the selected Page.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not select Page");
    } finally {
      setBusyId(null);
    }
  }

  async function disconnect(page: PageConnection) {
    if (!window.confirm(`Disconnect ${page.name} from SafeSphere AI? Its locally stored token will be deleted.`)) return;
    setBusyId(page.id); setError(""); setNotice("");
    try {
      await api(`/facebook/connection?connection_id=${encodeURIComponent(page.id)}`, { method: "DELETE" });
      await refresh();
      setNotice("Page disconnected locally. You can also revoke its access in Facebook Business Integrations.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect Page");
    } finally {
      setBusyId(null);
    }
  }

  async function connectDemo() {
    setBusyId("demo"); setError(""); setNotice("");
    try {
      await api("/facebook/demo-connect", { method: "POST" });
      await refresh();
      setNotice("A fictional demo Page was connected. No Facebook data or token was accessed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo connection failed");
    } finally {
      setBusyId(null);
    }
  }

  const pages = data?.pages ?? [];
  const selected = pages.find((p) => p.selected);

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 md:p-7" aria-label="Facebook Page connections">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Phase 2 · Facebook connection</p>
          <h2 className="mt-1 text-xl font-bold">Your Facebook Pages</h2>
          <p className="mt-1 text-sm text-slate-400">Authorize Facebook Pages you manage. Personal profiles, profiles' timelines and groups cannot be connected.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canManage || loading || !data?.facebook_ready || busyId !== null}
            onClick={() => { window.location.assign("/api/facebook/connect"); }}
          >
            Connect Facebook
          </button>
          {data?.demo_available && (
            <button type="button" onClick={connectDemo} disabled={!canManage || busyId !== null}
              className="rounded-lg border border-amber-500/70 px-4 py-2 font-medium text-amber-200 hover:bg-amber-950/30 disabled:opacity-40">
              Try Demo Connection
            </button>
          )}
        </div>
      </div>

      <aside className="mt-5 rounded-xl border border-sky-800/80 bg-sky-950/30 p-4 text-sm text-sky-100" aria-label="Facebook Page connection eligibility">
        <p className="font-bold">Facebook Pages only — personal profiles are not supported</p>
        <p className="mt-2 leading-6 text-slate-300">
          You sign in to Facebook using your personal account to prove you manage a Page.
          SafeSphere connects only the Pages that Meta lets you authorize, not your personal profile,
          timeline, friends, or private posts. If Meta returns no eligible Page, the connection is rejected
          and you will see a Page-only warning.
        </p>
        <p className="mt-2 text-slate-300">
          You do not need a Meta Developer account to use this service once the SafeSphere Meta app
          has been approved for public Page access. Until then, Meta may restrict Facebook authorization
          to app roles and testers.
        </p>
        <details className="mt-3 rounded-lg border border-slate-700/70 p-3">
          <summary className="cursor-pointer font-semibold text-sky-300">Facebook says &ldquo;App not active&rdquo;?</summary>
          <p className="mt-2 text-slate-300">
            This block is issued by Meta before SafeSphere can read your Pages. The SafeSphere app
            administrator must check Meta app status, access restrictions and required approvals.
            Changing your Facebook password or creating a Developer account will not fix it.
          </p>
        </details>
      </aside>
      {!canManage && <p className="mt-4 text-sm text-amber-200">Only workspace owners and admins can change Facebook connections.</p>}
      {data && !data.facebook_ready && (
        <p role="status" className="mt-4 rounded-lg border border-amber-700/60 bg-amber-950/20 p-3 text-sm text-amber-200">
          Live Facebook OAuth is not configured yet. Add the Meta credentials and Fernet key to backend/.env, then restart FastAPI.
        </p>
      )}
      {notice && <p role={notice === messageForStatus.no_pages ? "alert" : "status"} className={"mt-4 rounded-lg border p-3 text-sm " + (notice === messageForStatus.no_pages ? "border-amber-600 bg-amber-950/40 text-amber-100" : "border-sky-700/60 bg-sky-950/40 text-sky-100")}>{notice}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-700/60 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-slate-400">Loading your Page connections…</p>
        ) : pages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-600 p-6 text-sm text-slate-300">
            No Facebook Pages connected yet. Choose <strong>Connect Facebook</strong> and grant access to a Page you manage. Personal profiles cannot be added as Pages.
          </div>
        ) : (
          <div className="grid gap-3">
            {pages.map((page) => (
              <div key={page.id} className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{page.name}</p>
                      {page.selected && <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-200">Selected</span>}
                      {page.is_demo && <span className="rounded-full bg-amber-950/80 px-2 py-0.5 text-xs font-bold text-amber-200">Demo Data</span>}
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-400">Page ID: {page.page_id}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Status: <span className={page.status === "connected" ? "text-emerald-300" : "text-amber-200"}>{page.status.replaceAll("_", " ")}</span>
                      {page.is_demo ? " · Fictional Page, no Meta access token" : page.has_token ? " · Token stored encrypted" : " · Needs reauthorization"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!page.selected && page.status === "connected" && (
                      <button type="button" disabled={!canManage || busyId !== null} onClick={() => selectPage(page)}
                        className="rounded-lg border border-sky-600 px-3 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-950/50 disabled:opacity-40">
                        Select Page
                      </button>
                    )}
                    <button type="button" disabled={!canManage || busyId !== null} onClick={() => disconnect(page)}
                      className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40">
                      Disconnect
                    </button>
                  </div>
                </div>
                {page.is_demo && (
                  <p className="mt-3 text-xs text-amber-200">Simulation only. Later scan results must also be labeled Demo Data.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-5 text-xs text-slate-400">
        {selected ? `Selected: ${selected.name}. Post retrieval begins in Phase 3.` : "Select a Page to prepare for Phase 3 post listing."}
        {" "}Phase 2 does not fetch comments or run AI models.
      </p>
    </section>
  );
}
