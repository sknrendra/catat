import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { getProjectMembership } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const membership = await getProjectMembership(projectId, userId);
  if (!membership) notFound();

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">{project.name}</h1>
      <ProjectTabs projectId={projectId} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
