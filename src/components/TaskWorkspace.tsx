"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Pencil,
  PlusCircle,
  Search,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type {
  Property,
  Task,
  TaskPriority,
  TaskProgressStatus,
  SessionContext
} from "@/lib/types";

type TaskWorkspaceProps = {
  initialTasks: Task[];
  properties: Property[];
  session: SessionContext;
};

type ViewMode = "calendar" | "list";
type TaskSort = "created" | "title-asc" | "title-desc" | "priority-high" | "priority-low" | "delegate-asc" | "delegate-desc" | "deadline-soon" | "deadline-late";

const priorityLevels: { level: TaskPriority; label: string }[] = [
  { level: 1, label: "Critical" },
  { level: 2, label: "High" },
  { level: 3, label: "Medium" },
  { level: 4, label: "Low" },
  { level: 5, label: "Lowest" }
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const blankTask = {
  title: "",
  description: "",
  tools: "None",
  priority: "" as "" | `${TaskPriority}`,
  delegation: "",
  propertyId: "",
  unitId: "",
  deadlineDate: "",
  deadlineTime: "12:00",
  deadlineOpen: true
};

function formatTaskDate(value?: string | null) {
  if (!value) return "Open";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Open" : date.toLocaleString([], {
    year: "numeric", month: "numeric", day: "numeric", hour: value.includes("T") ? "2-digit" : undefined, minute: value.includes("T") ? "2-digit" : undefined
  });
}

function taskSortDate(task: Task, archived = false) {
  const value = archived
    ? task.status === "Completed" ? task.completionDate : task.cancellationDetails?.timestamp
    : task.dueDate;
  return value ? new Date(value).getTime() : null;
}

function priorityName(priority: TaskPriority | null) {
  return priorityLevels.find((item) => item.level === priority)?.label ?? "Optional";
}

function priorityClass(priority: TaskPriority | null) {
  if (priority === null) return "priority-optional";
  return `priority-level-${priority}`;
}

function progressIcon(status?: TaskProgressStatus) {
  if (status === "On Hold") return <AlertTriangle size={18} aria-label="On hold" />;
  if (status === "In Progress") return <Clock3 size={18} aria-label="In progress" />;
  return <CheckSquare size={18} aria-label="To do" />;
}

