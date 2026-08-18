"use client";

import { format, isSameWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarDays, Paperclip, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Property, StaffProfile, Task } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";

type TaskWorkspaceProps = {
  initialTasks: Task[];
  properties: Property[];
  staff: StaffProfile[];
};

type ViewMode = "month" | "week";
type TaskView = "list" | "calendar";

const blankForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  propertyId: "",
  assignedTo: ""
};

export function TaskWorkspace({ initialTasks, properties, staff }: TaskWorkspaceProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [taskView, setTaskView] = useState<TaskView>("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(blankForm);
  const [progressNote, setProgressNote] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const property = properties.find((entry) => entry.id === task.propertyId);
      const matchesSearch =
        !query ||
        [task.title, task.description, property?.name, task.assignedTo]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesProperty = propertyFilter === "All" || task.propertyId === propertyFilter;
      const matchesAssignee = assigneeFilter === "All" || task.assignedTo === assigneeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProperty && matchesAssignee;
    });
  }, [assigneeFilter, priorityFilter, properties, propertyFilter, search, statusFilter, tasks]);

  const activeDate = new Date();
  const monthDays = eachDayOfInterval({
    start: startOfMonth(activeDate),
    end: endOfMonth(activeDate)
  });
  const weeklyDays = monthDays.filter((day) => isSameWeek(day, activeDate, { weekStartsOn: 1 }));
  const calendarDays = viewMode === "month" ? monthDays : weeklyDays;
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return filteredTasks.filter((task) => task.dueDate === selectedDate);
  }, [filteredTasks, selectedDate]);

  const selectedDayLabel = selectedDate ? format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMMM d, yyyy") : "";
  const getUnitNumber = (propertyId: string, unitId?: string) =>
    properties.find((entry) => entry.id === propertyId)?.units.find((unit) => unit.id === unitId)?.number;

  function addTask() {
    if (!form.title || !form.dueDate || !form.propertyId || !form.assignedTo) {
      return;
    }

    setTasks((current) => [
      {
        id: `task-${Date.now()}`,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        priority: form.priority as Task["priority"],
        status: "Pending",
        propertyId: form.propertyId,
        assignedTo: form.assignedTo,
        createdAt: new Date().toISOString(),
        notes: [],
        attachments: []
      },
      ...current
    ]);

    setForm(blankForm);
  }

  function addNote(taskId: string) {
    if (!progressNote.trim()) {
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              notes: [
                {
                  id: `note-${Date.now()}`,
                  note: progressNote.trim(),
                  createdAt: new Date().toISOString()
                },
                ...task.notes
              ],
              status: task.status === "Pending" ? "In Progress" : task.status
            }
          : task
      )
    );

    setProgressNote("");
  }

  return (
    <div className="task-layout">
      <section className="stack-lg">
        <div className="toolbar">
          <label className="search-field">
            <span>Search tasks</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, property, or assignee" />
            </div>
          </label>

          <label className="select-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </label>

          <label className="select-field">
            <span>Priority</span>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>

          <label className="select-field">
            <span>Property</span>
            <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>
              <option>All</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>

          <label className="select-field">
            <span>Assigned user</span>
            <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
              <option>All</option>
              {staff.map((person) => (
                <option key={person.id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="toggle-bar">
          <button className={taskView === "list" ? "toggle active" : "toggle"} onClick={() => setTaskView("list")} type="button">
            List View
          </button>
          <button className={taskView === "calendar" ? "toggle active" : "toggle"} onClick={() => setTaskView("calendar")} type="button">
            Calendar View
          </button>
        </div>

        <div className="toggle-bar">
          <button className={viewMode === "month" ? "toggle active" : "toggle"} onClick={() => setViewMode("month")} type="button">
            Monthly
          </button>
          <button className={viewMode === "week" ? "toggle active" : "toggle"} onClick={() => setViewMode("week")} type="button">
            Weekly
          </button>
        </div>

        {taskView === "calendar" ? (
          <div className="calendar-panel">
            <div className="calendar-header">
              <div>
                <p className="eyebrow">Calendar</p>
                <h3>{format(activeDate, "MMMM yyyy")}</h3>
              </div>
              <CalendarDays size={18} />
            </div>

            <div className={viewMode === "month" ? "calendar-grid month" : "calendar-grid week"}>
              {calendarDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayTasks = filteredTasks.filter((task) => task.dueDate === dayKey);
                const isSelected = selectedDate === dayKey;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={isSelected ? "calendar-day calendar-day-selected" : "calendar-day"}
                    onClick={() => setSelectedDate(dayKey)}
                  >
                    <div className="calendar-day-top">
                      <strong>{format(day, "d")}</strong>
                      <span>{format(day, "EEE")}</span>
                    </div>
                    <div className="calendar-count">
                      <strong>{dayTasks.length}</strong>
                      <span>{dayTasks.length === 1 ? "task" : "tasks"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="selected-day-panel">
              <div className="calendar-header">
                <div>
                  <p className="eyebrow">Selected day</p>
                  <h3>{selectedDate ? selectedDayLabel : "Choose a day"}</h3>
                </div>
              </div>

              {selectedDate ? (
                selectedDayTasks.length ? (
                  <div className="mini-list">
                    {selectedDayTasks.map((task) => {
                      const property = properties.find((entry) => entry.id === task.propertyId);

                      return (
                        <article key={task.id} className="mini-list-item">
                          <strong>{task.title}</strong>
                          <span>{property?.name ?? "Unknown property"}</span>
                          <span>
                            {task.status} - {task.priority} - Assigned to {task.assignedTo}
                          </span>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="page-description">There are no tasks scheduled for this day.</p>
                )
              ) : (
                <p className="page-description">Click any day in the calendar to see its task list.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => {
              const property = properties.find((entry) => entry.id === task.propertyId);

              return (
                <article key={task.id} className="task-card">
                  <div className="task-card-top">
                    <div>
                      <p className="eyebrow">{property?.name ?? "Unknown property"}</p>
                      <h3>{task.title}</h3>
                      <p className="muted">{task.description}</p>
                    </div>
                    <div className="task-badges">
                      <span className={`status-pill priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <span className={`status-pill status-${task.status.toLowerCase().replace(/\s+/g, "-")}`}>{task.status}</span>
                    </div>
                  </div>

                  <div className="task-meta">
                    <span>Due {formatDate(task.dueDate)}</span>
                    <span>Assigned to {task.assignedTo}</span>
                    <span>{task.unitId ? `Unit ${getUnitNumber(task.propertyId, task.unitId) ?? "N/A"}` : "Property-wide"}</span>
                  </div>

                  <div className="task-notes">
                    <label className="inline-field">
                      <span>Add progress note</span>
                      <div className="input-with-icon">
                        <Paperclip size={16} />
                        <input value={progressNote} onChange={(event) => setProgressNote(event.target.value)} placeholder="Update status for the team" />
                      </div>
                    </label>
                    <button className="primary-button" type="button" onClick={() => addNote(task.id)}>
                      Add note
                    </button>
                  </div>

                  {task.notes.length ? (
                    <div className="history-list">
                      {task.notes.map((note) => (
                        <div key={note.id} className="history-item">
                          <span>{formatDateTime(note.createdAt)}</span>
                          <p>{note.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="right-rail">
        <section className="panel">
          <p className="eyebrow">New task</p>
          <h3>Submit a job or issue</h3>
          <div className="form-grid">
            <label>
              <span>Title</span>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label className="full">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
            </label>
            <label>
              <span>Due date</span>
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
            <label>
              <span>Priority</span>
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="full">
              <span>Property</span>
              <select value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })}>
                <option value="">Choose property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full">
              <span>Assign to</span>
              <select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>
                <option value="">Choose user</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button className="primary-button wide" type="button" onClick={addTask}>
            <Plus size={16} />
            Create task
          </button>
        </section>

        <section className="panel">
          <p className="eyebrow">History</p>
          <h3>Task archive</h3>
          <div className="mini-list">
            {tasks
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((task) => (
                <article key={task.id} className="mini-list-item">
                  <strong>{task.title}</strong>
                  <span>
                    {task.status} - {formatDate(task.createdAt)}
                  </span>
                </article>
              ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
