"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar className="hidden md:flex shrink-0 fixed inset-y-0 left-0 z-30" />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <TopBar title={title} />
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
