"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  History,
  CheckSquare,
  Square,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  ExternalLink,
  Play,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePosts, useSyncPosts, useCreateScan } from "@/lib/api/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PostsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const { data, isLoading, refetch } = usePosts(limit, offset);
  const syncMutation = useSyncPosts();
  const createScanMutation = useCreateScan();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const posts = data?.posts || [];
  const page = data?.page;
  const total = data?.total || 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === posts.length && posts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map((p) => p.id));
    }
  }

  async function handleSync(mode: "latest" | "older") {
    try {
      const res = await syncMutation.mutateAsync(mode);
      toast.success(
        mode === "latest" ? "Synced latest posts" : "Fetched older posts",
        {
          description: `${res.synced} posts updated from Meta.`,
        }
      );
    } catch (err: any) {
      toast.error("Failed to sync posts", {
        description: err.message || "Please check your Facebook connection.",
      });
    }
  }

  async function handleStartScan() {
    if (selectedIds.length === 0) return;
    try {
      const res = await createScanMutation.mutateAsync(selectedIds);
      toast.success("Scan started", {
        description: `Analyzing ${selectedIds.length} post(s).`,
      });
      router.push(`/scans/${res.id}`);
    } catch (err: any) {
      toast.error("Failed to start scan", {
        description: err.message || "Please select valid posts.",
      });
    }
  }

  const isAllSelected = posts.length > 0 && selectedIds.length === posts.length;

  return (
    <AppShell title="Facebook Page Posts">
      <div className="space-y-6 pb-20">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Published Posts</h2>
              {page && (
                <Badge variant="outline" className="text-xs">
                  {page.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select published posts to ingest comments and run safety scans.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSync("latest")}
              disabled={syncMutation.isPending || !page}
              className="gap-1.5"
            >
              <RotateCcw className={cn("size-3.5", syncMutation.isPending && "animate-spin")} />
              Refresh latest
            </Button>

            {page?.hasOlderOnFacebook && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSync("older")}
                disabled={syncMutation.isPending}
                className="gap-1.5"
              >
                <History className="size-3.5" />
                Load older posts
              </Button>
            )}

            {posts.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleSelectAll}
                className="gap-1.5"
              >
                {isAllSelected ? (
                  <>
                    <Square className="size-3.5" /> Deselect all
                  </>
                ) : (
                  <>
                    <CheckSquare className="size-3.5" /> Select all on page
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Empty state: No connected Page */}
        {!page && !isLoading && (
          <Card className="border p-8 text-center bg-card shadow-xs">
            <ShieldAlert className="size-8 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold">No Facebook Page selected</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Please connect and select a Page on your dashboard to load published posts.
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/dashboard">
                <Button size="sm" variant="default">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Posts Grid */}
        {page && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => {
              const isSelected = selectedIds.includes(post.id);
              return (
                <Card
                  key={post.id}
                  onClick={() => toggleSelect(post.id)}
                  className={cn(
                    "cursor-pointer border transition-all duration-200 hover:border-border/80 shadow-xs flex flex-col justify-between overflow-hidden",
                    isSelected
                      ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                      : "bg-card"
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Type, Date & Checkbox */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "size-5 rounded border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-background"
                        )}
                      >
                        {isSelected && <CheckSquare className="size-3.5" />}
                      </div>
                    </div>

                    {/* Thumbnail Image if available */}
                    {post.thumbnailUrl ? (
                      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
                        <img
                          src={post.thumbnailUrl}
                          alt="Post thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-md bg-muted/40 text-muted-foreground border border-dashed">
                        <ImageIcon className="size-5 opacity-40 mr-2" />
                        <span className="text-xs">Text update</span>
                      </div>
                    )}

                    {/* Caption snippet */}
                    <p className="text-xs text-foreground line-clamp-3 leading-relaxed font-normal">
                      {post.caption || "No caption provided for this post."}
                    </p>
                  </CardContent>

                  {/* Card Footer: Comments badge & link */}
                  <div className="px-4 py-3 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="size-3.5" />
                      {/* Empty badge adaptation per user specification */}
                      <Badge variant="outline" className="text-[11px] font-mono px-1.5 py-0">
                        {post.commentCount !== null ? `${post.commentCount}` : "—"}
                      </Badge>
                    </div>

                    {post.permalink && (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] hover:text-foreground transition-colors"
                      >
                        <span>Meta link</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty state: Page connected but no posts synced */}
        {page && posts.length === 0 && !isLoading && (
          <Card className="border p-8 text-center bg-card shadow-xs">
            <h3 className="text-base font-semibold">No posts synchronized yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Click Refresh Latest to pull recent publications from your Facebook Page.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleSync("latest")}
                disabled={syncMutation.isPending}
              >
                Sync Posts Now
              </Button>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <span>
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} posts
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={offset + limit >= total}
                onClick={() => setOffset((prev) => prev + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Sticky Selected-Count Bottom Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 inset-x-0 z-40 px-4">
            <div className="max-w-xl mx-auto rounded-lg border border-border bg-card/95 backdrop-blur-md p-3.5 shadow-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 pl-2">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-foreground">
                  {selectedIds.length} post{selectedIds.length > 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="default"
                  variant="default"
                  onClick={handleStartScan}
                  disabled={createScanMutation.isPending}
                  className="gap-2"
                >
                  <Play className="size-3.5 fill-current" />
                  {createScanMutation.isPending ? "Starting..." : "Start scan"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
