"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { KeyRound, ListFilter, PlayCircle, Eye, FileText, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    icon: KeyRound,
    title: "Connect your Facebook Page",
    userAction: "Sign in with Facebook Login for Business and grant read-only Page post access.",
    detail: "Facebook Page access tokens are stored encrypted on the server. SafeSphere never receives write, delete, or posting permissions.",
    visual: {
      type: "auth",
      label: "Facebook Business Login",
      content: "Connected Page: Verified Community Hub",
      status: "OAuth Verified · Read-only",
    },
  },
  {
    number: "02",
    icon: ListFilter,
    title: "Select posts to monitor",
    userAction: "Browse real published posts and select one or more for a fictional demo scan.",
    detail: "Easily filter by recent activity, post types, or synchronize with latest updates directly from Meta's API.",
    visual: {
      type: "posts",
      label: "Post Selection Grid",
      content: "3 Posts Selected for Demo",
      status: "Ready for scan",
    },
  },
  {
    number: "03",
    icon: PlayCircle,
    title: "Start the simulated scan",
    userAction: "Start a simulated scan and watch the scripted progress stages.",
    detail: "The prototype animates scripted stages and shows fictional examples; it does not fetch real Facebook comments or run AI.",
    visual: {
      type: "scan",
      label: "Scripted Demo Pipeline",
      content: "Preparing fictional findings...",
      status: "Progress: 85%",
    },
  },
  {
    number: "04",
    icon: Eye,
    title: "Review flagged comments & repeat accounts",
    userAction: "Explore fictional classified comments, severity labels and recurring fictional accounts.",
    detail: "Fictional sample text remains blurred until you choose to reveal it; no real commenters are analyzed.",
    visual: {
      type: "results",
      label: "Safety Insights",
      content: "4 Fictional Repeat Accounts · Demo",
      status: "Human-in-the-loop review",
    },
  },
  {
    number: "05",
    icon: FileText,
    title: "Prepare a report for your review",
    userAction: "Explore a fictional report-draft preview for future human review.",
    detail: "Reports are UI-only fictional previews; nothing is exported, submitted or verified as evidence.",
    visual: {
      type: "report",
      label: "Documentation Draft",
      content: "Fictional Report Preview",
      status: "Demo Only",
    },
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const stepIndex = Math.min(
      Math.floor(latest * STEPS.length),
      STEPS.length - 1
    );
    if (stepIndex !== activeStep && stepIndex >= 0) {
      setActiveStep(stepIndex);
    }
  });

  const current = STEPS[activeStep];

  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            How It Works
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            A safe, transparent five-step process.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            From connecting your Page to building review drafts — keeping human oversight at the center.
          </p>
        </div>

        {/* Desktop Sticky Scroll */}
        <div ref={containerRef} className="hidden md:block relative h-[280vh]">
          <div className="sticky top-28 grid grid-cols-12 gap-8 items-start">
            {/* Steps Navigation */}
            <div className="col-span-5 space-y-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;
                return (
                  <div
                    key={step.number}
                    className={cn(
                      "rounded-lg border p-4 transition-all duration-200 cursor-pointer",
                      isActive
                        ? "border-primary/50 bg-card shadow-xs"
                        : "border-border/40 bg-background/50 opacity-60 hover:opacity-100"
                    )}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-md text-xs font-semibold",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.number}
                      </div>
                      <h3
                        className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </h3>
                    </div>
                    {isActive && (
                      <div className="mt-3 text-xs text-muted-foreground leading-relaxed pl-10 space-y-2">
                        <p className="text-foreground font-medium">{step.userAction}</p>
                        <p>{step.detail}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage Visual Card */}
            <div className="col-span-7">
              <Card className="rounded-lg border bg-card p-6 shadow-xs min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Stage {current.number} · {current.visual.label}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {current.visual.status}
                    </Badge>
                  </div>

                  <div className="space-y-4 my-8">
                    <div className="rounded-md border bg-background p-4 flex items-center gap-3">
                      <current.icon className="size-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{current.visual.content}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{current.userAction}</p>
                      </div>
                    </div>

                    <div className="rounded-md border border-dashed border-border/60 p-4 text-xs text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="size-3.5 text-primary" />
                        <span>Security & Human-in-the-loop guarantee</span>
                      </div>
                      <p>{current.detail}</p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground pt-4 border-t flex justify-between items-center">
                  <span>Step {activeStep + 1} of {STEPS.length}</span>
                  <span>Scroll or click to inspect stages</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Stacked Fallback */}
        <div className="md:hidden space-y-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="p-5 border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-xs font-medium text-foreground mb-2">{step.userAction}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
