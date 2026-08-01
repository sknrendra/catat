"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "@/components/editor/EditorToolbar";
import { clipboardTextSerializer } from "@/components/editor/clipboard";
import { BACKLOG_LABELS } from "@/lib/db/schema";
import { LABEL_META, type BacklogLabel } from "@/lib/backlog";

export function NewBacklogModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState<BacklogLabel>("task");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Describe the problem…" })],
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[20vh] prose-li:my-0.5 [&_li_p]:my-0",
      },
      clipboardTextSerializer,
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setSubmitting(true);
    const res = await fetch("/api/backlogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: title.trim(),
        label,
        content: editor.getJSON(),
      }),
    });
    setSubmitting(false);
    if (res.ok) onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-hidden
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-md border border-foreground/20 bg-background p-5 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">New Work</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm text-foreground/50 hover:bg-foreground/10"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-foreground/30"
        />

        <select
          value={label}
          onChange={(e) => setLabel(e.target.value as BacklogLabel)}
          aria-label="Label"
          className={`self-start rounded-md border-none px-2 py-1 text-xs font-medium outline-none ${LABEL_META[label].className}`}
        >
          {BACKLOG_LABELS.map((value) => (
            <option key={value} value={value} className="bg-background text-foreground">
              {LABEL_META[value].label}
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3">
          {editor && <Toolbar editor={editor} />}
          <EditorContent editor={editor} />
        </div>

        <div className="flex justify-end gap-2 border-t border-foreground/10 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-foreground/60 hover:bg-foreground/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
