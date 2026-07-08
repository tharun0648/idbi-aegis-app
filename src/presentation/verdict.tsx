import { CheckCircle2, TrendingUp, CircleAlert, AlertTriangle, type LucideIcon } from "lucide-react";
import type { Recommendation } from "@/engine/aegis-core";

/**
 * VERDICT VISUAL LANGUAGE — presentation only.
 * ------------------------------------------------------------------
 * Maps the engine's AEGIS recommendation (never the bureau verdict) to a lucide
 * outline icon and a Design-Spec-v1.0 colour. This is the single source of truth
 * for how a decision looks, so the same green/amber/terracotta reads everywhere.
 * It does not change the decision — it only dresses it.
 *
 * Colours: approve #15803d · conditional/path #ea580c · refer/flag #dc2626.
 */
export interface VerdictVisual {
  icon: LucideIcon;
  color: string;      // foreground / icon colour
  tint: string;       // soft background wash
  label: string;      // short chip label
}

export const VERDICT_VISUAL: Record<Recommendation, VerdictVisual> = {
  APPROVE:           { icon: CheckCircle2,  color: "#15803d", tint: "#f0fdf4",   label: "Approve" },
  CONDITIONAL:       { icon: CircleAlert,   color: "#ea580c", tint: "#ea580c1a", label: "Conditional" },
  DECLINE_WITH_PATH: { icon: TrendingUp,    color: "#ea580c", tint: "#ea580c1a", label: "Path to yes" },
  REFER_OR_DECLINE:  { icon: AlertTriangle, color: "#dc2626", tint: "#fef2f2",   label: "Refer / Decline" },
};
