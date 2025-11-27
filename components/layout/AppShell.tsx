"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
