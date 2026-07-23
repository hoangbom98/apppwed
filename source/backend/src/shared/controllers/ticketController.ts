/**
 * TicketController — REST handlers for support tickets.
 *
 * Routes (mounted via support.routes.js):
 *   POST /support/tickets              — create ticket
 *   GET  /support/tickets              — list user's tickets
 *   GET  /support/tickets/:id          — get ticket detail
 *   POST /support/tickets/:id/reply    — add a reply
 *   PUT  /support/tickets/:id/status   — update status (agent/admin)
 *   GET  /support/admin/tickets        — admin: all tickets
 */
const ticketService = require('../services/ticketService');
const { success, created, error, notFound, forbidden, paginate } = require('../utils/response');

/**
 * POST /support/tickets
 * Create a new support ticket. Body: { subject, description, category?, priority? }
 */
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject) return error(res, 'subject is required', 422);
    if (!description) return error(res, 'description is required', 422);

    const ticket = await ticketService.createTicket(req.prisma, req.user.id, {
      subject,
      description,
      category,
      priority,
    });
    return created(res, ticket, 'Ticket created');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/tickets
 * List tickets for the authenticated user. Query: { status, page, limit }
 */
exports.getTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await ticketService.getTickets(req.prisma, req.user.id, {
      status,
      page: Number(page),
      limit: Number(limit),
    });
    return paginate(res, result.tickets, {
      page: result.page,
      limit: Number(limit),
      total: result.total,
      pages: result.pages,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/tickets/:id
 * Get a single ticket. Agents/admins may view any ticket; users only their own.
 */
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const isAgentOrAdmin =
      req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      req.user.role === 'agent';

    // Pass userId=null for agents so the service skips the ownership check
    const userId = isAgentOrAdmin ? null : req.user.id;

    const ticket = await ticketService.getTicketById(req.prisma, id, userId);
    return success(res, ticket);
  } catch (err) {
    if (err.message === 'Ticket not found') return notFound(res, err.message);
    if (err.message === 'Access denied') return forbidden(res, err.message);
    return error(res, err.message);
  }
};

/**
 * POST /support/tickets/:id/reply
 * Add a reply to a ticket. Body: { content, isInternal?, attachments? }
 */
exports.addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal, attachments } = req.body;
    if (!content) return error(res, 'content is required', 422);

    const reply = await ticketService.addReply(req.prisma, id, req.user.id, {
      content,
      isInternal,
      attachments,
    });
    return created(res, reply, 'Reply added');
  } catch (err) {
    if (err.message === 'Ticket not found') return notFound(res, err.message);
    return error(res, err.message);
  }
};

/**
 * PUT /support/tickets/:id/status
 * Update ticket status. Agent/admin only. Body: { status }
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return error(res, 'status is required', 422);

    const ticket = await ticketService.updateStatus(req.prisma, id, req.user.id, status);
    return success(res, ticket, 'Status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /support/admin/tickets
 * Admin: paginated list of all tickets. Query: { status, category, page, limit }
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const result = await ticketService.getAllTickets(req.prisma, {
      status,
      category,
      page: Number(page),
      limit: Number(limit),
    });
    return paginate(res, result.tickets, {
      page: result.page,
      limit: Number(limit),
      total: result.total,
      pages: result.pages,
    });
  } catch (err) {
    return error(res, err.message);
  }
};
