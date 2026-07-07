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
 * Colours: approve #1F5E4A · conditional/path #B7791F · refer/flag #B42318.
 */
export interface VerdictVisual {
  icon: LucideIcon;
  color: string;      // foreground / icon colour
  tint: string;       // soft background wash
  label: string;      // short chip label
}

export const VERDICT_VISUAL: Record<Recommendation, VerdictVisual> = {
  APPROVE:           { icon: CheckCircle2,  color: "#1F5E4A", tint: "#ECF3F0", label: "Approve" },
  CONDITIONAL:       { icon: CircleAlert,   color: "#B7791F", tint: "#FBF3E5", label: "Conditional" },
  DECLINE_WITH_PATH: { icon: TrendingUp,    color: "#B7791F", tint: "#FBF3E5", label: "Path to yes" },
  REFER_OR_DECLINE:  { icon: AlertTriangle, color: "#B42318", tint: "#FBEBE9", label: "Refer / Decline" },
};
