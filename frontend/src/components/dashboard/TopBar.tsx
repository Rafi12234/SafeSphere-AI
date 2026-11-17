"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, X } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/api/queries";
import { apiClient } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function TopBar({ title }: { title?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failure on logout
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 sm:px-6 transition-all duration-200",
          scrolled
            ? "border-b border-border/50 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-xs"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="size-4" />
          </Button>

          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            {title || "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="gap-2 text-xs"
            >
              <User className="size-3.5" />
              <span className="hidden sm:inline-block max-w-[120px] truncate">
                {me?.displayName || me?.email || "Account"}
              </span>
            </Button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-50 w-56 rounded-md border border-border bg-card p-2 shadow-md">
                  <div className="px-2 py-1.5 border-b mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {me?.displayName || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{me?.email}</p>
                    <p className="text-[10px] text-primary mt-1 font-mono uppercase tracking-wide">
                      {me?.workspaceName} · {me?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full w-64 bg-background shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
