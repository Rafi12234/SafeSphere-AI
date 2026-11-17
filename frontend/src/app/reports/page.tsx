"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGES = ["Draft", "Revision", "Ready for approval", "Approved"];

export default function ReportsPage() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  function advanceStage() {
    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      toast.success(`Report advanced to: ${STAGES[currentStageIndex + 1]}`);
    } else {
      setCurrentStageIndex(0);
      toast.info("Report reset to Draft stage");
    }
  }

  function handleExport() {
    toast.success("Report exported as PDF (Simulated)");
  }

  function handleCopy() {
    navigator.clipboard?.writeText("SafeSphere AI Safety Incident Report Summary: 12 flagged remarks, 4 repeat accounts across 6 Facebook posts.");
    toast.success("Report summary copied to clipboard");
  }

  return (
    <AppShell title="Safety Incident Reports">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Community Incident Report</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Structured documentation draft compiling repeat harassment patterns for formal review.
            </p>
          </div>

          {/* Active Interactive Buttons per user request */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              <Copy className="size-3.5" />
              Copy summary
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
              <Download className="size-3.5" />
              Export PDF
            </Button>
            <Button size="sm" variant="default" onClick={advanceStage} className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              {currentStageIndex < STAGES.length - 1 ? "Advance status" : "Restart cycle"}
            </Button>
          </div>
        </div>

        {/* Status Stepper */}
        <Card className="border bg-card p-5 shadow-xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Report Workflow Status
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    setCurrentStageIndex(idx);
                    toast.info(`Status switched to: ${stage}`);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2.5 text-xs font-medium border text-left transition-colors",
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : isPast
                      ? "bg-muted text-foreground border-border"
                      : "bg-background text-muted-foreground border-border/60 hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] shrink-0",
                      isCurrent
                        ? "bg-primary-foreground text-primary font-bold"
                        : isPast
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPast ? "✓" : idx + 1}
                  </span>
                  <span className="truncate">{stage}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Report Document Preview */}
        <Card className="border bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground">REPORT REF: SS-2026-NOV-49</p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                Targeted Harassment & Repeat Campaign Documentation
              </h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Status: {STAGES[currentStageIndex]}
            </Badge>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Executive Summary
            </h4>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed p-3.5 rounded-md border bg-muted/20">
              Between November 10, 2026 and November 17, 2026, automated comment ingestion identified a pattern of coordinated hostile activity targeting 6 published Facebook Page posts. Four distinct user accounts were flagged for persistent hostility appearing across multiple separate posts, exceeding standard community moderation thresholds.
            </p>
          </div>

          {/* Key Metrics Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-md border bg-background text-center">
              <p className="text-xs text-muted-foreground">Targeted Posts</p>
              <p className="text-xl font-bold mt-1 text-foreground">6</p>
            </div>
            <div className="p-3 rounded-md border bg-background text-center">
              <p className="text-xs text-muted-foreground">Flagged Comments</p>
              <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">18</p>
            </div>
            <div className="p-3 rounded-md border bg-background text-center">
              <p className="text-xs text-muted-foreground">Repeat Accounts</p>
              <p className="text-xl font-bold mt-1 text-destructive">4</p>
            </div>
            <div className="p-3 rounded-md border bg-background text-center">
              <p className="text-xs text-muted-foreground">Severity Level</p>
              <p className="text-xl font-bold mt-1 text-destructive">Critical</p>
            </div>
          </div>

          {/* Source-Referenced Evidence Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Itemized Factual Evidence Items
            </h4>
            <div className="rounded-md border overflow-hidden">
              <div className="divide-y text-xs">
                <div className="p-3 flex items-start justify-between gap-4 bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Item #01 · Shahriar Ahmed (Alpha)
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Post ID: 10048291 · Nov 16, 2026
                    </p>
                    <p className="text-foreground bg-background p-2 rounded border">
                      &ldquo;Toke online e shanti te thakte dibo na ami.&rdquo;
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0 text-[10px]">
                    Direct Threat
                  </Badge>
                </div>

                <div className="p-3 flex items-start justify-between gap-4 bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Item #02 · Anon Observer (Beta)
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Post ID: 10048293 · Nov 15, 2026
                    </p>
                    <p className="text-foreground bg-background p-2 rounded border">
                      &ldquo;If you post again, I&apos;ll find you and hurt you.&rdquo;
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0 text-[10px]">
                    Critical Threat
                  </Badge>
                </div>

                <div className="p-3 flex items-start justify-between gap-4 bg-muted/10">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Item #03 · Community Critic (Delta)
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Post ID: 10048295 · Nov 14, 2026
                    </p>
                    <p className="text-foreground bg-background p-2 rounded border">
                      &ldquo;Eta pura faltu, tomar kono joggota nai.&rdquo;
                    </p>
                  </div>
                  <Badge variant="warning" className="shrink-0 text-[10px]">
                    Bullying
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-wrap items-center justify-between text-xs text-muted-foreground">
            <span>Prepared with SafeSphere AI Safety Intelligence</span>
            <span>Document version 1.0</span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
