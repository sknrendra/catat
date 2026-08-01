"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CYCLE_STATUS_META, type CycleStatus } from "@/lib/cycle";
import type { BacklogLabel, BacklogStatus } from "@/lib/backlog";
import { NewCycleModal } from "@/components/NewCycleModal";

type Cycle = {
  id: string;
  description: string;
  status: CycleStatus;
  plannedStartDate: string | Date | null;
  plannedEndDate: string | Date | null;
};

type Backlog = {
  id: string;
  title: string;
  status: BacklogStatus;
  label: BacklogLabel;
};

export function CurrentCycleSection({
  projectId,
  cycle,
  backlogs,
}: {
  projectId: string;
  cycle: Cycle | null;
  backlogs: Backlog[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <div className="mb-8">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
        Cycle
      </h2>
      {!cycle ? (
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
        >
          + New Cycle
        </button>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          <li>
            <Link
              href={`/cycles/${cycle.id}`}
              className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-foreground/5"
            >
              <span className="min-w-0 truncate text-sm">
                {cycle.description || "No description"}
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-foreground/40">
                {cycle.plannedStartDate && (
                  <span>{new Date(cycle.plannedStartDate).toLocaleDateString()}</span>
                )}
                {cycle.plannedEndDate && (
                  <span>→ {new Date(cycle.plannedEndDate).toLocaleDateString()}</span>
                )}
                <span
                  className={`rounded-md px-1.5 py-0.5 font-medium ${CYCLE_STATUS_META[cycle.status].className}`}
                >
                  {CYCLE_STATUS_META[cycle.status].label}
                </span>
              </span>
            </Link>
          </li>
        </ul>
      )}

      {showModal && (
        <NewCycleModal
          projectId={projectId}
          backlogs={backlogs}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
