"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUSES } from "@/lib/status";

type Member = { userId: string; name: string };
type WorkArea = { id: string; name: string };
type Task = { id: string; title: string; status: string };
type Comment = { id: string; body: string; createdAt: string | Date; authorName: string };

type Issue = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  reporterId: string;
  assigneeId: string | null;
  workAreaId: string | null;
  expectedStart: string | Date | null;
  expectedEnd: string | Date | null;
  percentDone: number | null;
  taskCount: number;
};

function toDateInputValue(value: string | Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function IssueDetail({
  issue,
  members,
  workAreas,
  tasks,
  comments,
}: {
  issue: Issue;
  members: Member[];
  workAreas: WorkArea[];
  tasks: Task[];
  comments: Comment[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this issue? Linked tasks will be kept but unlinked.")) return;
    await fetch(`/api/issues/${issue.id}`, { method: "DELETE" });
    router.push(`/projects/${issue.projectId}/cycles`);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentBody.trim();
    if (!text) return;
    setPosting(true);
    await fetch(`/api/issues/${issue.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setPosting(false);
    setCommentBody("");
    router.refresh();
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    setAddingTask(true);
    const res = await fetch(`/api/projects/${issue.projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed, issueId: issue.id }),
    });
    setAddingTask(false);
    if (res.ok) {
      setNewTaskTitle("");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== issue.title && patch({ title: title.trim() })}
          className="w-full rounded-md border border-transparent bg-transparent px-1 text-lg font-semibold outline-none hover:border-foreground/20 focus:border-foreground/60"
        />
        <button
          onClick={handleDelete}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Status
          <select
            value={issue.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Assignee
          <select
            value={issue.assigneeId ?? ""}
            onChange={(e) => patch({ assigneeId: e.target.value || null })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Reporter
          <select
            value={issue.reporterId}
            onChange={(e) => patch({ reporterId: e.target.value })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Work area
          <select
            value={issue.workAreaId ?? ""}
            onChange={(e) => patch({ workAreaId: e.target.value || null })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          >
            <option value="">None</option>
            {workAreas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Expected start
          <input
            type="date"
            defaultValue={toDateInputValue(issue.expectedStart)}
            onBlur={(e) => patch({ expectedStart: e.target.value || null })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Expected end
          <input
            type="date"
            defaultValue={toDateInputValue(issue.expectedEnd)}
            onBlur={(e) => patch({ expectedEnd: e.target.value || null })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== (issue.description ?? "") && patch({ description })}
        rows={4}
        placeholder="Description"
        className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60"
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Tasks</h2>
          {issue.percentDone !== null && (
            <span className="text-xs text-foreground/50">{issue.percentDone}% done</span>
          )}
        </div>
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/projects/${issue.projectId}/tasks/${task.id}`}
                className="flex items-center justify-between px-1 py-2 text-sm hover:bg-foreground/5"
              >
                <span>{task.title}</span>
                <span className="text-xs text-foreground/40">{task.status.replace("_", " ")}</span>
              </Link>
            </li>
          ))}
          {tasks.length === 0 && (
            <li className="px-1 py-2 text-xs text-foreground/40">No tasks yet.</li>
          )}
        </ul>
        <form onSubmit={handleAddTask} className="mt-2 flex gap-2">
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={addingTask}
            placeholder="New task title"
            className="w-full max-w-xs rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={addingTask}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm hover:bg-foreground/10 disabled:opacity-50"
          >
            Add task
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Discussion</h2>
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-md border border-foreground/10 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-foreground/50">
                <span className="font-medium text-foreground/70">{comment.authorName}</span>
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
            </li>
          ))}
          {comments.length === 0 && <p className="text-xs text-foreground/40">No comments yet.</p>}
        </ul>
        <form onSubmit={handleAddComment} className="mt-3 flex flex-col gap-2">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            disabled={posting}
            rows={2}
            placeholder="Add a comment"
            className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={posting}
            className="self-start rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            Comment
          </button>
        </form>
      </section>
    </div>
  );
}
