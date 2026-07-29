/**
 * workspace-db.ts — Lightweight workspace data store for the Admin Portal.
 *
 * Strategy: JSON flat-file stored in /tmp/workspace-data.json (serverless-friendly)
 * with an in-memory cache. This avoids adding a second Prisma client to the portal
 * while keeping the feature fully self-contained until a proper DB migration is done.
 *
 * All IDs are numeric auto-increment (simulated).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), ".workspace-data.json");

export type TaskStatus   = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type SprintStatus = "active" | "completed" | "cancelled";

export interface WorkspaceSprint {
  id:        number;
  name:      string;
  project:   string;
  startDate: string;
  endDate:   string;
  goal:      string | null;
  status:    SprintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTask {
  id:          number;
  title:       string;
  description: string | null;
  project:     string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assigneeId:  number | null;
  assigneeName: string | null;
  sprintId:    number | null;
  dueDate:     string | null;
  completedAt: string | null;
  completedBy: number | null;
  tags:        string[];
  result:      string | null;
  createdBy:   number | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface WorkspaceComment {
  id:         number;
  taskId:     number;
  authorId:   number | null;
  authorName: string | null;
  content:    string;
  createdAt:  string;
  updatedAt:  string;
}

interface Store {
  sprintSeq:  number;
  taskSeq:    number;
  commentSeq: number;
  sprints:    WorkspaceSprint[];
  tasks:      WorkspaceTask[];
  comments:   WorkspaceComment[];
}

// ── Persistence ───────────────────────────────────────────────────────────────

let _cache: Store | null = null;

function load(): Store {
  if (_cache) return _cache;
  if (existsSync(DATA_PATH)) {
    try {
      _cache = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as Store;
      return _cache;
    } catch { /* fall through */ }
  }
  _cache = { sprintSeq: 0, taskSeq: 0, commentSeq: 0, sprints: [], tasks: [], comments: [] };
  return _cache;
}

