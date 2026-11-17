"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  expanded: string[];
  toggle: (id: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const toggle = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <AccordionContext.Provider value={{ expanded, toggle }}>
      <div className={cn("divide-y divide-border", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-2", className)} data-accordion-item={id}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { id } as Record<string, unknown>);
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context || !id) return null;
  const isOpen = context.expanded.includes(id);

  return (
    <button
      type="button"
      onClick={() => context.toggle(id)}
      className={cn(
        "flex w-full items-center justify-between py-3 text-left text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn("size-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
      />
    </button>
  );
}

export function AccordionContent({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context || !id) return null;
  const isOpen = context.expanded.includes(id);
  if (!isOpen) return null;

  return (
    <div className={cn("pb-3 pt-1 text-sm text-muted-foreground leading-relaxed", className)}>
      {children}
    </div>
  );
}
