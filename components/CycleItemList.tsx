"use client";

import Link from "next/link";
import { LABEL_META, type BacklogLabel, type BacklogStatus } from "@/lib/backlog";
import { BacklogStatusSelect } from "@/components/BacklogStatusSelect";

type Backlog = {
  id: string;
  title: string;
  status: BacklogStatus;
  label: BacklogLabel;
  updatedAt: string | Date;
};

export function CycleItemList({ items }: { items: Backlog[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-foreground/50">No work items in this cycle yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-foreground/5">
          <Link href={`/backlogs/${item.id}`} className="flex min-w-0 items-center gap-2">
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${LABEL_META[item.label].className}`}
            >
              {LABEL_META[item.label].label}
            </span>
            <span className="truncate text-sm">{item.title || "Untitled"}</span>
          </Link>
          <span className="flex shrink-0 items-center gap-3 text-xs text-foreground/40">
            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
            <BacklogStatusSelect backlogId={item.id} initialStatus={item.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}
