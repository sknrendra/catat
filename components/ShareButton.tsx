"use client";

import { useState } from "react";

export function ShareButton({
  noteId,
  initialIsPublic,
}: {
  noteId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function setShared(value: boolean) {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: value }),
    });
    if (res.ok) setIsPublic(value);
    return res.ok;
  }

  async function handleShare() {
    // Copy before any await: Safari drops clipboard access once the click's
    // user activation is spent.
    const copy = navigator.clipboard
      .writeText(`${window.location.origin}/p/${noteId}`)
      .then(() => true, () => false);
    const shared = isPublic || (await setShared(true));
    const copied = await copy;
    setStatus(shared && copied ? "copied" : "error");
    setTimeout(() => setStatus("idle"), 2000);
  }

  const buttonClass =
    "cursor-pointer rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10 hover:text-foreground";

  return (
    <span className="flex items-center gap-1">
      <button onClick={handleShare} className={buttonClass}>
        {status === "copied"
          ? "Link copied"
          : status === "error"
            ? "Failed"
            : isPublic
              ? "Copy link"
              : "Share"}
      </button>
      {isPublic && (
        <button onClick={() => setShared(false)} className={buttonClass}>
          Stop sharing
        </button>
      )}
    </span>
  );
}
