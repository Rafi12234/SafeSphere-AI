"use client";

import React from "react";
import { ShieldCheck, EyeOff, Lock, UserX, AlertTriangle, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal, RevealStagger, RevealChild } from "@/components/common/Reveal";

export function Trust() {
  const points = [
    {
      icon: Scale,
      title: "Human review before any action",
      description:
        "AI output is advisory. No automatic bans or punitive actions are executed without deliberate human confirmation.",
    },
    {
      icon: EyeOff,
      title: "Sensitive content hidden by default",
      description:
        "Hostile remarks are blurred in results to prevent psychological fatigue, with on-demand reveal buttons.",
    },
    {
      icon: Lock,
      title: "Encrypted credential storage",
      description:
        "All Page tokens and session secrets are encrypted using AES Fernet keys on the backend. No tokens exist in client memory.",
    },
    {
      icon: UserX,
      title: "No public offender lists",
      description:
        "We do not maintain public blacklists or share user identities. Data belongs strictly to your private workspace.",
    },
    {
      icon: AlertTriangle,
      title: "Flagged does not mean guilty",
      description:
        "Classifications highlight potential policy breaches for verification, clearly distinguishing sarcasm from hostility.",
    },
    {
      icon: ShieldCheck,
      title: "Transparent AI limitations",
      description:
        "We openly acknowledge contextual ambiguity and model limits, empowering you to adjust labels with full autonomy.",
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Built To Be Careful
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Safety tools must respect human dignity.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Our architecture is engineered around moderation ethics, data privacy, and psychological well-being.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {points.map((pt) => {
            const Icon = pt.icon;
            return (
              <RevealChild key={pt.title}>
                <Card className="h-full border border-border bg-card shadow-xs">
                  <CardHeader className="p-5 sm:p-6">
                    <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground mb-3">
                      <Icon className="size-4.5" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {pt.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                      {pt.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </RevealChild>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
