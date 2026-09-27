import type { Task, TaskAttachment, TaskProgressStatus, TaskStatus, TaskUpdate } from "@/lib/types";

export type TaskRecord = {
  id: number;
  owner_id: string;
  title: string;
  delegation: string;
  description: string;
  deadline_at: string | null;
  status: TaskStatus;
  created_at: string;
  created_by: string | null;
  notes: TaskUpdate[] | null;
  attachments: TaskAttachment[] | null;
  progress_status: TaskProgressStatus;
  status_log: { user: string; status: TaskProgressStatus; timestamp: string }[] | null;
  seen_by: string[] | null;
  completion_date: string | null;
  cancellation_details: { reason: string; cancelledBy: string; timestamp: string } | null;
};

export const taskRecordSelect = "id, owner_id, title, delegation, description, deadline_at, status, created_at, created_by, notes, attachments, progress_status, status_log, seen_by, completion_date, cancellation_details";

export function taskFromRecord(row: TaskRecord): Task {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    dueDate: row.deadline_at ?? "",
    status: row.status,
    assignedTo: row.delegation,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
    notes: row.notes ?? [],
    attachments: row.attachments ?? [],
    progressStatus: row.progress_status ?? "To Do",
    statusLog: row.status_log ?? [],
    seenBy: row.seen_by ?? [],
    completionDate: row.completion_date ?? undefined,
    cancellationDetails: row.cancellation_details ?? undefined
  };
}

export function taskToRecord(task: Task, ownerId: string) {
  return {
    owner_id: ownerId,
    title: task.title,
    delegation: task.assignedTo,
    description: task.description,
    deadline_at: task.dueDate || null,
    status: task.status,
    created_by: task.createdBy ?? null,
    notes: task.notes,
    attachments: task.attachments,
    progress_status: task.progressStatus ?? "To Do",
    status_log: task.statusLog ?? [],
    seen_by: task.seenBy ?? [],
    completion_date: task.completionDate ?? null,
    cancellation_details: task.cancellationDetails ?? null
  };
}
