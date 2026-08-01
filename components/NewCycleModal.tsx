"use client";

import { useEffect, useState } from "react";
import { LABEL_META, STATUS_META, type BacklogLabel, type BacklogStatus } from "@/lib/backlog";

type Backlog = {
  id: string;
  title: string;
  status: BacklogStatus;
  label: BacklogLabel;
};

export function NewCycleModal({
  projectId,
  backlogs,
  onClose,
  onCreated,
}: {
  projectId: string;
  backlogs: Backlog[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [description, setDescription] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function toggleId(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        description: description.trim(),
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
        backlogIds: selectedIds,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      onCreated();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-md border border-foreground/20 bg-background p-5 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">New Cycle</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm text-foreground/50 hover:bg-foreground/10"
          >
            ✕
          </button>
        </div>

        <textarea
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this cycle about?"
          rows={3}
          className="w-full resize-none rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/60"
        />

        <div className="flex items-center gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs text-foreground/60">
            Start date
            <input
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
              className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-foreground/60">
            End date
            <input
              type="date"
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
              className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60"
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Work items
          </span>
          {backlogs.length === 0 ? (
            <p className="text-sm text-foreground/50">No work items in this project yet.</p>
          ) : (
            <ul className="flex max-h-56 flex-col divide-y divide-foreground/10 overflow-y-auto">
              {backlogs.map((backlog) => (
                <li key={backlog.id}>
                  <label className="flex items-center gap-2 px-1 py-2 text-sm hover:bg-foreground/5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(backlog.id)}
                      onChange={() => toggleId(backlog.id)}
                    />
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${LABEL_META[backlog.label].className}`}
                    >
                      {LABEL_META[backlog.label].label}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{backlog.title || "Untitled"}</span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${STATUS_META[backlog.status].className}`}
                    >
                      {STATUS_META[backlog.status].label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-foreground/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/60 hover:bg-foreground/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
