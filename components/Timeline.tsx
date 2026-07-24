import Link from "next/link";

type TimelineIssue = {
  id: string;
  title: string;
  status: string;
  expectedStart: string | Date;
  expectedEnd: string | Date;
};

type WorkAreaGroup = {
  id: string | null;
  name: string;
  color: string;
  issues: TimelineIssue[];
};

export function Timeline({ projectId, groups }: { projectId: string; groups: WorkAreaGroup[] }) {
  const allIssues = groups.flatMap((g) => g.issues);
  if (allIssues.length === 0) {
    return (
      <p className="text-sm text-foreground/50">
        No issues with an Expected Start and Expected End yet.
      </p>
    );
  }

  const rangeStart = Math.min(...allIssues.map((i) => new Date(i.expectedStart).getTime()));
  const rangeEnd = Math.max(...allIssues.map((i) => new Date(i.expectedEnd).getTime()));
  const rangeMs = Math.max(rangeEnd - rangeStart, 1);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between text-xs text-foreground/40">
        <span>{new Date(rangeStart).toLocaleDateString()}</span>
        <span>{new Date(rangeEnd).toLocaleDateString()}</span>
      </div>

      {groups.map((group) => (
        <section key={group.id ?? "ungrouped"}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
            {group.name}
          </h2>
          <div className="flex flex-col gap-2">
            {group.issues.map((issue) => {
              const start = new Date(issue.expectedStart).getTime();
              const end = new Date(issue.expectedEnd).getTime();
              const leftPct = ((start - rangeStart) / rangeMs) * 100;
              const widthPct = Math.max(((end - start) / rangeMs) * 100, 1.5);
              return (
                <div key={issue.id} className="flex items-center gap-3">
                  <Link
                    href={`/projects/${projectId}/issues/${issue.id}`}
                    className="w-40 shrink-0 truncate text-sm hover:underline"
                  >
                    {issue.title}
                  </Link>
                  <div className="relative h-5 flex-1 rounded bg-foreground/5">
                    <Link
                      href={`/projects/${projectId}/issues/${issue.id}`}
                      title={`${new Date(issue.expectedStart).toLocaleDateString()} – ${new Date(
                        issue.expectedEnd,
                      ).toLocaleDateString()}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: group.color }}
                      className="absolute top-0 h-5 rounded opacity-80 hover:opacity-100"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
