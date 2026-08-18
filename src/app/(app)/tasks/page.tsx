import { PageHeader } from "@/components/PageHeader";
import { StatGrid } from "@/components/StatGrid";
import { TaskWorkspace } from "@/components/TaskWorkspace";
import { getVisibleTasks, properties, staff } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks = getVisibleTasks(session.role);

  const dueSoon = tasks.filter((task) => task.status !== "Completed").length;
  const highPriority = tasks.filter((task) => task.priority === "High").length;
  const completed = tasks.filter((task) => task.status === "Completed").length;

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Workflows"
        title="Tasks"
        description="Monitor work orders, maintenance jobs, and internal issue submissions with status history."
      />

      <StatGrid
        items={[
          { label: "Open tasks", value: String(dueSoon), hint: "Pending and in progress" },
          { label: "High priority", value: String(highPriority), hint: "Needs attention now" },
          { label: "Completed", value: String(completed), hint: "Closed and archived" },
          { label: "Properties", value: String(properties.length), hint: "Linked locations" }
        ]}
      />

      <TaskWorkspace initialTasks={tasks} properties={properties} staff={staff} />
    </div>
  );
}
