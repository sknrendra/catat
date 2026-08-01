"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
};

export function SidebarProjectsSection({
  projects,
  onNavigate,
}: {
  projects: Project[];
  onNavigate: () => void;
}) {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  const [creating, setCreating] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const title = newProjectTitle.trim();
    if (!title) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setCreating(false);
    if (res.ok) {
      const project = await res.json();
      setNewProjectTitle("");
      setShowNewProjectInput(false);
      onNavigate();
      router.push(`/projects/${project.id}`);
      router.refresh();
    }
  }

  function startRename(project: Project) {
    setOpenMenuId(null);
    setRenamingId(project.id);
    setRenameValue(project.title);
  }

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const title = renameValue.trim();
    if (!title || !renamingId) {
      setRenamingId(null);
      return;
    }
    const id = renamingId;
    setRenamingId(null);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    router.refresh();
  }

  function startDelete(project: Project) {
    setOpenMenuId(null);
    setConfirmingDeleteId(project.id);
  }

  async function handleDeleteProject(project: Project) {
    setConfirmingDeleteId(null);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (params?.projectId === project.id) router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="mb-2 mt-4 flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          Projects
        </span>
        <button
          onClick={() => setShowNewProjectInput((prev) => !prev)}
          aria-label="New project"
          className="rounded-md px-1.5 text-sm hover:bg-foreground/10"
        >
          +
        </button>
      </div>

      {showNewProjectInput && (
        <form onSubmit={handleCreateProject} className="mb-2 px-1">
          <input
            autoFocus
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowNewProjectInput(false);
            }}
            placeholder="Project title"
            disabled={creating}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
        </form>
      )}

      <ul className="flex flex-col gap-0.5">
        {projects.map((project) => {
          if (renamingId === project.id) {
            return (
              <li key={project.id}>
                <form onSubmit={submitRename} className="px-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60"
                  />
                </form>
              </li>
            );
          }

          if (confirmingDeleteId === project.id) {
            return (
              <li
                key={project.id}
                className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs"
              >
                <span className="truncate text-foreground/60">Delete “{project.title}”?</span>
                <span className="flex shrink-0 gap-1">
                  <button
                    onClick={() => handleDeleteProject(project)}
                    className="rounded-md px-2 py-1 text-red-500 hover:bg-red-500/10"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(null)}
                    className="rounded-md px-2 py-1 text-foreground/50 hover:bg-foreground/10"
                  >
                    Cancel
                  </button>
                </span>
              </li>
            );
          }

          return (
            <li key={project.id} className="group relative flex items-center">
              <Link
                href={`/projects/${project.id}`}
                onClick={onNavigate}
                className={`block flex-1 truncate rounded-md px-2 py-1.5 text-sm hover:bg-foreground/10 ${
                  params?.projectId === project.id ? "bg-foreground/10 font-medium" : ""
                }`}
              >
                {project.title}
              </Link>
              <button
                onClick={() => setOpenMenuId((prev) => (prev === project.id ? null : project.id))}
                aria-label={`Options for ${project.title}`}
                className={`shrink-0 rounded-md px-1.5 py-1 text-xs text-foreground/40 hover:bg-foreground/10 hover:text-foreground ${
                  openMenuId === project.id ? "" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                ⋯
              </button>

              {openMenuId === project.id && (
                <>
                  <button
                    aria-hidden
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute top-full right-0 z-20 mt-1 flex w-32 flex-col overflow-hidden rounded-md border border-foreground/20 bg-background py-1 shadow-lg">
                    <button
                      onClick={() => startRename(project)}
                      className="px-3 py-1.5 text-left text-sm hover:bg-foreground/10"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => startDelete(project)}
                      className="px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
        {projects.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-foreground/50">No projects yet</li>
        )}
      </ul>
    </>
  );
}
