"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, LayoutDashboard, ClipboardCheck, TrendingUp, Info, LogOut, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { APP_VERSION, RELATIONSHIP_MANAGER } from "@/data/presentation";

/**
 * APP SHELL — persistent left sidebar for the authenticated app.
 * Wraps every /(app) route via the route-group layout; the public landing at
 * "/" renders WITHOUT it. Presentation only — no data, no scoring.
 */

interface NavItem { href: string; label: string; icon: LucideIcon; isActive: (path: string) => boolean; }

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, isActive: p => p.startsWith("/dashboard") || p.startsWith("/business") },
  { href: "/assess", label: "Assess Business", icon: ClipboardCheck, isActive: p => p.startsWith("/assess") },
  { href: "/simulator/climber", label: "Simulator (What-If)", icon: TrendingUp, isActive: p => p.startsWith("/simulator") },
  { href: "/", label: "About Aegis", icon: Info, isActive: () => false },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#F8FAF9]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#123A2E] text-[#A8C3B9]">
        {/* brand */}
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <Shield className="h-5 w-5 text-white" strokeWidth={1.75} />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight text-white">AEGIS</p>
            <p className="text-xs text-[#8FB3A7]">MSME Credit Intelligence</p>
          </div>
        </div>

        {/* nav */}
        <nav className="mt-2 space-y-1 px-3">
          {NAV.map(item => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active ? "bg-[#1F5E4A] text-white" : "text-[#A8C3B9] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* footer */}
        <div className="mt-auto px-6 pb-5 pt-6">
          <div className="flex items-center gap-2 text-white">
            <Shield className="h-4 w-4" strokeWidth={1.75} />
            <p className="text-sm font-semibold">Deterministic Engine</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#8FB3A7]">
            100-point Core · Explainable Decisions
          </p>
          <p className="mt-3 text-xs text-[#6E948A]">Version {APP_VERSION}</p>
          <p className="text-xs text-[#6E948A]">© 2025 Aegis by IDBI Innovate</p>

          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1F5E4A] text-xs font-semibold text-white">RM</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-white">{RELATIONSHIP_MANAGER.name}</p>
              <p className="truncate text-xs text-[#8FB3A7]">{RELATIONSHIP_MANAGER.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#8FB3A7]" strokeWidth={1.75} />
          </div>

          <button
            type="button"
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#A8C3B9] transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
