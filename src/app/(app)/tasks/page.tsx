import { PageHeader } from "@/components/PageHeader";
import { TaskWorkspace } from "@/components/TaskWorkspace";
import { requireSession } from "@/lib/session";
import { getTasksForCurrentUser } from "@/lib/supabase/tasks";

export default async function TasksPage() {
  const session = await requireSession();
  const { tasks, error } = await getTasksForCurrentUser();

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Work management"
        title="Tasks"
        description="Submit, schedule, and track work through completion."
      />

      <TaskWorkspace initialTasks={tasks} initialError={error} session={session} />
    </div>
  );
}
