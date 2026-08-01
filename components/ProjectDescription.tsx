"use client";

import { useState } from "react";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

export function ProjectDescription({
  projectId,
  initialDescription,
}: {
  projectId: string;
  initialDescription: string;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const saveDescription = useDebouncedCallback(async (value: string) => {
    setSaveState("saving");
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: value }),
    });
    setSaveState("saved");
  }, 600);

  function handleChange(value: string) {
    setDescription(value);
    saveDescription(value);
  }

  return (
    <div className="mb-6">
      <textarea
        value={description}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="What is this project about?"
        rows={3}
        className="w-full resize-none rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/30 focus:border-foreground/60"
      />
      <span className="mt-1 block text-right text-xs text-foreground/40">
        {saveState === "saving" ? "Saving…" : "Saved"}
      </span>
    </div>
  );
}
