"use client";

import { useState } from "react";

export function ConfirmButton({
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
          className="cursor-pointer rounded-md px-2 py-1 text-red-500 hover:bg-red-500/10"
        >
          {confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-md px-2 py-1 text-foreground/50 hover:bg-foreground/10"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="cursor-pointer rounded-md px-2 py-1 text-xs text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
    >
      {label}
    </button>
  );
}
