"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/cycles`, label: "Cycles" },
    { href: `${base}/timeline`, label: "Timeline" },
  ];

  return (
    <nav className="flex gap-1 border-b border-foreground/10">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
