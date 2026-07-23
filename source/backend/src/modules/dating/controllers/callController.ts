// @ts-nocheck
'use strict';
/**
 * dating/controllers/callController.js
 *
 * Call model (@@map "calls"):
 *   id(cuid), callerId(cuid), calleeId(cuid), type(video|audio),
 *   status(ringing|ongoing|ended|missed|rejected),
 *   durationMin(Decimal? minutes), cost(Decimal?), startedAt, endedAt
 *
 * All IDs are CUID strings — never coerce with +id.
 */
const { ok, created, error, notFound } = require('../../../shared/utils/response');
const CallService = require('../services/callService');

/**
 * POST /dating/calls/request
 * Body: { receiverId, type: 'video'|'audio' }
 * Initiates a call request and returns ICE/TURN server credentials.
 */
exports.requestCall = async (req, res) => {
  try {
    const { receiverId, type = 'video' } = req.body;
    if (!receiverId) return error(res, 'receiverId is required', 400);

    // Create a ringing call record — calleeId is the correct schema field
    const call = await req.prisma.call.create({
      data: {
        callerId:  req.user.id,
        calleeId:  String(receiverId),   // CUID string — never parseInt
        type,
        status:    'ringing',
        startedAt: new Date(),
      },
    });

    // Return TURN/STUN config from env
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      ...(process.env.TURN_SERVER ? [{
        urls:       process.env.TURN_SERVER,
        username:   process.env.TURN_USER  || '',
        credential: process.env.TURN_CRED  || '',
      }] : []),
    ];

    return created(res, { call, iceServers }, 'Call initiated');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * POST /dating/calls/:id/answer
 * Body: { accepted: true|false }
 */
exports.answerCall = async (req, res) => {
  try {
    const callId   = String(req.params.id); // CUID — no parseInt
    const accepted = req.body.accepted !== false;

    const call = await req.prisma.call.findUnique({ where: { id: callId } });
    if (!call) return notFound(res, 'Call not found');
    if (call.calleeId !== req.user.id) return error(res, 'Forbidden', 403);

    const updated = await req.prisma.call.update({
      where: { id: callId },
      data:  { status: accepted ? 'ongoing' : 'rejected' }, // schema: rejected (not declined)
    });
    return ok(res, updated, accepted ? 'Call accepted' : 'Call rejected');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * POST /dating/calls/:id/end
 * Ends an ongoing call and records duration in minutes.
 */
exports.endCall = async (req, res) => {
  try {
    const callId = String(req.params.id); // CUID — no parseInt
    const call   = await req.prisma.call.findUnique({ where: { id: callId } });
    if (!call) return notFound(res, 'Call not found');
    if (call.callerId !== req.user.id && call.calleeId !== req.user.id) {
      return error(res, 'Forbidden', 403);
    }

    const endedAt     = new Date();
    // durationMin is in minutes (Decimal) — schema: durationMin not duration
    const durationMin = call.startedAt
      ? parseFloat(((endedAt - new Date(call.startedAt)) / 60000).toFixed(2))
      : 0;

    const updated = await req.prisma.call.update({
      where: { id: callId },
      data:  { status: 'ended', endedAt, durationMin },
    });
    return ok(res, updated, 'Call ended');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * GET /dating/calls/history
 * Returns the authenticated user's call history.
 */
exports.getHistory = async (req, res) => {
  try {
    const service = new CallService(req.prisma);
    const calls   = await service.getCallHistory(req.user.id);
    return ok(res, calls);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
