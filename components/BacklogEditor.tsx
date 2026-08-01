"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { NewBacklogModal } from "@/components/NewBacklogModal";
import { BACKLOG_LABELS } from "@/lib/db/schema";
import { LABEL_META, STATUS_META, type BacklogLabel, type BacklogStatus } from "@/lib/backlog";

type ChildItem = {
  id: string;
  title: string;
  status: BacklogStatus;
  label: BacklogLabel;
};

export function BacklogEditor({
  backlogId,
  projectId,
  projects,
  initialTitle,
  initialContent,
  initialStatus,
  initialLabel,
  isChild,
  childItems,
}: {
  backlogId: string;
  projectId: string;
  projects: { id: string; title: string }[];
  initialTitle: string;
  initialContent: JSONContent;
  initialStatus: BacklogStatus;
  initialLabel: BacklogLabel;
  isChild: boolean;
  childItems: ChildItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [label, setLabel] = useState<BacklogLabel>(initialLabel);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [editingDescription, setEditingDescription] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

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
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Describe the problem…", showOnlyWhenEditable: false }),
    ],
    content: initialContent,
    editable: editingDescription,
    onUpdate: ({ editor }) => {
      savePatch({ content: editor.getJSON() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none focus:outline-none prose-li:my-0.5 [&_li_p]:my-0",
      },
      clipboardTextSerializer,
    },
  });

  useEffect(() => {
    editor?.setEditable(editingDescription);
  }, [editor, editingDescription]);

  useEffect(() => {
    if (!editingDescription && !expanded && descriptionRef.current) {
      setTruncated(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight + 1);
    }
  }, [editingDescription, expanded, editor]);

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Description
          </span>
          {editingDescription && (
            <button
              onClick={() => setEditingDescription(false)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs text-foreground/60 hover:bg-foreground/10"
            >
              Done
            </button>
          )}
        </div>

        {editingDescription && <Toolbar editor={editor} />}

        {!editingDescription && editor.isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-foreground/10 px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-foreground/50">No description</p>
            <button
              onClick={() => setEditingDescription(true)}
              className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Add description
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <div
                ref={descriptionRef}
                role="button"
                tabIndex={editingDescription ? -1 : 0}
                onClick={() => {
                  if (!editingDescription) setEditingDescription(true);
                }}
                onKeyDown={(e) => {
                  if (!editingDescription && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setEditingDescription(true);
                  }
                }}
                className={`rounded-md ${editingDescription ? "" : "cursor-pointer"} ${
                  !editingDescription && !expanded ? "max-h-48 overflow-hidden" : ""
                }`}
              >
                <EditorContent editor={editor} />
              </div>
              {!editingDescription && !expanded && truncated && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
              )}
            </div>

            {!editingDescription && truncated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => !prev);
                }}
                className="cursor-pointer self-start text-xs font-medium text-foreground/50 hover:text-foreground"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}
      </div>

      {!isChild && (
        <div className="mt-2 flex flex-col gap-2 border-t border-foreground/10 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              Child issues
            </h2>
            <button
              onClick={() => setShowChildModal(true)}
              className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-foreground/60 hover:bg-foreground/10"
            >
              + New Work
            </button>
          </div>

          {childItems.length === 0 ? (
            <p className="text-sm text-foreground/40">No child work items yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/10">
              {childItems.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/backlogs/${child.id}`}
                    className="flex items-center justify-between gap-4 px-1 py-3 hover:bg-foreground/5"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${LABEL_META[child.label].className}`}
                      >
                        {LABEL_META[child.label].label}
                      </span>
                      <span className="truncate text-sm">{child.title || "Untitled"}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${STATUS_META[child.status].className}`}
                    >
                      {STATUS_META[child.status].label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {showChildModal && (
            <NewBacklogModal
              projectId={currentProjectId}
              parentId={backlogId}
              onClose={() => setShowChildModal(false)}
              onCreated={() => {
                setShowChildModal(false);
                router.refresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
