"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewNoteButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreateNote() {
    setCreating(true);
    const res = await fetch("/api/notes", { method: "POST" });
    setCreating(false);
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    }
  }

  return (
    <button
      onClick={handleCreateNote}
      disabled={creating}
      aria-label="New note"
      className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
    >
      + New note
    </button>
  );
}
