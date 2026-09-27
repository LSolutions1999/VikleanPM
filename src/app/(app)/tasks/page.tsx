import { TaskWorkspace } from "@/components/TaskWorkspace";
import { requireSession } from "@/lib/session";
import { getTasksForCurrentUser } from "@/lib/supabase/tasks";

export default async function TasksPage() {
  const session = await requireSession();
  const { tasks, error } = await getTasksForCurrentUser();

  return (
    <div className="content-stack">
      <TaskWorkspace initialTasks={tasks} initialError={error} session={session} />
    </div>
  );
}
