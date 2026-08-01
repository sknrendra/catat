import { CYCLE_STATUSES } from "@/lib/db/schema";

export type CycleStatus = (typeof CYCLE_STATUSES)[number];

export const CYCLE_STATUS_META: Record<CycleStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-foreground/10 text-foreground/60" },
  active: { label: "Active", className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-500" },
};