function save(store: Store) {
  _cache = store;
  try { writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8"); } catch { /* ignore */ }
}

function now() { return new Date().toISOString(); }

// ── Sprints ───────────────────────────────────────────────────────────────────

export function listSprints(statusFilter?: string): (WorkspaceSprint & { taskStats: { total: number; done: number; progress: number } })[] {
  const store = load();
  const sprints = statusFilter ? store.sprints.filter((s) => s.status === statusFilter) : store.sprints;
  return sprints
    .sort((a, b) => b.id - a.id)
    .map((sprint) => {
      const tasks  = store.tasks.filter((t) => t.sprintId === sprint.id && t.status !== "cancelled");
      const total  = tasks.length;
      const done   = tasks.filter((t) => t.status === "done").length;
      return { ...sprint, taskStats: { total, done, progress: total > 0 ? Math.round((done / total) * 100) : 0 } };
    });
}

export function createSprint(data: { name: string; project?: string; startDate: string; endDate: string; goal?: string }): WorkspaceSprint {
  const store = load();
  const sprint: WorkspaceSprint = {
    id:        ++store.sprintSeq,
    name:      data.name,
    project:   data.project ?? "all",
    startDate: data.startDate,
    endDate:   data.endDate,
    goal:      data.goal ?? null,
    status:    "active",
    createdAt: now(),
    updatedAt: now(),
  };
  store.sprints.push(sprint);
  save(store);
  return sprint;
}

export function updateSprint(id: number, patch: Partial<WorkspaceSprint>): WorkspaceSprint | null {
  const store = load();
  const idx = store.sprints.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.sprints[idx] = { ...store.sprints[idx], ...patch, updatedAt: now() };
  save(store);
  return store.sprints[idx];
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function listTasks(opts: {
  status?: string; project?: string; assigneeId?: number;
  sprintId?: number; priority?: string; page?: number; limit?: number;
}) {
  const store = load();
  let tasks = [...store.tasks];

  if (opts.status)     tasks = tasks.filter((t) => t.status     === opts.status);
  if (opts.project)    tasks = tasks.filter((t) => t.project    === opts.project);
  if (opts.assigneeId) tasks = tasks.filter((t) => t.assigneeId === opts.assigneeId);
  if (opts.sprintId)   tasks = tasks.filter((t) => t.sprintId   === opts.sprintId);
  if (opts.priority)   tasks = tasks.filter((t) => t.priority   === opts.priority);

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4;
    const pb = PRIORITY_ORDER[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.id - a.id;
  });

  const page  = opts.page  ?? 1;
  const limit = opts.limit ?? 50;
  const total = tasks.length;
  const paged = tasks.slice((page - 1) * limit, page * limit);

  // Attach comment count
  const tasksWithCount = paged.map((t) => ({
    ...t,
    sprint: t.sprintId ? store.sprints.find((s) => s.id === t.sprintId) ?? null : null,
    _count: { comments: store.comments.filter((c) => c.taskId === t.id).length },
  }));

  return { tasks: tasksWithCount, total, page, limit };
}

export function getTask(id: number): (WorkspaceTask & { sprint: WorkspaceSprint | null; comments: WorkspaceComment[] }) | null {
  const store = load();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return null;
  return {
    ...task,
    sprint:   task.sprintId ? store.sprints.find((s) => s.id === task.sprintId) ?? null : null,
    comments: store.comments.filter((c) => c.taskId === id).sort((a, b) => a.id - b.id),
  };
}

export function createTask(data: {
  title: string; description?: string; project?: string; priority?: string;
  assigneeId?: number; assigneeName?: string; sprintId?: number; dueDate?: string;
  tags?: string[]; createdBy?: number;
}): WorkspaceTask {
  const store = load();
  const task: WorkspaceTask = {
    id:          ++store.taskSeq,
    title:       data.title,
    description: data.description ?? null,
    project:     data.project     ?? "hub",
    status:      "todo",
    priority:    (data.priority   ?? "medium") as TaskPriority,
    assigneeId:  data.assigneeId  ?? null,
    assigneeName: data.assigneeName ?? null,
    sprintId:    data.sprintId    ?? null,
    dueDate:     data.dueDate     ?? null,
    completedAt: null,
    completedBy: null,
    tags:        data.tags        ?? [],
    result:      null,
    createdBy:   data.createdBy   ?? null,
    createdAt:   now(),
    updatedAt:   now(),
  };
  store.tasks.push(task);
  save(store);
  return task;
}

export function updateTask(id: number, patch: Partial<WorkspaceTask & { actorId?: number }>): WorkspaceTask | null {
  const store = load();
  const idx = store.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = store.tasks[idx];
  const updated: WorkspaceTask = { ...current, ...patch, id: current.id, updatedAt: now() };

  if (patch.status === "done" && current.status !== "done") {
    updated.completedAt = now();
    updated.completedBy = patch.actorId ?? null;
  } else if (patch.status && patch.status !== "done" && current.status === "done") {
    updated.completedAt = null;
    updated.completedBy = null;
  }

  store.tasks[idx] = updated;
  save(store);
  return updated;
}

export function deleteTask(id: number): boolean {
  const store = load();
  const before = store.tasks.length;
  store.tasks    = store.tasks.filter((t) => t.id !== id);
  store.comments = store.comments.filter((c) => c.taskId !== id);
  save(store);
  return store.tasks.length < before;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function addComment(taskId: number, content: string, authorId?: number, authorName?: string): WorkspaceComment {
  const store = load();
  const comment: WorkspaceComment = {
    id:         ++store.commentSeq,
    taskId,
    authorId:   authorId   ?? null,
    authorName: authorName ?? null,
    content,
    createdAt:  now(),
    updatedAt:  now(),
  };
  store.comments.push(comment);
  save(store);
  return comment;
}

export function deleteComment(commentId: number): boolean {
  const store = load();
  const before = store.comments.length;
  store.comments = store.comments.filter((c) => c.id !== commentId);
  save(store);
  return store.comments.length < before;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export function getDashboardStats() {
  const store   = load();
  const tasks   = store.tasks.filter((t) => t.status !== "cancelled");
  const nowTs   = new Date();
  const soonTs  = new Date(nowTs.getTime() + 2 * 86400000);

  const todo       = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done       = tasks.filter((t) => t.status === "done").length;
  const overdue    = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < nowTs).length;
  const dueSoon    = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) >= nowTs && new Date(t.dueDate) <= soonTs).length;

  const activeSprint = store.sprints.find((s) => s.status === "active") ?? null;
  let sprintProgress = null;
  if (activeSprint) {
    const spTasks  = store.tasks.filter((t) => t.sprintId === activeSprint.id && t.status !== "cancelled");
    const spTotal  = spTasks.length;
    const spDone   = spTasks.filter((t) => t.status === "done").length;
    sprintProgress = { sprint: activeSprint, total: spTotal, done: spDone, progress: spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0 };
  }

  const recentDone = tasks
    .filter((t) => t.status === "done" && t.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 8);

  // Task velocity last 7 days
  const velocity: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowTs);
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const count = tasks.filter((t) => t.completedAt && t.completedAt.startsWith(day)).length;
    velocity.push({ day, count });
  }

  return {
    total: tasks.length,
    todo,
    inProgress,
    done,
    overdue,
    dueSoon,
    sprintProgress,
    recentDone,
    velocity,
  };
}
