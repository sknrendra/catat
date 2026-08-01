"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { Toolbar } from "@/components/editor/EditorToolbar";
import { clipboardTextSerializer } from "@/components/editor/clipboard";
import { ConfirmButton } from "@/components/ConfirmButton";

export function Editor({
  noteId,
  notebookId,
  notebooks,
  initialTitle,
  initialContent,
}: {
  noteId: string;
  notebookId: string;
  notebooks: { id: string; name: string }[];
  initialTitle: string;
  initialContent: JSONContent;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [currentNotebookId, setCurrentNotebookId] = useState(notebookId);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savePatch = useDebouncedCallback(async (body: Record<string, unknown>) => {
    setSaveState("saving");
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaveState("saved");
  }, 600);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      savePatch({ content: editor.getJSON() });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[50vh] prose-li:my-0.5 [&_li_p]:my-0",
      },
      clipboardTextSerializer,
    },
  });

  function handleTitleChange(value: string) {
    setTitle(value);
    savePatch({ title: value });
  }

  async function handleNotebookChange(newNotebookId: string) {
    setCurrentNotebookId(newNotebookId);
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId: newNotebookId }),
    });
    router.refresh();
  }

  async function handleImageUpload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/notes/${noteId}/attachments`, {
      method: "POST",
      body: form,
    });
    if (!res.ok || !editor) return;
    const attachment = await res.json();
    editor.chain().focus().setImage({ src: attachment.url, alt: attachment.fileName }).run();
  }

  async function handleDelete() {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push(`/notebooks/${currentNotebookId}`);
    router.refresh();
  }

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-foreground/30"
        />
        <div className="flex shrink-0 items-center gap-3 md:pt-2">
          <select
            value={currentNotebookId}
            onChange={(e) => handleNotebookChange(e.target.value)}
            aria-label="Notebook"
            className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/60"
          >
            {notebooks.map((notebook) => (
              <option key={notebook.id} value={notebook.id} className="bg-background text-foreground">
                {notebook.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground/40">
            {saveState === "saving" ? "Saving…" : "Saved"}
          </span>
          <ConfirmButton label="Delete" confirmLabel="Confirm?" onConfirm={handleDelete} />
        </div>
      </div>

      <Toolbar editor={editor} onRequestImageUpload={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
