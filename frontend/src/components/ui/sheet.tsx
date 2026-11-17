"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  className,
  title,
  description,
}: SheetProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        data-lenis-prevent
        className={cn(
          "relative z-50 flex h-full w-full max-w-md flex-col border-l bg-background p-6 shadow-xl transition ease-in-out sm:max-w-lg overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 py-4">{children}</div>
      </div>
    </div>
  );
}