export function TaskWorkspace({ initialTasks, properties, session }: TaskWorkspaceProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState<"active" | "submit" | "previous">("active");
  const [activeView, setActiveView] = useState<ViewMode>("calendar");
  const [previousView, setPreviousView] = useState<ViewMode>("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeSearch, setActiveSearch] = useState("");
  const [previousSearch, setPreviousSearch] = useState("");
  const [activeSort, setActiveSort] = useState<TaskSort>("created");
  const [previousSort, setPreviousSort] = useState<"date-desc" | "title-asc" | "title-desc">("date-desc");
  const [newTask, setNewTask] = useState(blankTask);
  const [confirmingNewTask, setConfirmingNewTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [cancellingTaskId, setCancellingTaskId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logTaskId, setLogTaskId] = useState<string | null>(null);
  const [calendarTasks, setCalendarTasks] = useState<Task[] | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);

  const isAdmin = session.role === "admin";
  const activeTasks = useMemo(() => tasks.filter((task) => task.status === "Pending" || task.status === "In Progress"), [tasks]);
  const previousTasks = useMemo(() => tasks.filter((task) => task.status === "Completed" || task.status === "Cancelled"), [tasks]);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const completingTask = tasks.find((task) => task.id === completingTaskId) ?? null;
  const cancellingTask = tasks.find((task) => task.id === cancellingTaskId) ?? null;
  const deletingTask = tasks.find((task) => task.id === deletingTaskId) ?? null;
  const logTask = tasks.find((task) => task.id === logTaskId) ?? null;

  const filteredActiveTasks = useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    const filtered = activeTasks.filter((task) => {
      const property = properties.find((item) => item.id === task.propertyId);
      const unit = property?.units.find((item) => item.id === task.unitId);
      return !query || [task.title, task.description, task.assignedTo, property?.name, unit?.number]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
    });

    return filtered.sort((a, b) => {
      const titleCompare = a.title.localeCompare(b.title);
      const delegateCompare = a.assignedTo.localeCompare(b.assignedTo);
      const aDate = taskSortDate(a);
      const bDate = taskSortDate(b);
      switch (activeSort) {
        case "title-asc": return titleCompare;
        case "title-desc": return -titleCompare;
        case "priority-high": return (a.priority ?? 6) - (b.priority ?? 6);
        case "priority-low": return (b.priority ?? 6) - (a.priority ?? 6);
        case "delegate-asc": return delegateCompare;
        case "delegate-desc": return -delegateCompare;
        case "deadline-soon": return aDate === null ? 1 : bDate === null ? -1 : aDate - bDate;
        case "deadline-late": return aDate === null ? 1 : bDate === null ? -1 : bDate - aDate;
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [activeSearch, activeSort, activeTasks, properties]);

  const filteredPreviousTasks = useMemo(() => {
    const query = previousSearch.trim().toLowerCase();
    return previousTasks.filter((task) => {
      const property = properties.find((item) => item.id === task.propertyId);
      return !query || [task.title, task.description, task.assignedTo, task.createdBy, property?.name]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
    }).sort((a, b) => {
      if (previousSort === "title-asc") return a.title.localeCompare(b.title);
      if (previousSort === "title-desc") return b.title.localeCompare(a.title);
      return (taskSortDate(b, true) ?? -1) - (taskSortDate(a, true) ?? -1);
    });
  }, [previousSearch, previousSort, previousTasks, properties]);

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  function updateTask(taskId: string, updater: (task: Task) => Task) {
    setTasks((current) => current.map((task) => task.id === taskId ? updater(task) : task));
  }

  function submitNewTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmingNewTask(true);
  }

  function createTask() {
    const now = new Date().toISOString();
    const dueDate = newTask.deadlineOpen || !newTask.deadlineDate
      ? ""
      : new Date(`${newTask.deadlineDate}T${newTask.deadlineTime || "12:00"}`).toISOString();
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      dueDate,
      priority: newTask.priority ? Number(newTask.priority) as TaskPriority : null,
      status: "Pending",
      propertyId: newTask.propertyId,
      unitId: newTask.unitId || undefined,
      assignedTo: newTask.delegation.trim(),
      createdAt: now,
      createdBy: session.name,
      tools: newTask.tools.trim() || "None",
      notes: [],
      attachments: [],
      progressStatus: "To Do",
      statusLog: [{ user: session.name, status: "To Do", timestamp: now }],
      seenBy: []
    };
    setTasks((current) => [task, ...current]);
    setNewTask(blankTask);
    setConfirmingNewTask(false);
    setActiveTab("active");
    setSelectedTaskId(task.id);
  }

  function setProgressStatus(task: Task, status: TaskProgressStatus) {
    const entry = { user: session.name, status, timestamp: new Date().toISOString() };
    updateTask(task.id, (current) => ({
      ...current,
      progressStatus: status,
      statusLog: [...(current.statusLog ?? []), entry]
    }));
  }

  function markSeen(task: Task) {
    if (task.seenBy?.includes(session.name)) return;
    updateTask(task.id, (current) => ({ ...current, seenBy: [...(current.seenBy ?? []), session.name] }));
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask || !editDraft) return;
    updateTask(selectedTask.id, (current) => ({
      ...current,
      title: editDraft.title.trim(),
      description: editDraft.description.trim(),
      tools: editDraft.tools ?? "None",
      dueDate: editDraft.dueDate,
      priority: editDraft.priority,
      propertyId: editDraft.propertyId,
      unitId: editDraft.unitId,
      assignedTo: editDraft.assignedTo.trim()
    }));
    setEditing(false);
  }

  function completeTask() {
    if (!completingTask) return;
    updateTask(completingTask.id, (task) => ({ ...task, status: "Completed", completionDate: new Date().toISOString() }));
    setCompletingTaskId(null);
    setSelectedTaskId(null);
  }

  function cancelTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancellingTask || !cancellationReason.trim()) return;
    updateTask(cancellingTask.id, (task) => ({
      ...task,
      status: "Cancelled",
      cancellationDetails: { reason: cancellationReason.trim(), cancelledBy: session.name, timestamp: new Date().toISOString() }
    }));
    setCancellationReason("");
    setCancellingTaskId(null);
    setSelectedTaskId(null);
  }

  function deleteTask() {
    if (!deletingTask) return;
    setTasks((current) => current.filter((task) => task.id !== deletingTask.id));
    setDeletingTaskId(null);
    setSelectedTaskId(null);
    setConfirmDelete(false);
  }

  function openCalendarDay(day: Date, sourceTasks: Task[], archived: boolean) {
    const dateKey = format(day, "yyyy-MM-dd");
    const matching = sourceTasks.filter((task) => {
      const value = archived
        ? task.status === "Completed" ? task.completionDate : task.cancellationDetails?.timestamp
        : task.dueDate;
      return value ? format(new Date(value), "yyyy-MM-dd") === dateKey : false;
    }).sort((a, b) => (a.priority ?? 6) - (b.priority ?? 6));
    if (matching.length) {
      setCalendarDate(day);
      setCalendarTasks(matching);
    }
  }

  function renderCalendar(sourceTasks: Task[], archived = false) {
    return (
      <section className="task-calendar panel">
        <div className="task-calendar-heading">
          <h3>{format(currentMonth, "MMMM yyyy")}</h3>
          <div className="calendar-controls">
            <button className="icon-button" type="button" aria-label="Previous month" onClick={() => setCurrentMonth((date) => subMonths(date, 1))}><ChevronLeft size={18} /></button>
            <button className="icon-button" type="button" aria-label="Next month" onClick={() => setCurrentMonth((date) => addMonths(date, 1))}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="task-calendar-grid">
          {weekdays.map((day) => <div key={day} className="task-calendar-weekday">{day}</div>)}
          {monthDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const count = sourceTasks.filter((task) => {
              const value = archived
                ? task.status === "Completed" ? task.completionDate : task.cancellationDetails?.timestamp
                : task.dueDate;
              return value ? format(new Date(value), "yyyy-MM-dd") === dayKey : false;
            }).length;
            return (
              <button
                type="button"
                key={dayKey}
                className={`task-calendar-day${!isSameMonth(day, currentMonth) ? " out-of-month" : ""}${isToday(day) ? " today" : ""}${count ? " has-tasks" : ""}`}
                onClick={() => openCalendarDay(day, sourceTasks, archived)}
                aria-label={`${format(day, "PPPP")}, ${count} tasks`}
              >
                <span>{format(day, "d")}</span>
                {count ? <strong>{count} {count === 1 ? "task" : "tasks"}</strong> : null}
              </button>
            );
          })}
        </div>
        {sourceTasks.some((task) => !task.dueDate && !archived) ? <p className="muted">Tasks with an open deadline are not placed on the calendar.</p> : null}
      </section>
    );
  }

  function renderTaskRows(rows: Task[], archived = false) {
    if (!rows.length) return <div className="task-empty">{activeSearch && !archived || previousSearch && archived ? "No tasks match your search." : archived ? "No previous tasks yet." : "You have no active tasks. Add a task to get started."}</div>;

    return (
      <div className="task-table-wrap">
        <div className="task-table task-table-head">
          <span>Task</span><span>{archived ? "Final date" : "For"}</span><span className="task-col-priority">Priority</span><span>{archived ? "Status" : "Deadline"}</span><span>{archived ? "" : "Progress"}</span>
        </div>
        {rows.map((task) => {
          const property = properties.find((item) => item.id === task.propertyId);
          const date = archived ? taskSortDate(task, true) : taskSortDate(task);
          return (
            <button type="button" key={task.id} className="task-table task-table-row" onClick={() => setSelectedTaskId(task.id)}>
              <span className="task-row-title"><strong>{task.title}</strong><small>{property?.name ?? "No property"}</small></span>
              <span>{archived ? date ? new Date(date).toLocaleString() : "N/A" : task.assignedTo}</span>
              <span className={`task-col-priority priority-label ${priorityClass(task.priority)}`}>{priorityName(task.priority)}</span>
              <span>{archived ? task.status : formatTaskDate(task.dueDate)}</span>
              <span className="task-progress-icon">{archived ? "" : progressIcon(task.progressStatus)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const sortMenu = (value: TaskSort, onChange: (value: TaskSort) => void) => (
    <label className="select-field task-sort-field">
      <span>Sort tasks</span>
      <select value={value} onChange={(event) => onChange(event.target.value as TaskSort)}>
        <option value="created">Default (newest)</option>
        <option value="title-asc">Task (A–Z)</option>
        <option value="title-desc">Task (Z–A)</option>
        <option value="priority-high">Priority (high to low)</option>
        <option value="priority-low">Priority (low to high)</option>
        <option value="delegate-asc">For (A–Z)</option>
        <option value="delegate-desc">For (Z–A)</option>
        <option value="deadline-soon">Deadline (soonest)</option>
        <option value="deadline-late">Deadline (latest)</option>
      </select>
    </label>
  );

  return (
    <div className="task-workspace">
      <div className="task-tabs" role="tablist" aria-label="Task views">
        <button type="button" role="tab" aria-selected={activeTab === "active"} className={activeTab === "active" ? "task-tab active" : "task-tab"} onClick={() => setActiveTab("active")}>Active</button>
        <button type="button" role="tab" aria-selected={activeTab === "submit"} className={activeTab === "submit" ? "task-tab active" : "task-tab"} onClick={() => setActiveTab("submit")}>Submit</button>
        <button type="button" role="tab" aria-selected={activeTab === "previous"} className={activeTab === "previous" ? "task-tab active" : "task-tab"} onClick={() => setActiveTab("previous")}>Previous</button>
      </div>

      {activeTab === "active" ? (
        <section className="panel task-tab-panel">
          <div className="task-view-switch" role="tablist" aria-label="Active tasks display">
            <button type="button" className={activeView === "calendar" ? "toggle active" : "toggle"} onClick={() => setActiveView("calendar")}>Calendar View</button>
            <button type="button" className={activeView === "list" ? "toggle active" : "toggle"} onClick={() => setActiveView("list")}>List View</button>
          </div>
          {activeView === "calendar" ? renderCalendar(activeTasks) : (
            <div className="task-list-view">
              <div className="task-toolbar">
                <label className="search-field">
                  <span>Search tasks</span>
                  <div className="input-with-icon"><Search size={16} /><input value={activeSearch} onChange={(event) => setActiveSearch(event.target.value)} placeholder="Task, property, or assignee" /></div>
                </label>
                {sortMenu(activeSort, setActiveSort)}
              </div>
              {renderTaskRows(filteredActiveTasks)}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "submit" ? (
        <section className="panel task-submit-panel">
          <div>
            <p className="eyebrow">Submit a task</p>
            <h3>Describe the work</h3>
          </div>
          <form className="task-submit-form" onSubmit={submitNewTask}>
            <div className="form-grid">
              <label><span>Task title</span><input required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} placeholder="Replace hallway light fixture" /></label>
              <label><span>For / delegation</span><input required value={newTask.delegation} onChange={(event) => setNewTask({ ...newTask, delegation: event.target.value })} placeholder="Person responsible" /></label>
              <label className="full"><span>Description</span><textarea required rows={4} value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })} placeholder="Location, job type, and assignment details" /></label>
              <label><span>Property</span><select required value={newTask.propertyId} onChange={(event) => setNewTask({ ...newTask, propertyId: event.target.value, unitId: "" })}><option value="">Choose property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
              <label><span>Unit (optional)</span><select value={newTask.unitId} onChange={(event) => setNewTask({ ...newTask, unitId: event.target.value })} disabled={!newTask.propertyId}><option value="">Property-wide</option>{properties.find((property) => property.id === newTask.propertyId)?.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.number}</option>)}</select></label>
              <label><span>Priority</span><select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value as typeof blankTask.priority })}><option value="">Optional</option>{priorityLevels.map((item) => <option key={item.level} value={item.level}>{item.level} · {item.label}</option>)}</select></label>
              <label><span>Tools / materials needed</span><input value={newTask.tools} onChange={(event) => setNewTask({ ...newTask, tools: event.target.value })} placeholder="Drill, ladder, or provided" /></label>
              <label><span>Deadline date</span><input type="date" value={newTask.deadlineDate} disabled={newTask.deadlineOpen} onChange={(event) => setNewTask({ ...newTask, deadlineDate: event.target.value })} /></label>
              <label><span>Deadline time</span><input type="time" value={newTask.deadlineTime} disabled={newTask.deadlineOpen || !newTask.deadlineDate} onChange={(event) => setNewTask({ ...newTask, deadlineTime: event.target.value })} /></label>
              <label className="full task-open-deadline"><input type="checkbox" checked={newTask.deadlineOpen} onChange={(event) => setNewTask({ ...newTask, deadlineOpen: event.target.checked })} /><span>Open deadline</span></label>
            </div>
            <div className="task-submit-actions"><button className="primary-button" type="submit"><PlusCircle size={17} /> Review task</button></div>
          </form>
        </section>
      ) : null}

      {activeTab === "previous" ? (
        <section className="panel task-tab-panel">
          <div className="task-view-switch" role="tablist" aria-label="Previous tasks display">
            <button type="button" className={previousView === "list" ? "toggle active" : "toggle"} onClick={() => setPreviousView("list")}>List View</button>
            <button type="button" className={previousView === "calendar" ? "toggle active" : "toggle"} onClick={() => setPreviousView("calendar")}>Calendar View</button>
          </div>
          {previousView === "calendar" ? renderCalendar(previousTasks, true) : (
            <div className="task-list-view">
              <div className="task-toolbar">
                <label className="search-field"><span>Search previous tasks</span><div className="input-with-icon"><Search size={16} /><input value={previousSearch} onChange={(event) => setPreviousSearch(event.target.value)} placeholder="Search previous tasks" /></div></label>
                <label className="select-field task-sort-field"><span>Sort tasks</span><select value={previousSort} onChange={(event) => setPreviousSort(event.target.value as typeof previousSort)}><option value="date-desc">Date (newest)</option><option value="title-asc">Task (A–Z)</option><option value="title-desc">Task (Z–A)</option></select></label>
              </div>
              {renderTaskRows(filteredPreviousTasks, true)}
            </div>
          )}
        </section>
      ) : null}

      {confirmingNewTask ? (
        <Modal title="Confirm New Task" onClose={() => setConfirmingNewTask(false)}>
          <p className="muted">Review these details before adding the task.</p>
          <dl className="task-review-list">
            <div><dt>Task</dt><dd>{newTask.title}</dd></div>
            <div><dt>For</dt><dd>{newTask.delegation}</dd></div>
            <div><dt>Description</dt><dd>{newTask.description}</dd></div>
            <div><dt>Priority</dt><dd>{newTask.priority ? `${newTask.priority} · ${priorityName(Number(newTask.priority) as TaskPriority)}` : "Optional"}</dd></div>
            <div><dt>Deadline</dt><dd>{newTask.deadlineOpen || !newTask.deadlineDate ? "Open" : formatTaskDate(`${newTask.deadlineDate}T${newTask.deadlineTime || "12:00"}`)}</dd></div>
            <div><dt>Property</dt><dd>{properties.find((property) => property.id === newTask.propertyId)?.name ?? ""}</dd></div>
            <div><dt>Tools / materials</dt><dd>{newTask.tools || "None"}</dd></div>
          </dl>
          <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setConfirmingNewTask(false)}>Back</button><button type="button" className="primary-button" onClick={createTask}>Confirm &amp; Add Task</button></div>
        </Modal>
      ) : null}

      {selectedTask ? (
        <Modal title={editing ? "Edit Task" : selectedTask.title} onClose={() => { setSelectedTaskId(null); setEditing(false); }}>
          {editing && editDraft ? (
            <form className="task-edit-form" onSubmit={saveEdit}>
              <div className="form-grid">
                <label><span>Task title</span><input required value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} /></label>
                <label><span>For / delegation</span><input required value={editDraft.assignedTo} onChange={(event) => setEditDraft({ ...editDraft, assignedTo: event.target.value })} /></label>
                <label className="full"><span>Description</span><textarea required rows={4} value={editDraft.description} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} /></label>
                <label><span>Property</span><select required value={editDraft.propertyId} onChange={(event) => setEditDraft({ ...editDraft, propertyId: event.target.value, unitId: undefined })}>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
                <label><span>Unit</span><select value={editDraft.unitId ?? ""} onChange={(event) => setEditDraft({ ...editDraft, unitId: event.target.value || undefined })}><option value="">Property-wide</option>{properties.find((property) => property.id === editDraft.propertyId)?.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.number}</option>)}</select></label>
                <label><span>Priority</span><select value={editDraft.priority ?? ""} onChange={(event) => setEditDraft({ ...editDraft, priority: event.target.value ? Number(event.target.value) as TaskPriority : null })}><option value="">Optional</option>{priorityLevels.map((item) => <option key={item.level} value={item.level}>{item.level} · {item.label}</option>)}</select></label>
                <label><span>Deadline</span><input type="datetime-local" value={editDraft.dueDate ? format(new Date(editDraft.dueDate), "yyyy-MM-dd'T'HH:mm") : ""} onChange={(event) => setEditDraft({ ...editDraft, dueDate: event.target.value ? new Date(event.target.value).toISOString() : "" })} /></label>
                <label className="full"><span>Tools / materials needed</span><input value={editDraft.tools ?? ""} onChange={(event) => setEditDraft({ ...editDraft, tools: event.target.value })} /></label>
              </div>
              <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="primary-button">Save Changes</button></div>
            </form>
          ) : (
            <>
              <div className="task-detail-topline"><span className={`priority-label ${priorityClass(selectedTask.priority)}`}>Priority {selectedTask.priority ?? "—"} · {priorityName(selectedTask.priority)}</span><span className={`status-pill status-${selectedTask.status.toLowerCase()}`}>{selectedTask.status}</span></div>
              <p className="task-detail-description">{selectedTask.description}</p>
              <div className="detail-list task-detail-list">
                <div className="detail-row"><strong>Deadline</strong><span>{formatTaskDate(selectedTask.dueDate)}</span></div>
                <div className="detail-row"><strong>For / delegation</strong><span>{selectedTask.assignedTo}</span></div>
                <div className="detail-row"><strong>Property</strong><span>{properties.find((property) => property.id === selectedTask.propertyId)?.name ?? "No property"}</span></div>
                {selectedTask.unitId ? <div className="detail-row"><strong>Unit</strong><span>{properties.find((property) => property.id === selectedTask.propertyId)?.units.find((unit) => unit.id === selectedTask.unitId)?.number ?? "N/A"}</span></div> : null}
                <div className="detail-row"><strong>Tools / materials</strong><span>{selectedTask.tools || "None"}</span></div>
                <div className="detail-row"><strong>Submitted</strong><span>{formatTaskDate(selectedTask.createdAt)}</span></div>
                <div className="detail-row"><strong>Issuer</strong><span>{selectedTask.createdBy ?? "Staff"}</span></div>
                <div className="detail-row"><strong>Seen by</strong><span>{selectedTask.seenBy?.length ? selectedTask.seenBy.join(", ") : "No one yet"}</span></div>
              </div>
              {selectedTask.cancellationDetails ? <div className="task-cancellation-note"><strong>Cancellation reason</strong><p>{selectedTask.cancellationDetails.reason}</p><span>Cancelled by {selectedTask.cancellationDetails.cancelledBy} · {formatTaskDate(selectedTask.cancellationDetails.timestamp)}</span></div> : null}
              {selectedTask.completionDate ? <p className="muted">Completed {formatTaskDate(selectedTask.completionDate)}</p> : null}
              {selectedTask.attachments.length ? <div><p className="eyebrow">Attachments</p><ul className="task-attachment-list">{selectedTask.attachments.map((attachment) => <li key={attachment.id}>{attachment.fileName}</li>)}</ul></div> : null}
              {selectedTask.notes.length ? <div className="task-existing-notes"><p className="eyebrow">Notes</p>{selectedTask.notes.map((note) => <article key={note.id}><span>{formatTaskDate(note.createdAt)}</span><p>{note.note}</p></article>)}</div> : null}
              <details className="task-more-details"><summary>More Details</summary><p>Progress: {selectedTask.progressStatus ?? "To Do"}</p></details>
              <div className="task-status-actions">
                <span>Update status</span>
                {(["To Do", "In Progress", "On Hold"] as TaskProgressStatus[]).map((status) => <button key={status} type="button" className={selectedTask.progressStatus === status ? "toggle active" : "toggle"} onClick={() => setProgressStatus(selectedTask, status)}>{status}</button>)}
                <button className="ghost-button" type="button" onClick={() => { setLogTaskId(selectedTask.id); setSelectedTaskId(null); }}>Status Log</button>
              </div>
              <div className="modal-actions task-modal-actions">
                {selectedTask.status !== "Completed" && selectedTask.status !== "Cancelled" ? <button type="button" className="primary-button" onClick={() => setCompletingTaskId(selectedTask.id)}>Complete Task</button> : null}
                <button type="button" className="ghost-button" onClick={() => markSeen(selectedTask)} disabled={selectedTask.seenBy?.includes(session.name)}><Eye size={16} />{selectedTask.seenBy?.includes(session.name) ? "Seen" : "Mark as Seen"}</button>
                {(isAdmin || selectedTask.createdBy === session.name) && selectedTask.status === "Pending" ? <button type="button" className="ghost-button" onClick={() => { setEditDraft({ ...selectedTask }); setEditing(true); }}><Pencil size={16} /> Edit Task</button> : null}
                {!isAdmin && selectedTask.createdBy === session.name && selectedTask.status === "Pending" ? <button type="button" className="ghost-button danger-button" onClick={() => setCancellingTaskId(selectedTask.id)}>Cancel Task</button> : null}
                {isAdmin ? <button type="button" className="ghost-button danger-button" onClick={() => { setDeletingTaskId(selectedTask.id); setConfirmDelete(false); }}>Delete Task</button> : null}
              </div>
            </>
          )}
        </Modal>
      ) : null}

      {logTask ? <Modal title={`Status Log: ${logTask.title}`} onClose={() => setLogTaskId(null)}><p className="muted">History of status changes for this task.</p><ol className="task-status-log">{(logTask.statusLog ?? []).slice().reverse().map((entry, index) => <li key={`${entry.timestamp}-${index}`}><strong>{entry.user}</strong> set status to <strong>{entry.status}</strong><span>{formatTaskDate(entry.timestamp)}</span></li>)}</ol></Modal> : null}

      {completingTask ? <Modal title="Confirm Task Completion" onClose={() => setCompletingTaskId(null)}><p>You are about to mark this task as complete.</p><div className="task-review-list"><div><strong>{completingTask.title}</strong></div><div><span>Deadline</span><span>{formatTaskDate(completingTask.dueDate)}</span></div><div><span>Completion date</span><span>{formatTaskDate(new Date().toISOString())}</span></div></div><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setCompletingTaskId(null)}>Back</button><button className="primary-button" type="button" onClick={completeTask}>Confirm Completion</button></div></Modal> : null}

      {cancellingTask ? <Modal title={`Cancel Task: ${cancellingTask.title}`} onClose={() => { setCancellingTaskId(null); setCancellationReason(""); }}><p className="muted">Please provide a reason for cancelling this task. This action cannot be undone.</p><form onSubmit={cancelTask}><label className="inline-field"><span>Cancellation reason</span><textarea required rows={4} value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} placeholder="Reason for cancellation" /></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setCancellingTaskId(null)}>Back</button><button className="primary-button danger-action" type="submit" disabled={!cancellationReason.trim()}>Confirm Cancellation</button></div></form></Modal> : null}

      {deletingTask ? <Modal title="Delete task?" onClose={() => { setDeletingTaskId(null); setConfirmDelete(false); }}><p>This will permanently delete “{deletingTask.title}”. This action cannot be undone.</p><label className="task-open-deadline"><input type="checkbox" checked={confirmDelete} onChange={(event) => setConfirmDelete(event.target.checked)} /><span>Confirm delete</span></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setDeletingTaskId(null)}>Keep task</button><button className="primary-button danger-action" type="button" disabled={!confirmDelete} onClick={deleteTask}>Delete Task</button></div></Modal> : null}

      {calendarTasks && calendarDate ? <Modal title={`Tasks for ${format(calendarDate, "PPP")}`} onClose={() => setCalendarTasks(null)}><p className="muted">Tasks for this day, sorted by priority. Select a task to see its details.</p><div className="calendar-task-list">{calendarTasks.map((task) => <button key={task.id} type="button" className="calendar-task-item" onClick={() => { setCalendarTasks(null); setSelectedTaskId(task.id); }}><span><strong>{task.title}</strong><small>{task.description}</small></span><span className={`priority-label ${priorityClass(task.priority)}`}>{priorityName(task.priority)}</span><span>{task.assignedTo}</span></button>)}</div></Modal> : null}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-panel task-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header"><h3>{title}</h3><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        <div className="task-modal-content">{children}</div>
      </section>
    </div>
  );
}
