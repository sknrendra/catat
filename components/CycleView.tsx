"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CYCLE_STATUS_META, type CycleStatus } from "@/lib/cycle";

type Cycle = {
  id: string;
  projectId: string;
  description: string;
  status: CycleStatus;
  plannedStartDate: string | Date | null;
  plannedEndDate: string | Date | null;
  startedAt: string | Date | null;
  endedAt: string | Date | null;
};

export function CycleView({
  cycle,
  projectTitle,
}: {
  cycle: Cycle;
  projectTitle: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(cycle.description);
  const [draft, setDraft] = useState(cycle.description);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<CycleStatus>(cycle.status);
  const [transitioning, setTransitioning] = useState(false);

  function startEditing() {
    setDraft(description);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(description);
    setEditing(false);
  }

  async function handleSave() {
    const value = draft.trim();
    setSaving(true);
    await fetch(`/api/cycles/${cycle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: value }),
    });
    setSaving(false);
    setDescription(value);
    setEditing(false);
  }

  async function handleTransition(nextStatus: "active" | "completed") {
    setTransitioning(true);
    const res = await fetch(`/api/cycles/${cycle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setTransitioning(false);
    if (res.ok) {
      setStatus(nextStatus);
      router.refresh();
    }
  }

  return (
    <div className="mb-8 flex flex-col gap-3">
      <Link href={`/projects/${cycle.projectId}`} className="text-xs text-foreground/50 hover:underline">
        ← {projectTitle}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${CYCLE_STATUS_META[status].className}`}
        >
          {CYCLE_STATUS_META[status].label}
        </span>
        {cycle.plannedStartDate && (
          <span className="text-xs text-foreground/40">
            {new Date(cycle.plannedStartDate).toLocaleDateString()}
            {cycle.plannedEndDate && ` → ${new Date(cycle.plannedEndDate).toLocaleDateString()}`}
          </span>
        )}
        <span className="flex-1" />
        {status === "planned" && (
          <button
            onClick={() => handleTransition("active")}
            disabled={transitioning}
            className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            Start Cycle
          </button>
        )}
        {status === "active" && (
          <ConfirmButton
            label="End Cycle"
            confirmLabel="Confirm?"
            onConfirm={() => handleTransition("completed")}
          />
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
            placeholder="What is this cycle about?"
            rows={3}
            disabled={saving}
            className="w-full resize-none rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/60 disabled:opacity-50"
          />
          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium hover:bg-foreground/10 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startEditing}
          className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-foreground/5"
        >
          {description ? (
            <p className="whitespace-pre-wrap text-foreground/80">{description}</p>
          ) : (
            <p className="text-foreground/30">What is this cycle about?</p>
          )}
        </button>
      )}
    </div>
  );
}
