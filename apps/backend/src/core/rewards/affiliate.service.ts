// @ts-nocheck
/**
 * core/rewards/affiliate.service.ts
 *
 * Affiliate marketing system — tracking links, conversions, and commissions.
 * Supports all 5 sub-projects via the shared admin_db Affiliate + AffiliateConversion tables.
 *
 * Schema required (admin_db):
 *   Affiliate           { id, userId, project, trackingId, status, commissionRate, website, socialMedia, approvedAt, ... }
 *   AffiliateConversion { id, affiliateId, userId, project, amount, commission, action, status, ... }
 *   AffiliateClick      { id, affiliateId, ip, ua, createdAt }
 *
 * Usage:
 *   const { AffiliateService } = require('../../core/rewards/affiliate.service');
 *   const svc = new AffiliateService(adminPrisma, 'game');
 *   await svc.registerAffiliate(userId, { website: 'https://...' });
 */
'use strict';

const crypto       = require('crypto');
const logger       = require('../../shared/services/logger');
const auditService = require('../../shared/services/auditService');
const { RewardService } = require('./reward.service');
const { eventBus, EVENTS } = require('../events/event-bus');

const DEFAULT_COMMISSION_RATE = 0.10; // 10%
const BASE_URL = process.env.BASE_URL || 'https://lkvip.group';

class AffiliateService {
  /**
   * @param {object} adminPrisma – admin_db Prisma client
   * @param {string} projectCode – 'game' | 'sports' | 'trade' | 'dating' | 'hub'
   */
  constructor(adminPrisma, projectCode) {
    this.prisma       = adminPrisma;
    this.projectCode  = projectCode;
    this.rewardSvc    = new RewardService(adminPrisma, projectCode);
  }

  // ── Registration & Approval ───────────────────────────────────────────────

  /**
   * Apply to become an affiliate.
   * @param {string} userId
   * @param {{ website?: string, socialMedia?: string, notes?: string }} data
   */
  async registerAffiliate(userId, data = {}) {
    const existing = await this.prisma.affiliate.findFirst({
      where: { userId, project: this.projectCode },
    });
    if (existing) return existing;

    const affiliate = await this.prisma.affiliate.create({
      data: {
        userId,
        project:     this.projectCode,
        status:      'PENDING',
        trackingId:  this._generateTrackingId(userId),
        website:     data.website     || null,
        socialMedia: data.socialMedia || null,
        notes:       data.notes       || null,
      },
    });

    logger.info(`[Affiliate] registered userId=${userId} project=${this.projectCode}`);
    return affiliate;
  }

  /**
   * Admin: approve an affiliate application.
   * @param {string} affiliateId
   * @param {number} [commissionRate=0.10]
   */
  async approveAffiliate(affiliateId, commissionRate = DEFAULT_COMMISSION_RATE) {
    const affiliate = await this.prisma.affiliate.update({
      where: { id: affiliateId },
      data:  {
        status:         'ACTIVE',
        commissionRate,
        approvedAt:     new Date(),
      },
    });

    await auditService.log({
      action:  'affiliate.approved',
      userId:  affiliate.userId,
      project: this.projectCode,
      meta:    { affiliateId, commissionRate },
    });

    return affiliate;
  }

  /**
   * Admin: reject an affiliate application.
   * @param {string} affiliateId
   * @param {string} reason
   */
  async rejectAffiliate(affiliateId, reason = '') {
    return this.prisma.affiliate.update({
      where: { id: affiliateId },
      data:  { status: 'REJECTED', notes: reason },
    });
  }

  // ── Link generation & click tracking ────────────────────────────────────

  /**
   * Generate a personalised affiliate tracking link.
   * @param {string}  affiliateId – tracking ID (the short code, not the record ID)
   * @param {string}  [campaign]  – optional UTM campaign tag
   * @returns {string}
   */
  generateLink(affiliateId, campaign) {
    const params = new URLSearchParams({ ref: affiliateId });
    if (campaign) params.set('utm_campaign', campaign);
    return `${BASE_URL}/${this.projectCode}?${params.toString()}`;
  }

