"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUSES } from "@/lib/status";

type Item = {
  id: string;
  type: "issue" | "task";
  title: string;
  status: string;
  assigneeName: string | null;
  cycleId: string | null;
};

type Cycle = {
  id: string;
  name: string | null;
  startedAt: string | Date;
  endsAt: string | Date;
};

function isCurrent(cycle: Cycle) {
  const now = Date.now();
  return new Date(cycle.startedAt).getTime() <= now && now <= new Date(cycle.endsAt).getTime();
}

export function CyclesBoard({
  projectId,
  cycles,
  items,
}: {
  projectId: string;
  cycles: Cycle[];
  items: Item[];
}) {
  const router = useRouter();
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [durationDays, setDurationDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  async function handleCreateIssue(e: React.FormEvent) {
    e.preventDefault();
    const title = newIssueTitle.trim();
    if (!title) return;
    setCreatingIssue(true);
    const res = await fetch(`/api/projects/${projectId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setCreatingIssue(false);
    if (res.ok) {
      const issue = await res.json();
      setNewIssueTitle("");
      router.push(`/projects/${projectId}/issues/${issue.id}`);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    setCreatingTask(true);
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setCreatingTask(false);
    if (res.ok) {
      const task = await res.json();
      setNewTaskTitle("");
      router.push(`/projects/${projectId}/tasks/${task.id}`);
    }
  }

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch(`/api/projects/${projectId}/cycles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cycleName.trim() || null, startedAt, durationDays }),
    });
    setCreating(false);
    setCycleName("");
    setShowNewCycle(false);
    router.refresh();
  }

  async function handleDeleteCycle(cycleId: string) {
    if (!confirm("Delete this cycle? Its items move back to the Backlog.")) return;
    await fetch(`/api/cycles/${cycleId}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleMove(item: Item, targetCycleId: string) {
    const path = item.type === "issue" ? `/api/issues/${item.id}` : `/api/tasks/${item.id}`;
    await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId: targetCycleId === "backlog" ? null : targetCycleId }),
    });
    router.refresh();
  }

  async function handleStatusChange(item: Item, status: string) {
    const path = item.type === "issue" ? `/api/issues/${item.id}` : `/api/tasks/${item.id}`;
    await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  function renderItem(item: Item) {
    const href =
      item.type === "issue"
        ? `/projects/${projectId}/issues/${item.id}`
        : `/projects/${projectId}/tasks/${item.id}`;

    return (
      <li key={`${item.type}-${item.id}`} className="flex items-center gap-2 px-1 py-2 text-sm">
        <span className="w-10 shrink-0 text-xs uppercase text-foreground/40">{item.type}</span>
        <Link href={href} className="min-w-0 flex-1 truncate hover:underline">
          {item.title}
        </Link>
        {item.assigneeName && (
          <span className="shrink-0 text-xs text-foreground/40">{item.assigneeName}</span>
        )}
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(item, e.target.value)}
          className="shrink-0 rounded-md border border-foreground/20 bg-transparent px-1.5 py-1 text-xs text-foreground"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={item.cycleId ?? "backlog"}
          onChange={(e) => handleMove(item, e.target.value)}
          className="shrink-0 rounded-md border border-foreground/20 bg-transparent px-1.5 py-1 text-xs text-foreground"
        >
          <option value="backlog">Backlog</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || `Cycle · ${new Date(c.startedAt).toLocaleDateString()}`}
            </option>
          ))}
        </select>
      </li>
    );
  }

  const backlogItems = items.filter((i) => !i.cycleId);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap gap-4">
        <form onSubmit={handleCreateIssue} className="flex gap-2">
          <input
            value={newIssueTitle}
            onChange={(e) => setNewIssueTitle(e.target.value)}
            disabled={creatingIssue}
            placeholder="New issue title"
            className="w-56 rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={creatingIssue}
            className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            + Issue
          </button>
        </form>
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={creatingTask}
            placeholder="New task title"
            className="w-56 rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={creatingTask}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm hover:bg-foreground/10 disabled:opacity-50"
          >
            + Task
          </button>
        </form>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Backlog</h2>
        </div>
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {backlogItems.map(renderItem)}
          {backlogItems.length === 0 && (
            <li className="px-1 py-2 text-xs text-foreground/40">Backlog is empty.</li>
          )}
        </ul>
      </section>

      {cycles.map((cycle) => {
        const cycleItems = items.filter((i) => i.cycleId === cycle.id);
        const current = isCurrent(cycle);
        return (
          <section key={cycle.id}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                {cycle.name || "Cycle"}
                {current && (
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-normal">
                    current
                  </span>
                )}
                <span className="text-xs font-normal text-foreground/40">
                  {new Date(cycle.startedAt).toLocaleDateString()} –{" "}
                  {new Date(cycle.endsAt).toLocaleDateString()}
                </span>
              </h2>
              <button
                onClick={() => handleDeleteCycle(cycle.id)}
                className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
            <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
              {cycleItems.map(renderItem)}
              {cycleItems.length === 0 && (
                <li className="px-1 py-2 text-xs text-foreground/40">Nothing in this cycle yet.</li>
              )}
            </ul>
          </section>
        );
      })}

      <section>
        {showNewCycle ? (
          <form onSubmit={handleCreateCycle} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-foreground/50">
              Name (optional)
              <input
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground/50">
              Start
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/60"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground/50">
              Duration (days)
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-20 rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus:border-foreground/60"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
            >
              Start cycle
            </button>
            <button
              type="button"
              onClick={() => setShowNewCycle(false)}
              className="rounded-md px-3 py-1.5 text-sm text-foreground/50 hover:bg-foreground/10"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCycle(true)}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            + Start cycle
          </button>
        )}
      </section>
    </div>
  );
}
