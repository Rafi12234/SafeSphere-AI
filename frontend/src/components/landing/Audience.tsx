"use client";

import React from "react";
import { UserCheck, Sparkles, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Reveal, RevealStagger, RevealChild } from "@/components/common/Reveal";

export function Audience() {
  const audiences = [
    {
      icon: UserCheck,
      role: "Public Figures & Leaders",
      pain: "High volume of public engagement makes it nearly impossible to spot personal threats among thousands of comments.",
      help: "SafeSphere isolates critical threats and repeated hostile actors into an organized review queue.",
    },
    {
      icon: Sparkles,
      role: "Digital Creators & Artists",
      pain: "Coordinated trolling campaigns and cyberbullying drain energy and impact creative focus.",
      help: "Automatic script detection covers Bangla and Banglish phonetics with sensitive text shielded from sight.",
    },
    {
      icon: Shield,
      role: "Page Admins & Moderators",
      pain: "Manual comment screening is repetitive, emotionally exhausting, and lacks cross-post tracking.",
      help: "Export verified incident timelines with timestamped evidence for moderation actions or record keeping.",
    },
  ];

  return (
    <section id="who-its-for" className="py-20 md:py-28 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Who It&apos;s For
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Built for voices that need protection online.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Tailored specifically for those who manage high-visibility communities and public pages.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {audiences.map((aud) => {
            const Icon = aud.icon;
            return (
              <RevealChild key={aud.role}>
                <Card className="h-full border border-border bg-card shadow-xs flex flex-col justify-between">
                  <CardHeader className="p-6">
                    <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground mb-4">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {aud.role}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4 text-sm leading-relaxed flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1">
                        Challenge
                      </p>
                      <p className="text-muted-foreground">{aud.pain}</p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold uppercase text-primary tracking-wide mb-1">
                        How SafeSphere Helps
                      </p>
                      <p className="text-foreground">{aud.help}</p>
                    </div>
                  </CardContent>
                </Card>
              </RevealChild>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