  /**
   * Record a click on an affiliate link (fire-and-forget).
   * @param {string} trackingId
   * @param {string} [ip]
   * @param {string} [userAgent]
   */
  async recordClick(trackingId, ip, userAgent) {
    try {
      const affiliate = await this.prisma.affiliate.findFirst({
        where: { trackingId, project: this.projectCode, status: 'ACTIVE' },
      });
      if (!affiliate) return;
      await this.prisma.affiliateClick.create({
        data: { affiliateId: affiliate.id, ip: ip || null, ua: userAgent || null },
      });
    } catch (e) {
      logger.error(`[Affiliate] recordClick error: ${e.message}`);
    }
  }

  // ── Conversion processing ────────────────────────────────────────────────

  /**
   * Record and credit a conversion event (deposit / bet / subscription / trade).
   *
   * @param {object} opts
   * @param {string} opts.trackingId   – the ref= param from the affiliate link
   * @param {string} opts.userId       – the converting user's ID
   * @param {number} opts.amount       – gross transaction amount
   * @param {string} opts.action       – 'DEPOSIT' | 'BET' | 'TRADE' | 'SUBSCRIPTION'
   */
  async processConversion({ trackingId, userId, amount, action }) {
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { trackingId, project: this.projectCode, status: 'ACTIVE' },
    });
    if (!affiliate) return null;

    // Prevent duplicate conversion for the same user + action
    const existing = await this.prisma.affiliateConversion.findFirst({
      where: { affiliateId: affiliate.id, userId, action },
    });
    if (existing) return existing;

    const commission = parseFloat((amount * Number(affiliate.commissionRate)).toFixed(2));

    const conversion = await this.prisma.affiliateConversion.create({
      data: {
        affiliateId: affiliate.id,
        userId,
        project:     this.projectCode,
        amount,
        commission,
        action,
        status:      'PENDING',
      },
    });

    // Credit commission to affiliate immediately (mark COMPLETED)
    await this.rewardSvc.giveReward(
      affiliate.userId,
      commission,
      'AFFILIATE_COMMISSION',
      `Hoa hồng affiliate — ${action} (${this.projectCode})`,
    );

    await this.prisma.affiliateConversion.update({
      where: { id: conversion.id },
      data:  { status: 'COMPLETED' },
    });

    eventBus.emit(EVENTS.AFFILIATE_CONVERSION, {
      affiliateId:    affiliate.id,
      affiliateUserId: affiliate.userId,
      userId,
      project:        this.projectCode,
      amount,
      commission,
      action,
    });

    logger.info(
      `[Affiliate] conversion affiliateId=${affiliate.id} userId=${userId} action=${action} commission=${commission}`,
    );

    return conversion;
  }

  // ── Stats & reporting ────────────────────────────────────────────────────

  /**
   * Aggregate stats for an affiliate user.
   * @param {string} userId
   */
  async getStats(userId) {
    const affiliate = await this.prisma.affiliate.findFirst({
      where: { userId, project: this.projectCode },
    });
    if (!affiliate) return null;

    const [clicks, conversions] = await Promise.all([
      this.prisma.affiliateClick.count({ where: { affiliateId: affiliate.id } }),
      this.prisma.affiliateConversion.aggregate({
        where: { affiliateId: affiliate.id },
        _sum:   { commission: true },
        _count: true,
      }),
    ]);

    return {
      affiliate: {
        id:             affiliate.id,
        trackingId:     affiliate.trackingId,
        status:         affiliate.status,
        commissionRate: affiliate.commissionRate,
        link:           this.generateLink(affiliate.trackingId),
      },
      stats: {
        totalClicks:       clicks,
        totalConversions:  conversions._count,
        totalEarned:       Number(conversions._sum?.commission ?? 0),
      },
    };
  }

  /**
   * Admin: list all affiliates for this project (paginated).
   * @param {{ skip?: number, take?: number, status?: string }} opts
   */
  async adminList({ skip = 0, take = 50, status } = {}) {
    const where = { project: this.projectCode };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.affiliate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      this.prisma.affiliate.count({ where }),
    ]);
    return { data, total };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _generateTrackingId(userId) {
    const prefix = this.projectCode.toUpperCase().slice(0, 3);
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}_${random}`;
  }
}

module.exports = { AffiliateService };
