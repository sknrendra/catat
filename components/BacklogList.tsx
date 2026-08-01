"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LABEL_META, STATUS_META, type BacklogLabel, type BacklogStatus } from "@/lib/backlog";
import { NewBacklogModal } from "@/components/NewBacklogModal";

type Backlog = {
  id: string;
  projectId: string;
  title: string;
  status: BacklogStatus;
  label: BacklogLabel;
  updatedAt: string | Date;
};

const FILTERS = ["open", "done", "all"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABELS: Record<Filter, string> = { open: "Open", done: "Done", all: "All" };

export function BacklogList({ projectId, backlogs }: { projectId: string; backlogs: Backlog[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  const visibleBacklogs = backlogs.filter((backlog) => {
    if (filter === "done") return backlog.status === "done";
    if (filter === "open") return backlog.status !== "done";
    return true;
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          Backlog
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-foreground/60 hover:bg-foreground/10"
        >
          + New Work
        </button>
      </div>

      <div className="mb-3 flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${
              filter === f
                ? "bg-foreground text-background"
                : "text-foreground/50 hover:bg-foreground/10"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {showModal && (
        <NewBacklogModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {backlogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-foreground/10 px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-foreground/50">No work items in this project yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            + New Work
          </button>
        </div>
      ) : visibleBacklogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-foreground/10 px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-foreground/50">No {FILTER_LABELS[filter].toLowerCase()} work items.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {visibleBacklogs.map((backlog) => (
            <li key={backlog.id}>
              <Link
                href={`/backlogs/${backlog.id}`}
                className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-foreground/5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${LABEL_META[backlog.label].className}`}
                  >
                    {LABEL_META[backlog.label].label}
                  </span>
                  <span className="truncate text-sm">{backlog.title || "Untitled"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-foreground/40">
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-medium ${STATUS_META[backlog.status].className}`}
                  >
                    {STATUS_META[backlog.status].label}
                  </span>
                  <span>{new Date(backlog.updatedAt).toLocaleDateString()}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
