"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BACKLOG_STATUSES } from "@/lib/db/schema";
import { STATUS_META, type BacklogStatus } from "@/lib/backlog";

export function BacklogStatusSelect({
  backlogId,
  initialStatus,
}: {
  backlogId: string;
  initialStatus: BacklogStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<BacklogStatus>(initialStatus);

  async function handleStatusChange(value: BacklogStatus) {
    setStatus(value);
    await fetch(`/api/backlogs/${backlogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value as BacklogStatus)}
      aria-label="Status"
      className={`rounded-md border-none px-2 py-1 text-xs font-medium outline-none ${STATUS_META[status].className}`}
    >
      {BACKLOG_STATUSES.map((value) => (
        <option
          key={value}
          value={value}
          disabled={value === "created"}
          className="bg-background text-foreground"
        >
          {STATUS_META[value].label}
        </option>
      ))}
    </select>
  );
}
