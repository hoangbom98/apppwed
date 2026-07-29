'use strict';
/**
 * WorkspaceController — REST handlers for Team Workspace Tracker.
 * All routes: /api/admin/workspace/*  (auth + adminGuard required)
 */

const { success, error, paginate } = require('../../../shared/utils/network/response');
const ws = require('../services/workspaceService');

// ── Sprints ──────────────────────────────────────────────────────────────────

exports.listSprints = async (req: any, res: any) => {
  try {
    const data = await ws.listSprints({ status: req.query.status });
    return success(res, data);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.createSprint = async (req: any, res: any) => {
  try {
    const { name, project, startDate, endDate, goal } = req.body;
    if (!name || !startDate || !endDate) return error(res, 'name, startDate, endDate are required', 400);
    const sprint = await ws.createSprint({ name, project, startDate, endDate, goal });
    return success(res, sprint, 'Sprint created', 201);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.updateSprint = async (req: any, res: any) => {
  try {
    const sprint = await ws.updateSprint(Number(req.params.id), req.body);
    return success(res, sprint);
  } catch (err: any) { return error(res, err.message, 500); }
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

exports.listTasks = async (req: any, res: any) => {
  try {
    const { status, project, assigneeId, sprintId, priority, page, limit } = req.query;
    const result = await ws.listTasks({
      status,
      project,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
      sprintId:   sprintId   ? Number(sprintId)   : undefined,
      priority,
      page:  Number(page)  || 1,
      limit: Number(limit) || 50,
    });
    return paginate(res, result.tasks, { total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.getTask = async (req: any, res: any) => {
  try {
    const task = await ws.getTask(Number(req.params.id));
    if (!task) return error(res, 'Task not found', 404);
    return success(res, task);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.createTask = async (req: any, res: any) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return error(res, 'title is required', 400);
    const task = await ws.createTask({ ...req.body, createdBy: req.user?.id });
    return success(res, task, 'Task created', 201);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.updateTask = async (req: any, res: any) => {
  try {
    const task = await ws.updateTask(Number(req.params.id), req.body, req.user?.id);
    return success(res, task);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.deleteTask = async (req: any, res: any) => {
  try {
    await ws.deleteTask(Number(req.params.id));
    return success(res, null, 'Task deleted');
  } catch (err: any) { return error(res, err.message, 500); }
};

// ── Comments ──────────────────────────────────────────────────────────────────

exports.addComment = async (req: any, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return error(res, 'content is required', 400);
    const comment = await ws.addComment(Number(req.params.id), content, req.user?.id);
    return success(res, comment, 'Comment added', 201);
  } catch (err: any) { return error(res, err.message, 500); }
};

exports.deleteComment = async (req: any, res: any) => {
  try {
    await ws.deleteComment(Number(req.params.commentId));
    return success(res, null, 'Comment deleted');
  } catch (err: any) { return error(res, err.message, 500); }
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────

exports.getStats = async (_req: any, res: any) => {
  try {
    const stats = await ws.getDashboardStats();
    return success(res, stats);
  } catch (err: any) { return error(res, err.message, 500); }
};
