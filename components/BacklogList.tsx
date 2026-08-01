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

export function BacklogList({ projectId, backlogs }: { projectId: string; backlogs: Backlog[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="mb-4 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
      >
        + New Work
      </button>

      {showModal && (
        <NewBacklogModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {backlogs.length === 0 ? (
        <p className="text-sm text-foreground/50">No work items in this project yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {backlogs.map((backlog) => (
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
