"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe } from "@/lib/api/queries";
import { useMounted } from "@/lib/hooks/useMounted";

export function Hero() {
  const { data: me } = useMe();
  const mounted = useMounted();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const previewY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const isAuth = mounted && Boolean(me);

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 font-normal text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Community safety for Facebook Pages
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.12]"
          >
            Know who is targeting your comments, before it wears you down.
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
          >
            SafeSphere AI detects targeted harassment, hate speech, and repeat harassment accounts across your Facebook Page posts — keeping you in full control without noise.
          </motion.p>

          {/* Strict Buttons: w-auto, sm/default only, side by side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href={isAuth ? "/dashboard" : "/register"}>
              <Button size="default" variant="default" className="gap-2">
                {isAuth ? "Go to Dashboard" : "Get started"}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="default" variant="outline">
                See how it works
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Product Preview Card with subtle parallax */}
        <motion.div
          style={{ y: previewY }}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 rounded-lg border border-border bg-card p-4 sm:p-6 shadow-xs max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between border-b pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="size-3 rounded-full bg-destructive/60" />
              <div className="size-3 rounded-full bg-amber-500/60" />
              <div className="size-3 rounded-full bg-emerald-500/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                safesphere.app / dashboard / overview
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
              Live Monitoring
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="rounded-md border p-3 bg-background/50">
              <p className="text-xs text-muted-foreground">Scanned Comments</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">1,248</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Across 6 posts</p>
            </div>
            <div className="rounded-md border p-3 bg-background/50">
              <p className="text-xs text-muted-foreground">Flagged Comments</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">18</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Bangla, Banglish, EN</p>
            </div>
            <div className="rounded-md border p-3 bg-background/50">
              <p className="text-xs text-muted-foreground">Repeat Accounts</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-destructive">4</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">3+ posts targeted</p>
            </div>
            <div className="rounded-md border p-3 bg-background/50">
              <p className="text-xs text-muted-foreground">Top Severity</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-destructive">Critical</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Threat flagged</p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 sm:p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
              <span>Recent Detection Sample</span>
              <span>Protected preview (blurred)</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-md bg-background border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Shahriar Ahmed (Alpha)</span>
                  <span className="filter blur-xs select-none text-muted-foreground">
                    তুমি এখানে কিছুই বোঝো না, কথা বলা বন্ধ করো।
                  </span>
                </div>
                <Badge variant="destructive" className="text-[10px]">Bullying</Badge>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-md bg-background border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Anon Observer (Beta)</span>
                  <span className="filter blur-xs select-none text-muted-foreground">
                    If you post again, there will be serious consequences.
                  </span>
                </div>
                <Badge variant="destructive" className="text-[10px]">Critical Threat</Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
