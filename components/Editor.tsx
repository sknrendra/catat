"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function serializeListForClipboard(list: ProseMirrorNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  let index = typeof list.attrs.start === "number" ? list.attrs.start : 1;
  let out = "";

  list.forEach((listItem) => {
    const marker = list.type.name === "orderedList" ? `${index}.` : "-";
    let itemText = "";
    let nested = "";

    listItem.forEach((child) => {
      if (child.type.name === "bulletList" || child.type.name === "orderedList") {
        nested += serializeListForClipboard(child, depth + 1);
      } else {
        itemText += child.textContent;
      }
    });

    out += `${indent}${marker} ${itemText}\n${nested}`;
    index++;
  });

  return out;
}

function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

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
      clipboardTextSerializer: (slice) => {
        let text = "";
        slice.content.forEach((node) => {
          if (node.type.name === "bulletList" || node.type.name === "orderedList") {
            text += serializeListForClipboard(node);
          } else {
            text += `${node.textContent}\n`;
          }
        });
        return text.trim();
      },
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
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-foreground/30"
        />
        <div className="flex shrink-0 items-center gap-3 pt-2">
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

function Toolbar({
  editor,
  onRequestImageUpload,
}: {
  editor: TiptapEditor;
  onRequestImageUpload: () => void;
}) {
  const blockValue = HEADING_LEVELS.find((level) => editor.isActive("heading", { level }))
    ? String(HEADING_LEVELS.find((level) => editor.isActive("heading", { level })))
    : "paragraph";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-3">
      <select
        value={blockValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .setHeading({ level: Number(value) as (typeof HEADING_LEVELS)[number] })
              .run();
          }
        }}
        className="mr-2 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm text-foreground"
      >
        <option value="paragraph" className="bg-background text-foreground">
          Paragraph
        </option>
        {HEADING_LEVELS.map((level) => (
          <option key={level} value={level} className="bg-background text-foreground">
            Heading {level}
          </option>
        ))}
      </select>

      <ToolbarButton
        active={editor.isActive("bold")}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        label="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1≡
      </ToolbarButton>

      <Divider />

      <ToolbarButton label="Insert image" onClick={onRequestImageUpload}>
        🖼
      </ToolbarButton>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-foreground/10" />;
}

function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1 text-xs">
        <button
          onClick={onConfirm}
          className="rounded-md px-2 py-1 text-red-500 hover:bg-red-500/10"
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-1 text-foreground/50 hover:bg-foreground/10"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
    >
      {label}
    </button>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-foreground/10 ${
        active ? "bg-foreground/10 font-semibold" : ""
      }`}
    >
      {children}
    </button>
  );
}
