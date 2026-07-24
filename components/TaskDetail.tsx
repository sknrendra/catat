"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RECURRENCES, STATUSES } from "@/lib/status";

type Member = { userId: string; name: string };
type Comment = { id: string; body: string; createdAt: string | Date; authorName: string };

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  reporterId: string;
  assigneeId: string | null;
  effortHours: number | null;
  recurrence: string;
  issueId: string | null;
};

export function TaskDetail({
  task,
  members,
  parentIssue,
  comments,
}: {
  task: Task;
  members: Member[];
  parentIssue: { id: string; title: string } | null;
  comments: Comment[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    router.push(`/projects/${task.projectId}/cycles`);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentBody.trim();
    if (!text) return;
    setPosting(true);
    await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setPosting(false);
    setCommentBody("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {parentIssue && (
        <Link
          href={`/projects/${task.projectId}/issues/${parentIssue.id}`}
          className="text-xs text-foreground/50 hover:text-foreground"
        >
          ← {parentIssue.title}
        </Link>
      )}

      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
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
            value={task.status}
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
            value={task.assigneeId ?? ""}
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
            value={task.reporterId}
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
          Effort (hours)
          <input
            type="number"
            min={0}
            step={0.5}
            defaultValue={task.effortHours ?? ""}
            onBlur={(e) =>
              patch({ effortHours: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground/50">
          Recurrence
          <select
            value={task.recurrence}
            onChange={(e) => patch({ recurrence: e.target.value })}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm text-foreground"
          >
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== (task.description ?? "") && patch({ description })}
        rows={4}
        placeholder="Description"
        className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60"
      />

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
