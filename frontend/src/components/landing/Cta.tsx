"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { useMe } from "@/lib/api/queries";
import { useMounted } from "@/lib/hooks/useMounted";

export function Cta() {
  const { data: me } = useMe();
  const mounted = useMounted();

  const isAuth = mounted && Boolean(me);

  return (
    <section className="py-20 md:py-28 border-t border-border/40">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Take back control of your community&apos;s conversation.
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Protect your well-being and maintain community trust with actionable, human-centered comment safety intelligence.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={isAuth ? "/dashboard" : "/register"}>
              <Button size="default" variant="default" className="gap-2">
                {isAuth ? "Go to Dashboard" : "Create free account"}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
