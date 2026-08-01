import { BACKLOG_LABELS, BACKLOG_STATUSES } from "@/lib/db/schema";

export type BacklogStatus = (typeof BACKLOG_STATUSES)[number];
export type BacklogLabel = (typeof BACKLOG_LABELS)[number];

export const STATUS_META: Record<BacklogStatus, { label: string; className: string }> = {
  created: { label: "Created", className: "bg-foreground/10 text-foreground/60" },
  in_progress: { label: "In Progress", className: "bg-blue-500/10 text-blue-500" },
  implemented: { label: "Implemented", className: "bg-violet-500/10 text-violet-500" },
  on_testing: { label: "On Testing", className: "bg-amber-500/10 text-amber-500" },
  done: { label: "Done", className: "bg-green-500/10 text-green-500" },
};

export const LABEL_META: Record<BacklogLabel, { label: string; className: string }> = {
  task: { label: "Task", className: "bg-foreground/10 text-foreground/60" },
  issue: { label: "Issue", className: "bg-red-500/10 text-red-500" },
};
