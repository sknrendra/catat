"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
};

type WorkArea = {
  id: string;
  name: string;
  color: string;
};

export function ProjectOverview({
  project,
  isOwner,
  members,
  stats,
  workAreas,
}: {
  project: Project;
  isOwner: boolean;
  members: Member[];
  stats: { issueCount: number; taskCount: number; doneTaskCount: number };
  workAreas: WorkArea[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [workAreaName, setWorkAreaName] = useState("");
  const [addingWorkArea, setAddingWorkArea] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, description: description.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteError(null);
    const res = await fetch(`/api/projects/${project.id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setInviting(false);
    if (res.ok) {
      setInviteEmail("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setInviteError(data.error ?? "Failed to invite");
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    await fetch(`/api/projects/${project.id}/invites?userId=${memberUserId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  async function handleAddWorkArea(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = workAreaName.trim();
    if (!trimmed) return;
    setAddingWorkArea(true);
    await fetch(`/api/projects/${project.id}/work-areas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setAddingWorkArea(false);
    setWorkAreaName("");
    router.refresh();
  }

  async function handleDeleteWorkArea(workAreaId: string) {
    await fetch(`/api/work-areas/${workAreaId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="w-full max-w-md rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
              placeholder="Project name"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={3}
              className="w-full max-w-md rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
              placeholder="Description"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-3 py-1.5 text-sm text-foreground/50 hover:bg-foreground/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="whitespace-pre-wrap text-sm text-foreground/70">
              {project.description || "No description yet."}
            </p>
            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="mt-2 rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-foreground/10 px-4 py-3">
          <div className="text-xs text-foreground/50">Issues</div>
          <div className="text-lg font-semibold">{stats.issueCount}</div>
        </div>
        <div className="rounded-md border border-foreground/10 px-4 py-3">
          <div className="text-xs text-foreground/50">Tasks</div>
          <div className="text-lg font-semibold">{stats.taskCount}</div>
        </div>
        <div className="rounded-md border border-foreground/10 px-4 py-3">
          <div className="text-xs text-foreground/50">Tasks done</div>
          <div className="text-lg font-semibold">
            {stats.doneTaskCount}/{stats.taskCount}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Members</h2>
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-1 py-2 text-sm">
              <span>
                {member.name}{" "}
                <span className="text-xs text-foreground/40">
                  {member.email} · {member.role}
                </span>
              </span>
              {isOwner && member.role !== "owner" && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {isOwner && (
          <form onSubmit={handleInvite} className="mt-3 flex items-center gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              placeholder="Invite by email"
              className="w-full max-w-xs rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={inviting}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm hover:bg-foreground/10 disabled:opacity-50"
            >
              Invite
            </button>
          </form>
        )}
        {inviteError && <p className="mt-2 text-xs text-red-500">{inviteError}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Work areas</h2>
        <p className="mb-2 text-xs text-foreground/50">
          Used to group issues on the Timeline (e.g. Frontend, Backend, Design).
        </p>
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {workAreas.map((workArea) => (
            <li key={workArea.id} className="flex items-center justify-between px-1 py-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: workArea.color }}
                />
                {workArea.name}
              </span>
              <button
                onClick={() => handleDeleteWorkArea(workArea.id)}
                className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
              >
                Remove
              </button>
            </li>
          ))}
          {workAreas.length === 0 && (
            <li className="px-1 py-2 text-xs text-foreground/40">No work areas yet.</li>
          )}
        </ul>
        <form onSubmit={handleAddWorkArea} className="mt-3 flex items-center gap-2">
          <input
            value={workAreaName}
            onChange={(e) => setWorkAreaName(e.target.value)}
            disabled={addingWorkArea}
            placeholder="New work area"
            className="w-full max-w-xs rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={addingWorkArea}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm hover:bg-foreground/10 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
