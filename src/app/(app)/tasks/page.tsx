import { PageHeader } from "@/components/PageHeader";
import { TaskWorkspace } from "@/components/TaskWorkspace";
import { getVisibleTasks, properties } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks = getVisibleTasks(session.role);

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Work management"
        title="Tasks"
        description="Submit, schedule, prioritize, and track work through completion."
      />

      <TaskWorkspace initialTasks={tasks} properties={properties} session={session} />
    </div>
  );
}
