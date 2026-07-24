"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  role: string;
  updatedAt: string | Date;
};

export function ProjectList({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setCreating(false);
    if (res.ok) {
      const project = await res.json();
      setName("");
      setShowForm(false);
      router.push(`/projects/${project.id}`);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
        >
          + New project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowForm(false);
            }}
            placeholder="Project name"
            disabled={creating}
            className="w-full max-w-sm rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
          />
        </form>
      )}

      {projects.length === 0 ? (
        <p className="text-sm text-foreground/50">No projects yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-1 py-3 hover:bg-foreground/5"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{project.name}</span>
                  {project.description && (
                    <span className="truncate text-xs text-foreground/50">
                      {project.description}
                    </span>
                  )}
                </span>
                <span className="ml-4 shrink-0 text-xs text-foreground/40">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
