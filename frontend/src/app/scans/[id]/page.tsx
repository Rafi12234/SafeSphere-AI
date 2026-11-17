"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Search,
  Eye,
  EyeOff,
  Filter,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  BarChart3,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet } from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useScan } from "@/lib/api/queries";
import { FindingViewModel } from "@/lib/api/adapters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const STAGES = [
  { name: "Preparing fictional comments", threshold: 25 },
  { name: "Applying scripted labels", threshold: 60 },
  { name: "Preparing demo insights", threshold: 85 },
  { name: "Grouping fictional accounts", threshold: 100 },
];

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = String(params.id);

  const { data: scan, isLoading } = useScan(scanId);

  // Results State
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFinding, setSelectedFinding] = useState<FindingViewModel | null>(null);

  // Reveal safeguards: blurred by default
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [revealAll, setRevealAll] = useState(false);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12;

  function toggleReveal(id: string) {
    setRevealedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  const isCompleted = scan?.status === "completed";
  const progressPercent = scan?.progressPercent || 0;

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    if (!scan?.findings) return [];
    return scan.findings.filter((f) => {
      if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
      if (filterLabel !== "all" && f.label !== filterLabel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = (f.commentText || "").toLowerCase();
        const author = (f.authorName || "").toLowerCase();
        if (!text.includes(q) && !author.includes(q)) return false;
      }
      return true;
    });
  }, [scan?.findings, filterSeverity, filterLabel, searchQuery]);

  // Paginated Findings
  const paginatedFindings = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredFindings.slice(start, start + pageSize);
  }, [filteredFindings, pageNumber, pageSize]);

  // Chart Data: Severity distribution
  const severityChartData = useMemo(() => {
    if (!scan?.statistics?.severity) return [];
    const s = scan.statistics.severity;
    return [
      { name: "Critical", count: s.critical || 0, color: "var(--destructive)" },
      { name: "High", count: s.high || 0, color: "oklch(0.68 0.18 45)" },
      { name: "Medium", count: s.medium || 0, color: "oklch(0.7 0.12 184)" },
      { name: "Low", count: s.low || 0, color: "oklch(0.5 0.05 184)" },
    ];
  }, [scan?.statistics?.severity]);

  // Chart Data: Flagged per Post
  const postBreakdownData = useMemo(() => {
    if (!scan?.findings || !scan?.selectedPosts) return [];
    const postCounts: Record<string, number> = {};
    scan.findings.forEach((f) => {
      if (f.label !== "safe") {
        postCounts[f.postId] = (postCounts[f.postId] || 0) + 1;
      }
    });

    return scan.selectedPosts.map((p, idx) => ({
      name: `Post #${idx + 1}`,
      flagged: postCounts[p.id] || 0,
      caption: p.caption ? p.caption.slice(0, 35) + "..." : `Post ${idx + 1}`,
    }));
  }, [scan?.findings, scan?.selectedPosts]);

  if (isLoading && !scan) {
    return (
      <AppShell title="Scan Loading">
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading scan data...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={isCompleted ? `Scan Results #${scanId.slice(0, 8)}` : "Safety Scan in Progress"}>
      <div className="space-y-6">
        {/* RUNNING STATE */}
        {!isCompleted && (
          <div aria-live="polite" className="max-w-2xl mx-auto py-12">
            <Card className="border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="text-center mb-6">
                <span className="size-2 rounded-full bg-primary inline-block animate-ping mb-3" />
                <CardTitle className="text-2xl font-bold">Simulated Safety Scan Running</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Preparing fictional comments and scripted classifications. No Facebook comments are fetched and no AI inference is performed.
                </CardDescription>
              </div>

              {/* Progress Bar & Counter */}
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{scan?.processedComments || 0} fictional comments processed</span>
                  <span className="font-semibold text-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
              </div>

              {/* Four Pipeline Stages */}
              <div className="space-y-3 pt-4 border-t">
                {STAGES.map((stg) => {
                  const isDone = progressPercent >= stg.threshold;
                  const isCurrent =
                    progressPercent < stg.threshold &&
                    progressPercent >= stg.threshold - 25;

                  return (
                    <div
                      key={stg.name}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border text-xs transition-colors",
                        isDone
                          ? "bg-muted/40 border-border/60 text-foreground"
                          : isCurrent
                          ? "bg-primary/5 border-primary/40 text-foreground font-medium"
                          : "opacity-40 border-border/40 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : isCurrent ? (
                          <Clock className="size-4 text-primary animate-spin" />
                        ) : (
                          <div className="size-4 rounded-full border border-muted-foreground/40" />
                        )}
                        <span>{stg.name}</span>
                      </div>
                      <span className="font-mono text-[11px]">
                        {isDone ? "Done" : isCurrent ? "Processing" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* COMPLETED RESULTS VIEW */}
        {isCompleted && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Scan Summary</h2>
                  <Badge variant="success" className="text-xs">
                    Completed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Started {new Date(scan.startedAt).toLocaleString()} · Scanned{" "}
                  {scan.selectedPosts.length} selected post(s).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/posts">
                  <Button size="sm" variant="outline">
                    Scan more posts
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button size="sm" variant="default" className="gap-1.5">
                    Prepare report
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="flagged">
                  Flagged Comments ({filteredFindings.length})
                </TabsTrigger>
                <TabsTrigger value="repeat">
                  Repeat Accounts ({scan.statistics?.repeatAccounts.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border p-4 bg-card shadow-xs">
                    <p className="text-xs text-muted-foreground">Fictional Demo Comments</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">
                      {scan.statistics?.totalComments || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Across all posts</p>
                  </Card>

                  <Card className="border p-4 bg-card shadow-xs">
                    <p className="text-xs text-muted-foreground">Flagged Comments</p>
                    <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                      {scan.statistics?.flagged || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Policy violations</p>
                  </Card>

                  <Card className="border p-4 bg-card shadow-xs">
                    <p className="text-xs text-muted-foreground">Critical Threats</p>
                    <p className="text-2xl font-bold mt-1 text-destructive">
                      {scan.statistics?.critical || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Requires attention</p>
                  </Card>

                  <Card className="border p-4 bg-card shadow-xs">
                    <p className="text-xs text-muted-foreground">Repeat Accounts</p>
                    <p className="text-2xl font-bold mt-1 text-destructive">
                      {scan.statistics?.repeatAccounts.length || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Multi-post actors</p>
                  </Card>
                </div>

                {/* Visual Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Severity Breakdown Bar Chart */}
                  <Card className="border p-5 bg-card shadow-xs">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      Severity Distribution
                    </h3>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                          <YAxis fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0.5rem",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {severityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Flagged Comments per Post */}
                  <Card className="border p-5 bg-card shadow-xs">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      Flagged Comments by Post
                    </h3>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={postBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                          <YAxis fontSize={11} stroke="currentColor" className="text-muted-foreground" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0.5rem",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="flagged" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* TAB 2: FLAGGED COMMENTS TABLE */}
              <TabsContent value="flagged" className="space-y-4">
                {/* Table Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Free Search */}
                    <div className="relative w-48 sm:w-64">
                      <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search comments or author..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPageNumber(1);
                        }}
                        className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    {/* Severity Filter */}
                    <select
                      value={filterSeverity}
                      onChange={(e) => {
                        setFilterSeverity(e.target.value);
                        setPageNumber(1);
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    {/* Label Filter */}
                    <select
                      value={filterLabel}
                      onChange={(e) => {
                        setFilterLabel(e.target.value);
                        setPageNumber(1);
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="all">All Categories</option>
                      <option value="harassment">Harassment</option>
                      <option value="bullying">Bullying</option>
                      <option value="threat">Threat</option>
                      <option value="body_shaming">Body Shaming</option>
                      <option value="hate">Hate Speech</option>
                    </select>
                  </div>

                  {/* Reveal All Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRevealAll((prev) => !prev)}
                      className="gap-1.5 text-xs"
                    >
                      {revealAll ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      {revealAll ? "Hide all abusive text" : "Reveal all text"}
                    </Button>
                  </div>
                </div>

                {/* Comments Table */}
                <Card className="border bg-card shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Author</TableHead>
                        <TableHead>Comment Remark (Protected)</TableHead>
                        <TableHead className="w-[110px]">Category</TableHead>
                        <TableHead className="w-[100px]">Severity</TableHead>
                        <TableHead className="w-[90px]">Language</TableHead>
                        <TableHead className="w-[80px] text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedFindings.length > 0 ? (
                        paginatedFindings.map((finding) => {
                          const isRevealed =
                            revealAll || revealedIds.includes(finding.id);

                          return (
                            <TableRow
                              key={finding.id}
                              onClick={() => setSelectedFinding(finding)}
                              className="cursor-pointer"
                            >
                              <TableCell className="font-medium text-xs">
                                {finding.authorName || "Anonymous"}
                              </TableCell>

                              <TableCell className="text-xs">
                                <div className="flex items-center justify-between gap-3">
                                  <span
                                    className={cn(
                                      "transition-all duration-200 select-none",
                                      isRevealed
                                        ? "filter-none text-foreground font-normal"
                                        : "filter blur-xs text-muted-foreground opacity-60"
                                    )}
                                  >
                                    {finding.commentText || "Empty comment"}
                                  </span>

                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReveal(finding.id);
                                    }}
                                    title={isRevealed ? "Hide" : "Reveal"}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="size-3.5" />
                                    ) : (
                                      <Eye className="size-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge variant="outline" className="capitalize text-[11px]">
                                  {finding.label.replaceAll("_", " ")}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant={
                                    finding.severity === "critical" || finding.severity === "high"
                                      ? "destructive"
                                      : finding.severity === "medium"
                                      ? "warning"
                                      : "muted"
                                  }
                                  className="capitalize text-[11px]"
                                >
                                  {finding.severity}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-xs uppercase font-mono text-muted-foreground">
                                {finding.languageCode}
                              </TableCell>

                              <TableCell className="text-right">
                                <ChevronRight className="size-4 inline-block text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                            No comments match the selected filter criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>

                {/* Table Pagination */}
                {filteredFindings.length > pageSize && (
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>
                      Showing {(pageNumber - 1) * pageSize + 1}–
                      {Math.min(pageNumber * pageSize, filteredFindings.length)} of{" "}
                      {filteredFindings.length} comments
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pageNumber === 1}
                        onClick={() => setPageNumber((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pageNumber * pageSize >= filteredFindings.length}
                        onClick={() => setPageNumber((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: REPEAT ACCOUNTS */}
              <TabsContent value="repeat" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scan.statistics?.repeatAccounts.map((account) => (
                    <Card key={account.authorId} className="border bg-card p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                            <Users className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              {account.displayName}
                            </h4>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {account.authorId}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={account.maxSeverity === "critical" ? "destructive" : "warning"}
                          className="capitalize text-xs"
                        >
                          {account.maxSeverity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y my-3">
                        <div>
                          <p className="text-muted-foreground">Flagged Comments</p>
                          <p className="font-semibold text-foreground mt-0.5 text-sm">
                            {account.flaggedComments}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Targeted Posts</p>
                          <p className="font-semibold text-foreground mt-0.5 text-sm">
                            {account.affectedPosts} post(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {account.meetsIncidentThreshold
                            ? "Cross-post campaign flagged"
                            : "Repeated hostility observed"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSearchQuery(account.displayName);
                            setActiveTab("flagged");
                          }}
                        >
                          View remarks →
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Comment Detail Drawer (Sheet) */}
        <Sheet
          open={selectedFinding !== null}
          onOpenChange={(open) => !open && setSelectedFinding(null)}
          title="Comment Safety Inspection"
          description="Detailed classification parameters and original context."
        >
          {selectedFinding && (
            <div className="space-y-5 text-sm">
              {/* Abusive text preview */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Comment Remark
                </label>
                <div className="p-3.5 rounded-md border bg-muted/30 text-sm leading-relaxed text-foreground">
                  {selectedFinding.commentText}
                </div>
              </div>

              {/* Classification metadata */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md border bg-card">
                <div>
                  <p className="text-xs text-muted-foreground">Policy Category</p>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">
                    {selectedFinding.label.replaceAll("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Severity Level</p>
                  <Badge
                    variant={
                      selectedFinding.severity === "critical" || selectedFinding.severity === "high"
                        ? "destructive"
                        : "warning"
                    }
                    className="capitalize text-xs mt-0.5"
                  >
                    {selectedFinding.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Detected Language</p>
                  <p className="font-semibold text-foreground mt-0.5 uppercase font-mono">
                    {selectedFinding.languageCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Author</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedFinding.authorName || "Anonymous"}
                  </p>
                </div>
              </div>

              {/* Explanation & Reason code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Safety Rationale
                </label>
                <p className="text-xs text-foreground leading-relaxed p-3 rounded-md border bg-background">
                  {selectedFinding.explanation || "Scripted demonstration classification; not a live AI determination."}
                </p>
              </div>

              {/* Associated Post Context */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Associated Facebook Post
                </label>
                <div className="p-3 rounded-md border bg-muted/20 text-xs text-muted-foreground">
                  <p className="text-foreground line-clamp-2">
                    {selectedFinding.postCaption || "Post update"}
                  </p>
                  <p className="font-mono text-[10px] mt-1 text-muted-foreground">
                    Post ID: {selectedFinding.postId}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFinding(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Sheet>
      </div>
    </AppShell>
  );
}
