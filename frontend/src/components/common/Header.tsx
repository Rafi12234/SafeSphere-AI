"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { useMe } from "@/lib/api/queries";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const mounted = useMounted();
  const { data: me } = useMe();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuth = mounted && Boolean(me);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 h-16 transition-all duration-200",
        scrolled
          ? "border-b border-border/50 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-xs"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldAlert className="size-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {isAuth ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="default" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
