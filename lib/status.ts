export const STATUSES = ["todo", "discussing", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export function isValidStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export const RECURRENCES = ["none", "daily", "weekly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export function isValidRecurrence(value: unknown): value is Recurrence {
  return typeof value === "string" && (RECURRENCES as readonly string[]).includes(value);
}
