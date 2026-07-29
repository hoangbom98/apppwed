'use strict';
/**
 * WorkspaceService — business logic for Team Workspace Tracker.
 * Uses admin_db: WorkspaceTask, WorkspaceSprint, WorkspaceComment, AdminUser.
 */

const { getPrismaClient } = require('../../../shared/config/databases');

function db() {
  return getPrismaClient('admin');
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT
// ─────────────────────────────────────────────────────────────────────────────

exports.listSprints = async ({ status }: { status?: string } = {}) => {
  const admin = db();
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const sprints = await admin.workspaceSprint.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  // Attach task stats per sprint
  const sprintIds = sprints.map((s: { id: number }) => s.id);
  const taskStats = await admin.workspaceTask.groupBy({
    by: ['sprintId', 'status'],
    where: { sprintId: { in: sprintIds } },
    _count: true,
  });

  return sprints.map((sprint: { id: number; [key: string]: unknown }) => {
    const stats = taskStats.filter((t: { sprintId: number }) => t.sprintId === sprint.id);
    const total    = stats.reduce((s: number, t: { _count: number }) => s + t._count, 0);
    const done     = stats.filter((t: { status: string }) => t.status === 'done')
                         .reduce((s: number, t: { _count: number }) => s + t._count, 0);
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...sprint, taskStats: { total, done, progress } };
  });
};

exports.createSprint = async (data: {
  name: string;
  project?: string;
  startDate: string;
  endDate: string;
  goal?: string;
}) => {
  const admin = db();
  return admin.workspaceSprint.create({
    data: {
      name:      data.name,
      project:   data.project ?? 'all',
      startDate: new Date(data.startDate),
      endDate:   new Date(data.endDate),
      goal:      data.goal,
      status:    'active',
    },
  });
};

exports.updateSprint = async (id: number, data: Partial<{
  name: string;
  goal: string;
  status: string;
  endDate: string;
}>) => {
  const admin = db();
  return admin.workspaceSprint.update({
    where: { id },
    data: {
      ...(data.name      && { name: data.name }),
      ...(data.goal      && { goal: data.goal }),
      ...(data.status    && { status: data.status }),
      ...(data.endDate   && { endDate: new Date(data.endDate) }),
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

exports.listTasks = async (opts: {
  status?: string;
  project?: string;
  assigneeId?: number;
  sprintId?: number;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const admin = db();
  const { status, project, assigneeId, sprintId, priority, page = 1, limit = 50 } = opts;
  const where: Record<string, unknown> = {};
  if (status)     where.status     = status;
  if (project)    where.project    = project;
  if (assigneeId) where.assigneeId = Number(assigneeId);
  if (sprintId)   where.sprintId   = Number(sprintId);
  if (priority)   where.priority   = priority;

  const [tasks, total] = await Promise.all([
    admin.workspaceTask.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      skip:  (page - 1) * limit,
      take:  limit,
      include: {
        assignee: { select: { id: true, fullName: true, avatar: true, role: true } },
        sprint:   { select: { id: true, name: true } },
        _count:   { select: { comments: true } },
      },
    }),
    admin.workspaceTask.count({ where }),
  ]);

  return { tasks, total, page, limit };
};

exports.getTask = async (id: number) => {
  const admin = db();
  return admin.workspaceTask.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, fullName: true, avatar: true } },
      sprint:   true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, fullName: true, avatar: true } } },
      },
    },
  });
};

exports.createTask = async (data: {
  title: string;
  description?: string;
  project?: string;
  priority?: string;
  assigneeId?: number;
  sprintId?: number;
  dueDate?: string;
  tags?: string[];
  createdBy?: number;
}) => {
  const admin = db();
  return admin.workspaceTask.create({
    data: {
      title:       data.title,
      description: data.description,
      project:     data.project    ?? 'hub',
      priority:    data.priority   ?? 'medium',
      status:      'todo',
      assigneeId:  data.assigneeId  ? Number(data.assigneeId)  : null,
      sprintId:    data.sprintId    ? Number(data.sprintId)    : null,
      dueDate:     data.dueDate     ? new Date(data.dueDate)   : null,
      tags:        data.tags        ?? [],
      createdBy:   data.createdBy,
    },
    include: {
      assignee: { select: { id: true, fullName: true } },
      sprint:   { select: { id: true, name: true } },
    },
  });
};

