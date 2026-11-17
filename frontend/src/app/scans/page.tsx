"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Calendar, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useScans } from "@/lib/api/queries";

export default function ScansHistoryPage() {
  const router = useRouter();
  const { data: scans, isLoading } = useScans();

  return (
    <AppShell title="Safety Scan History">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">All Workspace Scans</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review simulated scan history. All comments, classifications and repeat accounts shown here are fictional Demo Data.
            </p>
          </div>
          <Link href="/posts">
            <Button size="sm" variant="default" className="gap-1.5">
              <Plus className="size-3.5" />
              New scan
            </Button>
          </Link>
        </div>

        <Card className="border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Scan ID</TableHead>
                <TableHead>Execution Date</TableHead>
                <TableHead className="w-[120px]">Posts Scanned</TableHead>
                <TableHead className="w-[120px]">Comments</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans && scans.length > 0 ? (
                scans.map((scan) => (
                  <TableRow
                    key={scan.id}
                    onClick={() => router.push(`/scans/${scan.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      #{scan.id.slice(0, 8)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(scan.startedAt).toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {scan.selectedPostsCount} post(s)
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {scan.statistics?.totalComments || scan.estimatedComments || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={scan.status === "completed" ? "success" : "info"}
                        className="capitalize text-[11px]"
                      >
                        {scan.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <ChevronRight className="size-4 inline-block text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-xs text-muted-foreground"
                  >
                    {isLoading
                      ? "Loading previous scans..."
                      : "No scans found. Start by selecting posts on the Posts page."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
