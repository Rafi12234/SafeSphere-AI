"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Link2, Moon, Sun, LogOut, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useMe, useConnections, useDisconnectPage } from "@/lib/api/queries";
import { apiClient } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: me } = useMe();
  const { data: connData } = useConnections();
  const disconnectMutation = useDisconnectPage();

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const selectedPage = connData?.pages?.find((p) => p.selected && p.status === "connected");

  async function handleDisconnect() {
    if (!selectedPage) return;
    try {
      await disconnectMutation.mutateAsync(selectedPage.id);
      setConfirmDisconnect(false);
      toast.success("Facebook Page disconnected");
    } catch {
      toast.error("Failed to disconnect Page");
    }
  }

  async function handleLogout() {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <AppShell title="Settings">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Workspace Settings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your connected account, Facebook integration, and workspace preferences.
          </p>
        </div>

        {/* Workspace Info */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Active Workspace</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="flex items-center justify-between text-xs py-2 border-b">
              <span className="text-muted-foreground">Workspace Name</span>
              <span className="font-semibold text-foreground">
                {me?.workspaceName || "Default Workspace"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-2 border-b">
              <span className="text-muted-foreground">Administrator Email</span>
              <span className="font-mono text-foreground">{me?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-muted-foreground">Your Role</span>
              <Badge variant="outline" className="capitalize text-[11px]">
                {me?.role || "Owner"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Connected Page */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <Link2 className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Facebook Page Connection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {selectedPage ? (
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{selectedPage.name}</p>
                    <Badge variant="success" className="text-[10px]">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    ID: {selectedPage.pageId}
                  </p>
                </div>

                {confirmDisconnect ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDisconnect(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDisconnect(true)}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>No Facebook Page currently connected.</span>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => router.push("/dashboard")}
                >
                  Connect Page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Preferences */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold">Display Theme</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Toggle between Accessible Teal light and dark presentation modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card className="border bg-card shadow-xs">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold">Session</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Securely sign out of your SafeSphere AI workspace session.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="size-3.5" />
              Log out of SafeSphere
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
