"use client";

import React from "react";
import { Link2, Languages, Users, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Reveal, RevealStagger, RevealChild } from "@/components/common/Reveal";

export function Features() {
  const items = [
    {
      icon: Link2,
      title: "Connect your Page securely",
      description:
        "Seamless Meta Business Login with read-only permissions. We never post, delete, or take actions on your behalf.",
    },
    {
      icon: Languages,
      title: "Find abusive comments",
      description:
        "Tuned safety classification for Bangla, Banglish, and English remarks, identifying hostility, threats, and bullying.",
    },
    {
      icon: Users,
      title: "Spot repeat accounts across posts",
      description:
        "Automatically group accounts that consistently leave hostile comments across multiple distinct posts.",
    },
    {
      icon: CheckCircle2,
      title: "Review before you act",
      description:
        "Human-in-the-loop review. Abusive text is blurred by default to preserve peace of mind while building factual records.",
    },
  ];

  return (
    <section id="what-it-does" className="py-20 md:py-28 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            What It Does
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Clarity and protection for your digital space.
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            SafeSphere AI helps community leaders distinguish genuine feedback from coordinated intimidation campaigns.
          </p>
        </Reveal>

        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <RevealChild key={item.title}>
                <Card className="h-full border border-border bg-card transition-all duration-200 hover:border-border/80 hover:shadow-xs">
                  <CardHeader className="p-6">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary mb-4">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {item.description}
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
