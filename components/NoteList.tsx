"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  notebookId: string;
  title: string;
  updatedAt: string | Date;
};

export function NoteList({ notebookId, notes }: { notebookId: string; notes: Note[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreateNote() {
    setCreating(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId }),
    });
    setCreating(false);
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    }
  }

  return (
    <div>
      <button
        onClick={handleCreateNote}
        disabled={creating}
        className="mb-4 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
      >
        + New note
      </button>

      {notes.length === 0 ? (
        <p className="text-sm text-foreground/50">No notes in this notebook yet.</p>
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
