"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  title: string;
  updatedAt: string | Date;
};

export function ProjectNotes({ projectId, notes }: { projectId: string; notes: Note[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreateNote() {
    setCreating(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    setCreating(false);
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/50">Notes</h2>
        <button
          onClick={handleCreateNote}
          disabled={creating}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-foreground/60 hover:bg-foreground/10 disabled:opacity-50"
        >
          + New note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="px-1 text-sm text-foreground/50">No notes in this project yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex items-center justify-between px-1 py-3 hover:bg-foreground/5"
              >
                <span className="truncate text-sm">{note.title || "Untitled"}</span>
                <span className="ml-4 shrink-0 text-xs text-foreground/40">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
