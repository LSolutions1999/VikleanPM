import { createClient } from "@/lib/supabase/server";
import { taskFromRecord, taskRecordSelect, type TaskRecord } from "@/lib/supabase/task-records";
import type { Task } from "@/lib/types";

export async function getTasksForCurrentUser(): Promise<{ tasks: Task[]; error: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { tasks: [], error: "Sign in to view tasks." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(taskRecordSelect)
    .order("created_at", { ascending: false });

  if (error) {
    return { tasks: [], error: error.message };
  }

  return { tasks: ((data ?? []) as TaskRecord[]).map(taskFromRecord), error: null };
}
