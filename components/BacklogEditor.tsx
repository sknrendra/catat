"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { Toolbar } from "@/components/editor/EditorToolbar";
import { clipboardTextSerializer } from "@/components/editor/clipboard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { BacklogStatusSelect } from "@/components/BacklogStatusSelect";
import { BACKLOG_LABELS } from "@/lib/db/schema";
import { LABEL_META, type BacklogLabel, type BacklogStatus } from "@/lib/backlog";

export function BacklogEditor({
  backlogId,
  projectId,
  projects,
  initialTitle,
  initialContent,
  initialStatus,
  initialLabel,
}: {
  backlogId: string;
  projectId: string;
  projects: { id: string; title: string }[];
  initialTitle: string;
  initialContent: JSONContent;
  initialStatus: BacklogStatus;
  initialLabel: BacklogLabel;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [label, setLabel] = useState<BacklogLabel>(initialLabel);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const savePatch = useDebouncedCallback(async (body: Record<string, unknown>) => {
    setSaveState("saving");
    await fetch(`/api/backlogs/${backlogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaveState("saved");
  }, 600);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Describe the problem…" })],
    content: initialContent,
    onUpdate: ({ editor }) => {
      savePatch({ content: editor.getJSON() });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[40vh] prose-li:my-0.5 [&_li_p]:my-0",
      },
      clipboardTextSerializer,
    },
  });

  function handleTitleChange(value: string) {
    setTitle(value);
    savePatch({ title: value });
  }

  async function handleLabelChange(value: BacklogLabel) {
    setLabel(value);
    await fetch(`/api/backlogs/${backlogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: value }),
    });
    router.refresh();
  }

  async function handleProjectChange(newProjectId: string) {
    setCurrentProjectId(newProjectId);
    await fetch(`/api/backlogs/${backlogId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: newProjectId }),
    });
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`/api/backlogs/${backlogId}`, { method: "DELETE" });
    router.push(`/projects/${currentProjectId}`);
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
            value={currentProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            aria-label="Project"
            className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/60"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id} className="bg-background text-foreground">
                {project.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground/40">
            {saveState === "saving" ? "Saving…" : "Saved"}
          </span>
          <ConfirmButton label="Delete" confirmLabel="Confirm?" onConfirm={handleDelete} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={label}
          onChange={(e) => handleLabelChange(e.target.value as BacklogLabel)}
          aria-label="Label"
          className={`rounded-md border-none px-2 py-1 text-xs font-medium outline-none ${LABEL_META[label].className}`}
        >
          {BACKLOG_LABELS.map((value) => (
            <option key={value} value={value} className="bg-background text-foreground">
              {LABEL_META[value].label}
            </option>
          ))}
        </select>
        <BacklogStatusSelect backlogId={backlogId} initialStatus={initialStatus} />
      </div>

      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
