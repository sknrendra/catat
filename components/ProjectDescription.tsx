"use client";

import { useState } from "react";

export function ProjectDescription({
  projectId,
  initialDescription,
}: {
  projectId: string;
  initialDescription: string;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [draft, setDraft] = useState(initialDescription);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setDraft(description);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(description);
    setEditing(false);
  }

  async function handleSave() {
    const value = draft.trim();
    setSaving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: value }),
    });
    setSaving(false);
    setDescription(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mb-6">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          placeholder="What is this project about?"
          rows={3}
          disabled={saving}
          className="w-full resize-none rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/60 disabled:opacity-50"
        />
        <div className="mt-1 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md px-2 py-1 text-xs font-medium hover:bg-foreground/10 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className="mb-6 block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-foreground/5"
    >
      {description ? (
        <p className="whitespace-pre-wrap text-foreground/80">{description}</p>
      ) : (
        <p className="text-foreground/30">What is this project about?</p>
      )}
    </button>
  );
}
