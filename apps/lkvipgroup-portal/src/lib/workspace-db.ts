/**
 * workspace-db.ts — Workspace data store cho Admin Portal.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * V2: Migrated từ JSON flat-file sang PostgreSQL via Prisma (fortress-client).
 * Giữ nguyên toàn bộ function signatures; tất cả functions giờ là async.
 * API routes không thay đổi contract — chỉ cần thêm await ở caller.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from "./db";

export type TaskStatus   = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type SprintStatus = "active" | "completed" | "cancelled";

// ── Re-export types matching Prisma model shape ───────────────────────────────

export interface WorkspaceSprint {
  id:        number;
  name:      string;
  project:   string;
  startDate: string;
  endDate:   string;
  goal:      string | null;
  status:    SprintStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceTask {
  id:           number;
  title:        string;
  description:  string | null;
  project:      string;
  status:       TaskStatus;
  priority:     TaskPriority;
  assigneeId:   number | null;
  assigneeName: string | null;
  sprintId:     number | null;
  dueDate:      string | null;
  completedAt:  Date | null;
  completedBy:  number | null;
  tags:         string[];
  result:       string | null;
  createdBy:    number | null;
  createdAt:    Date;
  updatedAt:    Date;
}

export interface WorkspaceComment {
  id:         number;
  taskId:     number;
  authorId:   number | null;
  authorName: string | null;
  content:    string;
  createdAt:  Date;
  updatedAt:  Date;
}

// ── Sprints ───────────────────────────────────────────────────────────────────

export async function listSprints(
  statusFilter?: string,
): Promise<(WorkspaceSprint & { taskStats: { total: number; done: number; progress: number } })[]> {
  const where = statusFilter ? { status: statusFilter } : {};
  const sprints = await prisma.workspaceSprint.findMany({
    where,
    orderBy: { id: "desc" },
    include: {
      tasks: {
        where: { status: { not: "cancelled" } },
        select: { id: true, status: true },
      },
    },
  });

  return sprints.map((sprint) => {
    const { tasks, ...rest } = sprint;
    const total    = tasks.length;
    const done     = tasks.filter((t) => t.status === "done").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...(rest as unknown as WorkspaceSprint), taskStats: { total, done, progress } };
  });
}

export async function createSprint(data: {
  name: string;
  project?: string;
  startDate: string;
  endDate: string;
  goal?: string;
}): Promise<WorkspaceSprint> {
  const sprint = await prisma.workspaceSprint.create({
    data: {
      name:      data.name,
      project:   data.project   ?? "all",
      startDate: data.startDate,
      endDate:   data.endDate,
      goal:      data.goal      ?? null,
      status:    "active",
    },
  });
  return sprint as unknown as WorkspaceSprint;
}

export async function updateSprint(
  id: number,
  patch: Partial<WorkspaceSprint>,
): Promise<WorkspaceSprint | null> {
  try {
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = patch as Record<string, unknown>;
    void _id; void _ca; void _ua;
    const updated = await prisma.workspaceSprint.update({ where: { id }, data });
    return updated as unknown as WorkspaceSprint;
  } catch {
    return null;
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function listTasks(opts: {
  status?: string;
  project?: string;
  assigneeId?: number;
  sprintId?: number;
  priority?: string;
  page?: number;
  limit?: number;
}): Promise<{
  tasks: (WorkspaceTask & {
    sprint: WorkspaceSprint | null;
    _count: { comments: number };
  })[];
  total: number;
  page: number;
  limit: number;
}> {
  const where: Record<string, unknown> = {};
  if (opts.status)     where.status     = opts.status;
  if (opts.project)    where.project    = opts.project;
  if (opts.assigneeId) where.assigneeId = opts.assigneeId;
  if (opts.sprintId)   where.sprintId   = opts.sprintId;
  if (opts.priority)   where.priority   = opts.priority;

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const page  = opts.page  ?? 1;
  const limit = opts.limit ?? 50;

  const [total, rows] = await Promise.all([
    prisma.workspaceTask.count({ where }),
    prisma.workspaceTask.findMany({
      where,
      include: {
        sprint:   true,
        comments: { select: { id: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Sort: priority → dueDate → id desc (matches original logic)
  const sorted = [...rows].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 4;
    const pb = PRIORITY_ORDER[b.priority] ?? 4;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.id - a.id;
  });

  const tasks = sorted.map(({ comments, sprint, ...t }) => ({
    ...(t as unknown as WorkspaceTask),
    sprint:  sprint as unknown as WorkspaceSprint | null,
    _count:  { comments: comments.length },
  }));

  return { tasks, total, page, limit };
}

export async function getTask(
  id: number,
): Promise<(WorkspaceTask & { sprint: WorkspaceSprint | null; comments: WorkspaceComment[] }) | null> {
  const task = await prisma.workspaceTask.findUnique({
    where: { id },
    include: {
      sprint:   true,
      comments: { orderBy: { id: "asc" } },
    },
  });
  if (!task) return null;
  const { sprint, comments, ...rest } = task;
  return {
    ...(rest as unknown as WorkspaceTask),
    sprint:   sprint as unknown as WorkspaceSprint | null,
    comments: comments as unknown as WorkspaceComment[],
  };
}

export async function createTask(data: {
  title: string;
  description?: string;
  project?: string;
  priority?: string;
  assigneeId?: number;
  assigneeName?: string;
  sprintId?: number;
  dueDate?: string;
  tags?: string[];
  createdBy?: number | null;
}): Promise<WorkspaceTask> {
  const task = await prisma.workspaceTask.create({
    data: {
      title:        data.title,
      description:  data.description  ?? null,
      project:      data.project      ?? "hub",
      status:       "todo",
      priority:     (data.priority    ?? "medium") as TaskPriority,
      assigneeId:   data.assigneeId   ?? null,
      assigneeName: data.assigneeName ?? null,
      sprintId:     data.sprintId     ?? null,
      dueDate:      data.dueDate      ?? null,
      tags:         data.tags         ?? [],
      createdBy:    data.createdBy    ?? null,
    },
  });
  return task as unknown as WorkspaceTask;
}

export async function updateTask(
  id: number,
  patch: Partial<WorkspaceTask & { actorId?: number }>,
): Promise<WorkspaceTask | null> {
  const current = await prisma.workspaceTask.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current) return null;

  const { actorId, id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = patch as Record<string, unknown>;

  const data: Record<string, unknown> = { ...rest };

  // completedAt logic (mirrors original)
  if (patch.status === "done" && current.status !== "done") {
    data.completedAt = new Date();
    data.completedBy = actorId ?? null;
  } else if (patch.status && patch.status !== "done" && current.status === "done") {
    data.completedAt = null;
    data.completedBy = null;
  }

  // Remove non-schema keys
  delete data.id; delete data.createdAt; delete data.updatedAt; delete data.actorId;

  const updated = await prisma.workspaceTask.update({ where: { id }, data });
  return updated as unknown as WorkspaceTask;
}

export async function deleteTask(id: number): Promise<boolean> {
  try {
    await prisma.workspaceTask.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function addComment(
  taskId: number,
  content: string,
  authorId?: number,
  authorName?: string,
): Promise<WorkspaceComment> {
  const comment = await prisma.workspaceComment.create({
    data: {
      taskId,
      content,
      authorId:   authorId   ?? null,
      authorName: authorName ?? null,
    },
  });
  return comment as unknown as WorkspaceComment;
}

export async function deleteComment(commentId: number): Promise<boolean> {
  try {
    await prisma.workspaceComment.delete({ where: { id: commentId } });
    return true;
  } catch {
    return false;
  }
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const nowTs  = new Date();
  const soonTs = new Date(nowTs.getTime() + 2 * 86400000);

  const [allTasks, activeSprint, velocity] = await Promise.all([
    prisma.workspaceTask.findMany({
      where: { status: { not: "cancelled" } },
      select: { id: true, status: true, dueDate: true, completedAt: true, sprintId: true },
    }),
    prisma.workspaceSprint.findFirst({
      where: { status: "active" },
    }),
    // Last 7 days completed tasks (for velocity chart)
    (async () => {
      const days: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(nowTs);
        d.setDate(d.getDate() - i);
        const day    = d.toISOString().slice(0, 10);
        const start  = new Date(`${day}T00:00:00.000Z`);
        const end    = new Date(`${day}T23:59:59.999Z`);
        const count  = await prisma.workspaceTask.count({
          where: { completedAt: { gte: start, lte: end } },
        });
        days.push({ day, count });
      }
      return days;
    })(),
  ]);

  const todo       = allTasks.filter((t) => t.status === "todo").length;
  const inProgress = allTasks.filter((t) => t.status === "in_progress").length;
  const done       = allTasks.filter((t) => t.status === "done").length;
  const overdue    = allTasks.filter((t) =>
    t.status !== "done" && t.dueDate && new Date(t.dueDate) < nowTs,
  ).length;
  const dueSoon    = allTasks.filter((t) =>
    t.status !== "done" && t.dueDate &&
    new Date(t.dueDate) >= nowTs && new Date(t.dueDate) <= soonTs,
  ).length;

  let sprintProgress = null;
  if (activeSprint) {
    const spTasks = allTasks.filter((t) => t.sprintId === activeSprint.id);
    const spTotal = spTasks.length;
    const spDone  = spTasks.filter((t) => t.status === "done").length;
    sprintProgress = {
      sprint: activeSprint,
      total: spTotal,
      done: spDone,
      progress: spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0,
    };
  }

  // Recent 8 completed tasks
  const recentDone = await prisma.workspaceTask.findMany({
    where:   { status: "done", completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take:    8,
  });

  return {
    total: allTasks.length,
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
