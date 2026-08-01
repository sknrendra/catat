"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SidebarProjectsSection } from "@/components/SidebarProjectsSection";

type Notebook = {
  id: string;
  name: string;
};

type Note = {
  id: string;
  notebookId: string;
  title: string;
};

type Project = {
  id: string;
  title: string;
};

export function Sidebar({
  notebooks,
  notes,
  projects,
  userName,
}: {
  notebooks: Notebook[];
  notes: Note[];
  projects: Project[];
  userName: string;
}) {
  const router = useRouter();
  const params = useParams<{ notebookId?: string; noteId?: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewNotebookInput, setShowNewNotebookInput] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [newNoteForId, setNewNoteForId] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  function toggleExpanded(notebookId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(notebookId)) next.delete(notebookId);
      else next.add(notebookId);
      return next;
    });
  }

  useEffect(() => {
    const stored = localStorage.getItem("catat:sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fold state only exists client-side
    if (stored) setCollapsed(stored === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("catat:sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  async function handleCreateNotebook(e: React.FormEvent) {
    e.preventDefault();
    const name = newNotebookName.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (res.ok) {
      const notebook = await res.json();
      setNewNotebookName("");
      setShowNewNotebookInput(false);
      router.push(`/notebooks/${notebook.id}`);
      router.refresh();
    }
  }

  async function handleDrop(targetId: string) {
    setDragOverId(null);
    const sourceId = draggedId;
    setDraggedId(null);
    if (!sourceId || sourceId === targetId) return;

    const reordered = notebooks.map((n) => n.id).filter((id) => id !== sourceId);
    const targetIndex = reordered.indexOf(targetId);
    reordered.splice(targetIndex, 0, sourceId);

    await fetch("/api/notebooks/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered }),
    });
    router.refresh();
  }

  function startRename(notebook: Notebook) {
    setOpenMenuId(null);
    setRenamingId(notebook.id);
    setRenameValue(notebook.name);
  }

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name || !renamingId) {
      setRenamingId(null);
      return;
    }
    const id = renamingId;
    setRenamingId(null);
    await fetch(`/api/notebooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  function startDelete(notebook: Notebook) {
    setOpenMenuId(null);
    setConfirmingDeleteId(notebook.id);
  }

  async function handleDeleteNotebook(notebook: Notebook) {
    setConfirmingDeleteId(null);
    await fetch(`/api/notebooks/${notebook.id}`, { method: "DELETE" });
    if (params?.notebookId === notebook.id) router.push("/");
    router.refresh();
  }

  function startNewNote(notebook: Notebook) {
    setOpenMenuId(null);
    setNewNoteTitle("");
    setNewNoteForId(notebook.id);
    setExpandedIds((prev) => new Set(prev).add(notebook.id));
  }

  async function submitNewNote(e: React.FormEvent, notebookId: string) {
    e.preventDefault();
    const title = newNoteTitle.trim();
    if (!title) return;
    setCreatingNote(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId, title }),
    });
    setCreatingNote(false);
    if (res.ok) {
      const note = await res.json();
      setNewNoteForId(null);
      router.push(`/notes/${note.id}`);
      router.refresh();
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  }

  function renderBody({
    onNavigate,
    headerAction,
  }: {
    onNavigate: () => void;
    headerAction: "collapse" | "close";
  }) {
    return (
      <>
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight" onClick={onNavigate}>
            Catat
          </Link>
          {headerAction === "collapse" ? (
            <button
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="rounded-md px-2 py-1 text-sm hover:bg-foreground/10"
            >
              «
            </button>
          ) : (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="rounded-md px-2 py-1 text-sm hover:bg-foreground/10"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <input
            type="search"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-foreground/60"
          />
        </form>

        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Notebooks
          </span>
          <button
            onClick={() => setShowNewNotebookInput((prev) => !prev)}
            aria-label="New notebook"
            className="rounded-md px-1.5 text-sm hover:bg-foreground/10"
          >
            +
          </button>
        </div>

        {showNewNotebookInput && (
          <form onSubmit={handleCreateNotebook} className="mb-2 px-1">
            <input
              autoFocus
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowNewNotebookInput(false);
              }}
              placeholder="Notebook name"
              disabled={creating}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60 disabled:opacity-50"
            />
          </form>
        )}

        <nav className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {notebooks.map((notebook) => {
              if (renamingId === notebook.id) {
                return (
                  <li key={notebook.id}>
                    <form onSubmit={submitRename} className="px-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm outline-none focus:border-foreground/60"
                      />
                    </form>
                  </li>
                );
              }

              if (confirmingDeleteId === notebook.id) {
                return (
                  <li
                    key={notebook.id}
                    className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs"
                  >
                    <span className="truncate text-foreground/60">
                      Delete “{notebook.name}”?
                    </span>
                    <span className="flex shrink-0 gap-1">
                      <button
                        onClick={() => handleDeleteNotebook(notebook)}
                        className="rounded-md px-2 py-1 text-red-500 hover:bg-red-500/10"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="rounded-md px-2 py-1 text-foreground/50 hover:bg-foreground/10"
                      >
                        Cancel
                      </button>
                    </span>
                  </li>
                );
              }

              const expanded = expandedIds.has(notebook.id);
              const notebookNotes = notes.filter((note) => note.notebookId === notebook.id);

              return (
                <li
                  key={notebook.id}
                  draggable
                  onDragStart={() => setDraggedId(notebook.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverId !== notebook.id) setDragOverId(notebook.id);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(notebook.id);
                  }}
                  className={`group rounded-md border-t-2 ${
                    dragOverId === notebook.id && draggedId !== notebook.id
                      ? "border-foreground/40"
                      : "border-transparent"
                  } ${draggedId === notebook.id ? "opacity-40" : ""}`}
                >
                  <div className="relative flex items-center">
                    <button
                      onClick={() => toggleExpanded(notebook.id)}
                      aria-label={expanded ? "Collapse notebook" : "Expand notebook"}
                      aria-expanded={expanded}
                      className="flex w-5 shrink-0 items-center justify-center text-foreground/40 hover:text-foreground"
                    >
                      {expanded ? "▾" : "▸"}
                    </button>
                    <Link
                      href={`/notebooks/${notebook.id}`}
                      onClick={onNavigate}
                      className={`block flex-1 truncate rounded-md px-2 py-1.5 text-sm hover:bg-foreground/10 ${
                        params?.notebookId === notebook.id ? "bg-foreground/10 font-medium" : ""
                      }`}
                    >
                      {notebook.name}
                    </Link>
                    <button
                      onClick={() =>
                        setOpenMenuId((prev) => (prev === notebook.id ? null : notebook.id))
                      }
                      aria-label={`Options for ${notebook.name}`}
                      className={`shrink-0 rounded-md px-1.5 py-1 text-xs text-foreground/40 hover:bg-foreground/10 hover:text-foreground ${
                        openMenuId === notebook.id ? "" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      ⋯
                    </button>

                    {openMenuId === notebook.id && (
                      <>
                        {/* Click-outside catcher */}
                        <button
                          aria-hidden
                          tabIndex={-1}
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute top-full right-0 z-20 mt-1 flex w-32 flex-col overflow-hidden rounded-md border border-foreground/20 bg-background py-1 shadow-lg">
                          <button
                            onClick={() => startNewNote(notebook)}
                            className="px-3 py-1.5 text-left text-sm hover:bg-foreground/10"
                          >
                            New note
                          </button>
                          <button
                            onClick={() => startRename(notebook)}
                            className="px-3 py-1.5 text-left text-sm hover:bg-foreground/10"
                          >
                            Rename
                          </button>
                          {notebook.name !== "General" && (
                            <button
                              onClick={() => startDelete(notebook)}
                              className="px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {expanded && (
                    <ul className="ml-5 flex flex-col gap-0.5 border-l border-foreground/10 pl-2">
                      {newNoteForId === notebook.id && (
                        <li>
                          <form onSubmit={(e) => submitNewNote(e, notebook.id)}>
                            <input
                              autoFocus
                              value={newNoteTitle}
                              onChange={(e) => setNewNoteTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setNewNoteForId(null);
                              }}
                              placeholder="Note title"
                              disabled={creatingNote}
                              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-xs outline-none focus:border-foreground/60 disabled:opacity-50"
                            />
                          </form>
                        </li>
                      )}
                      {notebookNotes.map((note) => (
                        <li key={note.id}>
                          <Link
                            href={`/notes/${note.id}`}
                            onClick={onNavigate}
                            className={`block truncate rounded-md px-2 py-1 text-xs hover:bg-foreground/10 ${
                              params?.noteId === note.id
                                ? "bg-foreground/10 font-medium text-foreground"
                                : "text-foreground/60"
                            }`}
                          >
                            {note.title || "Untitled"}
                          </Link>
                        </li>
                      ))}
                      {notebookNotes.length === 0 && newNoteForId !== notebook.id && (
                        <li className="px-2 py-1 text-xs text-foreground/40">No notes</li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
            {notebooks.length === 0 && (
              <li className="px-2 py-1.5 text-sm text-foreground/50">No notebooks yet</li>
            )}
          </ul>

          <SidebarProjectsSection projects={projects} onNavigate={onNavigate} />
        </nav>

        <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-3">
          <span className="truncate text-sm text-foreground/60">{userName}</span>
          <button
            onClick={handleSignOut}
            className="shrink-0 rounded-md px-2 py-1 text-xs hover:bg-foreground/10"
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        className="fixed left-3 top-3 z-30 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm shadow-sm md:hidden"
      >
        ☰
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          aria-hidden
          tabIndex={-1}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/40 md:hidden"
        />
      )}

      {/* Mobile sliding drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-foreground/10 bg-background px-3 py-3 transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderBody({ onNavigate: () => setMobileOpen(false), headerAction: "close" })}
      </div>

      {/* Desktop sidebar */}
      {collapsed ? (
        <div className="hidden h-full border-r border-foreground/10 px-2 py-3 md:flex md:flex-col md:items-center md:gap-3">
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="rounded-md px-2 py-1 text-sm hover:bg-foreground/10"
          >
            »
          </button>
        </div>
      ) : (
        <div className="hidden h-full w-64 shrink-0 border-r border-foreground/10 px-3 py-3 md:flex md:flex-col">
          {renderBody({ onNavigate: () => {}, headerAction: "collapse" })}
        </div>
      )}
    </>
  );
}
