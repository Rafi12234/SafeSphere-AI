import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldAlert className="size-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </Link>
        <p className="text-xs text-muted-foreground">{siteConfig.copyright}</p>
      </div>
    </footer>
  );
}
