"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, LayoutDashboard, ClipboardCheck, TrendingUp, Database, Info, LogOut, ChevronDown, Menu, X,
  type LucideIcon,
} from "lucide-react";
import { APP_VERSION, RELATIONSHIP_MANAGER } from "@/data/presentation";

/**
 * APP SHELL — persistent left sidebar (desktop) / hamburger + drawer (mobile).
 * Wraps every /(app) route via the route-group layout; the public landing at
 * "/" renders WITHOUT it. Presentation only — no data, no scoring.
 */

interface NavItem { href: string; label: string; icon: LucideIcon; isActive: (path: string) => boolean; }

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, isActive: p => p.startsWith("/dashboard") || p.startsWith("/business") },
  { href: "/assess", label: "Assess Business", icon: ClipboardCheck, isActive: p => p.startsWith("/assess") },
  { href: "/simulator/climber", label: "Simulator (What-If)", icon: TrendingUp, isActive: p => p.startsWith("/simulator") },
  { href: "/data-sources", label: "Data Sources", icon: Database, isActive: p => p.startsWith("/data-sources") },
  { href: "/", label: "About Aegis", icon: Info, isActive: () => false },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
          <Shield className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight text-white">AEGIS</p>
          <p className="text-xs text-white/70">MSME Credit Intelligence</p>
        </div>
      </div>

      <nav className="mt-2 space-y-1 px-3">
        {NAV.map(item => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-6 pb-5 pt-6">
        <div className="flex items-center gap-2 text-white">
          <Shield className="h-4 w-4" strokeWidth={1.75} />
          <p className="text-sm font-semibold">Deterministic Engine</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/70">100-point Core · Explainable Decisions</p>
        <p className="mt-3 text-xs text-white/70">Version {APP_VERSION}</p>
        <p className="text-xs text-white/70">© 2025 Aegis by IDBI Innovate</p>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">RM</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-white">{RELATIONSHIP_MANAGER.name}</p>
            <p className="truncate text-xs text-white/80">{RELATIONSHIP_MANAGER.role}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/70" strokeWidth={1.75} />
        </div>

        <button
          type="button"
          className="mt-2 flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Log out
        </button>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#1a4731] text-white/70 md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="flex min-h-[56px] items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center text-[#374151]"
        >
          <Menu className="h-6 w-6" strokeWidth={1.75} />
        </button>
        <span className="text-base font-semibold tracking-tight text-[#111827]">AEGIS</span>
        <span className="h-11 w-11" aria-hidden />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex h-full w-72 max-w-[80vw] flex-col bg-[#1a4731]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-white/80"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