exports.updateTask = async (id: number, data: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: number;
  sprintId: number;
  dueDate: string;
  tags: string[];
  result: string;
}>, actorId?: number) => {
  const admin = db();
  const patch: Record<string, unknown> = {};

  if (data.title       !== undefined) patch.title       = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.status      !== undefined) patch.status      = data.status;
  if (data.priority    !== undefined) patch.priority    = data.priority;
  if (data.assigneeId  !== undefined) patch.assigneeId  = data.assigneeId ? Number(data.assigneeId) : null;
  if (data.sprintId    !== undefined) patch.sprintId    = data.sprintId   ? Number(data.sprintId)   : null;
  if (data.dueDate     !== undefined) patch.dueDate     = data.dueDate    ? new Date(data.dueDate)  : null;
  if (data.tags        !== undefined) patch.tags        = data.tags;
  if (data.result      !== undefined) patch.result      = data.result;

  // Auto-set completedAt when status transitions to done
  if (data.status === 'done') {
    patch.completedAt = new Date();
    if (actorId) patch.completedBy = actorId;
  } else if (data.status && data.status !== 'done') {
    patch.completedAt = null;
    patch.completedBy = null;
  }

  return admin.workspaceTask.update({
    where: { id },
    data:  patch,
    include: {
      assignee: { select: { id: true, fullName: true } },
      sprint:   { select: { id: true, name: true } },
      _count:   { select: { comments: true } },
    },
  });
};

exports.deleteTask = async (id: number) => {
  const admin = db();
  return admin.workspaceTask.delete({ where: { id } });
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

exports.addComment = async (taskId: number, content: string, authorId?: number) => {
  const admin = db();
  return admin.workspaceComment.create({
    data: { taskId, content, authorId: authorId ?? null },
    include: { author: { select: { id: true, fullName: true, avatar: true } } },
  });
};

exports.deleteComment = async (commentId: number) => {
  const admin = db();
  return admin.workspaceComment.delete({ where: { id: commentId } });
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

exports.getDashboardStats = async () => {
  const admin = db();

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const soon  = new Date(today.getTime() + 2 * 86400000); // 2 days

  const [total, byStatus, overdue, dueSoon, activeSprint, memberLoad, recentDone] = await Promise.all([
    admin.workspaceTask.count({ where: { status: { not: 'cancelled' } } }),

    admin.workspaceTask.groupBy({
      by: ['status'],
      _count: true,
      where: { status: { not: 'cancelled' } },
    }),

    admin.workspaceTask.count({
      where: { status: { not: 'done' }, status2: undefined, dueDate: { lt: now } },
    }).catch(() =>
      admin.workspaceTask.count({
        where: { status: { notIn: ['done', 'cancelled'] }, dueDate: { lt: now } },
      })
    ),

    admin.workspaceTask.count({
      where: {
        status: { notIn: ['done', 'cancelled'] },
        dueDate: { gte: now, lte: soon },
      },
    }),

    admin.workspaceSprint.findFirst({
      where: { status: 'active' },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { tasks: true } } },
    }),

    admin.workspaceTask.groupBy({
      by: ['assigneeId'],
      _count: true,
      where: { status: 'in_progress', assigneeId: { not: null } },
    }),

    admin.workspaceTask.findMany({
      where: { status: 'done', completedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      orderBy: { completedAt: 'desc' },
      take: 8,
      include: { assignee: { select: { id: true, fullName: true } } },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus as { status: string; _count: number }[]) {
    statusMap[row.status] = row._count;
  }

  let sprintProgress = null;
  if (activeSprint) {
    const tasks = await admin.workspaceTask.groupBy({
      by: ['status'],
      _count: true,
      where: { sprintId: activeSprint.id },
    });
    const spTotal = tasks.reduce((s: number, t: { _count: number }) => s + t._count, 0);
    const spDone  = tasks.filter((t: { status: string }) => t.status === 'done')
                         .reduce((s: number, t: { _count: number }) => s + t._count, 0);
    sprintProgress = {
      sprint:   activeSprint,
      total:    spTotal,
      done:     spDone,
      progress: spTotal > 0 ? Math.round((spDone / spTotal) * 100) : 0,
    };
  }

  return {
    total,
    todo:        statusMap['todo']        ?? 0,
    inProgress:  statusMap['in_progress'] ?? 0,
    done:        statusMap['done']        ?? 0,
    overdue,
    dueSoon,
    sprintProgress,
    memberLoad,
    recentDone,
  };
};
