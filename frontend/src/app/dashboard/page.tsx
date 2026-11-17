"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Link2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Search,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useConnections,
  useSelectPage,
  useDisconnectPage,
  useDemoConnect,
  useScans,
} from "@/lib/api/queries";
import { toast } from "sonner";

function DashboardContent() {
  const searchParams = useSearchParams();
  const outcome = searchParams.get("facebook");

  const { data: connData, isLoading: loadingConn } = useConnections();
  const { data: scans, isLoading: loadingScans } = useScans();

  const selectPageMutation = useSelectPage();
  const disconnectMutation = useDisconnectPage();
  const demoConnectMutation = useDemoConnect();

  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);

  // Handle OAuth outcome banner from URL
  useEffect(() => {
    if (!outcome) return;
    const messages: Record<string, { title: string; description: string; type: "success" | "error" }> = {
      connected: {
        title: "Facebook Page Connected",
        description: "Your Facebook Page has been linked successfully.",
        type: "success",
      },
      cancelled: {
        title: "Authorization Cancelled",
        description: "Facebook authorization was cancelled or denied.",
        type: "error",
      },
      no_pages: {
        title: "No Eligible Pages Found",
        description: "No Facebook Pages with required permissions were returned.",
        type: "error",
      },
      invalid_state: {
        title: "Verification Error",
        description: "OAuth state verification failed. Please try again.",
        type: "error",
      },
      session_expired: {
        title: "Session Expired",
        description: "Your session expired during authorization. Please log in again.",
        type: "error",
      },
      error: {
        title: "Connection Error",
        description: "Unable to complete connection. Please retry.",
        type: "error",
      },
    };

    const msg = messages[outcome];
    if (msg) {
      if (msg.type === "success") {
        toast.success(msg.title, { description: msg.description });
      } else {
        toast.error(msg.title, { description: msg.description });
      }
    }
  }, [outcome]);

  const pages = connData?.pages || [];
  const selectedPage = pages.find((p) => p.selected && p.status === "connected");
  const hasMultipleUnselected = pages.length > 1 && !selectedPage;

  // Latest completed scan for summary metrics
  const latestCompletedScan = scans?.find((s) => s.status === "completed");

  function handleConnectReal() {
    window.location.assign("/api/facebook/connect");
  }

  async function handleDemoConnect() {
    try {
      await demoConnectMutation.mutateAsync();
      toast.success("Demo Page Connected", {
        description: "Connected to SafeSphere AI Demo Hub.",
      });
    } catch {
      toast.error("Failed to connect demo page");
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await disconnectMutation.mutateAsync(id);
      setConfirmDisconnectId(null);
      toast.success("Page disconnected");
    } catch {
      toast.error("Failed to disconnect Page");
    }
  }

  async function handleSelect(id: string) {
    try {
      await selectPageMutation.mutateAsync(id);
      toast.success("Active Page selected");
    } catch {
      toast.error("Failed to set active Page");
    }
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* State A: No Connected Page */}
        {!selectedPage && !loadingConn && (
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-6">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary mb-3">
                <Link2 className="size-5" />
              </div>
              <CardTitle className="text-xl font-bold">Connect your Facebook Page</CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed max-w-2xl mt-1.5">
                Link a Facebook Page you manage to review comments and identify repeat abuse. We only request read-only access to published posts. We never post, delete, or take actions on your behalf.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="default"
                  variant="default"
                  onClick={handleConnectReal}
                  className="gap-2"
                >
                  <Link2 className="size-4" />
                  Connect Facebook
                </Button>

                {connData?.demoAvailable && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={handleDemoConnect}
                    disabled={demoConnectMutation.isPending}
                    className="gap-2"
                  >
                    <Sparkles className="size-4 text-primary" />
                    {demoConnectMutation.isPending ? "Connecting..." : "Use demo Page"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* State B: Multiple Pages Available - Selection Required */}
        {hasMultipleUnselected && (
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold">Select an Active Facebook Page</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Multiple Facebook Pages are available. Choose which Page to monitor for comment safety.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border p-3 bg-background"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">ID: {p.pageId}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelect(p.id)}
                    disabled={selectPageMutation.isPending}
                  >
                    Select Page
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* State C: Connected Page */}
        {selectedPage && (
          <>
            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">{selectedPage.name}</h2>
                        <Badge variant="success" className="gap-1 text-xs">
                          <CheckCircle2 className="size-3" /> Connected
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Page ID: {selectedPage.pageId} · Read-only access active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href="/posts">
                      <Button size="default" variant="default" className="gap-2">
                        View posts
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>

                    {confirmDisconnectId === selectedPage.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDisconnect(selectedPage.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDisconnectId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDisconnectId(selectedPage.id)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Overview from Latest Scan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border p-4 bg-card shadow-xs">
                <p className="text-xs font-medium text-muted-foreground">Scanned Comments</p>
                <p className="text-2xl font-bold mt-1 text-foreground">
                  {latestCompletedScan?.statistics?.totalComments ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">From recent scan</p>
              </Card>

              <Card className="border border-border p-4 bg-card shadow-xs">
                <p className="text-xs font-medium text-muted-foreground">Flagged Comments</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {latestCompletedScan?.statistics?.flagged ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Policy warnings</p>
              </Card>

              <Card className="border border-border p-4 bg-card shadow-xs">
                <p className="text-xs font-medium text-muted-foreground">Repeat Accounts</p>
                <p className="text-2xl font-bold mt-1 text-destructive">
                  {latestCompletedScan?.statistics?.repeatAccounts.length ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Multi-post hostility</p>
              </Card>

              <Card className="border border-border p-4 bg-card shadow-xs">
                <p className="text-xs font-medium text-muted-foreground">Top Severity Level</p>
                <p className="text-2xl font-bold mt-1 capitalize text-destructive">
                  {latestCompletedScan?.statistics?.critical ? "Critical" : "Standard"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Safety threshold</p>
              </Card>
            </div>

            {/* Quick Action Banner */}
            <Card className="border border-border bg-muted/30 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Ready to scan published Page posts?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select posts to analyze comments, discover repeat accounts, and export reviews.
                </p>
              </div>
              <Link href="/posts">
                <Button size="sm" variant="default" className="gap-2">
                  Select posts to scan
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </Card>

            {/* Recent Scans Table */}
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Workspace Scans</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Review safety scan history and navigate to full findings.
                    </CardDescription>
                  </div>
                  <Link href="/scans">
                    <Button size="sm" variant="outline">
                      View all history
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {scans && scans.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {scans.slice(0, 5).map((scan) => (
                      <div
                        key={scan.id}
                        className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground font-mono">
                              Scan #{scan.id.slice(0, 8)}
                            </span>
                            <Badge
                              variant={scan.status === "completed" ? "success" : "info"}
                              className="text-[10px]"
                            >
                              {scan.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Started: {new Date(scan.startedAt).toLocaleString()} ·{" "}
                            {scan.selectedPosts.length} post(s)
                          </p>
                        </div>

                        <Link href={`/scans/${scan.id}`}>
                          <Button size="sm" variant="ghost">
                            View results →
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No scans have been initiated yet. Go to Posts to start your first scan.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">
          Loading dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
