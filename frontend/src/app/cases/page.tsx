"use client";

import React, { useState } from "react";
import {
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

interface CaseItem {
  id: string;
  authorName: string;
  accountHandle: string;
  status: "Detected" | "In review" | "Confirmed for draft";
  severity: "critical" | "high" | "medium";
  incidentCount: number;
  targetedPostsCount: number;
  lastActive: string;
  timeline: Array<{
    date: string;
    action: string;
    remark: string;
  }>;
}

const INITIAL_CASES: CaseItem[] = [
  {
    id: "CASE-2026-081",
    authorName: "Shahriar Ahmed (Alpha)",
    accountHandle: "demo:author-alpha",
    status: "Confirmed for draft",
    severity: "critical",
    incidentCount: 5,
    targetedPostsCount: 4,
    lastActive: "Today at 02:15 PM",
    timeline: [
      {
        date: "Today, 02:15 PM",
        action: "Direct Threat Remark",
        remark: "Toke online e shanti te thakte dibo na ami.",
      },
      {
        date: "Nov 15, 08:30 PM",
        action: "Bullying & Mocking",
        remark: "Shobai tomake niye hashe, post bondho koro ekhoni.",
      },
      {
        date: "Nov 14, 11:20 AM",
        action: "Silencing Remark",
        remark: "তুমি এখানে কিছুই বোঝো না, কথা বলা বন্ধ করো।",
      },
    ],
  },
  {
    id: "CASE-2026-082",
    authorName: "Anon Observer (Beta)",
    accountHandle: "demo:author-beta",
    status: "In review",
    severity: "high",
    incidentCount: 4,
    targetedPostsCount: 3,
    lastActive: "Yesterday at 06:40 PM",
    timeline: [
      {
        date: "Yesterday, 06:40 PM",
        action: "Intimidation Remark",
        remark: "If you keep posting this, there will be serious consequences.",
      },
      {
        date: "Nov 13, 04:10 PM",
        action: "Hostility Remark",
        remark: "Nobody wants to hear your opinion on this page.",
      },
    ],
  },
  {
    id: "CASE-2026-083",
    authorName: "Community Critic (Delta)",
    accountHandle: "demo:author-delta",
    status: "Detected",
    severity: "medium",
    incidentCount: 3,
    targetedPostsCount: 3,
    lastActive: "Nov 15 at 09:12 AM",
    timeline: [
      {
        date: "Nov 15, 09:12 AM",
        action: "Silencing Remark",
        remark: "Abar ashchish faltu bhab niye? Chup thak.",
      },
      {
        date: "Nov 12, 01:45 PM",
        action: "Hostile Sarcasm",
        remark: "Eta pura faltu ekta post, tomar kono joggota nai.",
      },
    ],
  },
];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  function handleStatusChange(caseId: string, newStatus: CaseItem["status"]) {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
    );
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    toast.success(`Case updated to "${newStatus}"`);
  }

  return (
    <AppShell title="Safety Cases & Incident Grouping">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Active Harassment Cases</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review grouped incidents by repeat offenders across your Facebook community.
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={() => toast.success("New case template created")}
          >
            <Plus className="size-3.5" />
            Create case file
          </Button>
        </div>

        {/* Cases Table */}
        <Card className="border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Case ID</TableHead>
                <TableHead>Account / Entity</TableHead>
                <TableHead className="w-[120px]">Severity</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[120px]">Incidents</TableHead>
                <TableHead className="w-[160px]">Last Incident</TableHead>
                <TableHead className="w-[100px] text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-mono text-xs font-semibold">
                    {c.id}
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.authorName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {c.accountHandle}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        c.severity === "critical"
                          ? "destructive"
                          : c.severity === "high"
                          ? "warning"
                          : "muted"
                      }
                      className="capitalize text-[11px]"
                    >
                      {c.severity}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        c.status === "Confirmed for draft"
                          ? "success"
                          : c.status === "In review"
                          ? "info"
                          : "outline"
                      }
                      className="text-[11px]"
                    >
                      {c.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    {c.incidentCount} remark{c.incidentCount > 1 ? "s" : ""} across {c.targetedPostsCount} post(s)
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {c.lastActive}
                  </TableCell>

                  <TableCell className="text-right">
                    <ChevronRight className="size-4 inline-block text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Case Detail Drawer */}
        <Sheet
          open={selectedCase !== null}
          onOpenChange={(open) => !open && setSelectedCase(null)}
          title={selectedCase?.id || "Case Review"}
          description="Detailed incident timeline and moderation status."
        >
          {selectedCase && (
            <div className="space-y-6 text-sm">
              <div className="p-3.5 rounded-md border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{selectedCase.authorName}</h3>
                  <Badge variant="destructive" className="capitalize text-[10px]">
                    {selectedCase.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Account Identifier: {selectedCase.accountHandle}
                </p>
              </div>

              {/* Status Update Actions (Active Buttons per instructions) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Update Case Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedCase.status === "Detected" ? "default" : "outline"}
                    onClick={() => handleStatusChange(selectedCase.id, "Detected")}
                  >
                    Detected
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCase.status === "In review" ? "default" : "outline"}
                    onClick={() => handleStatusChange(selectedCase.id, "In review")}
                  >
                    In review
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedCase.status === "Confirmed for draft"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleStatusChange(selectedCase.id, "Confirmed for draft")
                    }
                  >
                    Confirmed for draft
                  </Button>
                </div>
              </div>

              {/* Incident Timeline */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Incident History Timeline
                </label>
                <div className="border-l-2 border-primary/40 pl-4 space-y-4 my-2">
                  {selectedCase.timeline.map((item, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <div className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{item.action}</span>
                        <span className="text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground bg-background p-2 rounded border leading-relaxed">
                        &ldquo;{item.remark}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCase(null)}
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
