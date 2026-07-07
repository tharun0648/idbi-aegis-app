import AppShell from "@/components/shell/AppShell";

/**
 * Layout for the authenticated app (route group). Wraps every page under
 * /(app) — dashboard, assess, simulator, business — in the persistent shell.
 * The public landing at "/" is outside this group and renders shell-free.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
