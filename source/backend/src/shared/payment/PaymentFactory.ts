// @ts-nocheck
'use strict';
/**
 * PaymentFactory — Central registry and instantiator for payment adapters.
 *
 * Usage:
 *   const factory = new PaymentFactory(prisma);
 *   const adapter = await factory.getAdapter('usdt');
 *   const instructions = await adapter.createDeposit(order);
 *
 * To register a new gateway:
 *   1. Write a class that extends BasePaymentAdapter
 *   2. Place it in ./adapters/YourAdapter.js
 *   3. Add an entry to ADAPTER_MAP below
 *   4. Insert a row into the PaymentGateway table (DB + seed)
 *
 * The factory reads the gateway record from DB every call (or from cache),
 * so admin config changes (API key, address, status) take effect immediately.
 */

const LKvipAdapter  = require('./adapters/LKvipAdapter');
const USDTAdapter   = require('./adapters/USDTAdapter');
const OKPayAdapter  = require('./adapters/OKPayAdapter');
const MomoAdapter   = require('./adapters/MomoAdapter');
const GoPayAdapter  = require('./adapters/GoPayAdapter');
const Pay818Adapter = require('./adapters/Pay818Adapter');

// ── Registry: gateway code → adapter class ───────────────────────────────────
const ADAPTER_MAP = {
  lkvip:   LKvipAdapter,
  usdt:    USDTAdapter,
  okpay:   OKPayAdapter,
  momo:    MomoAdapter,
  gopay:   GoPayAdapter,
  '818pay': Pay818Adapter,
  // Add new gateways here:
  // zalopay: ZaloPayAdapter,
  // vnpay:   VNPayAdapter,
};

class PaymentFactory {
  /**
   * @param {object} prisma  – Prisma client that has access to PaymentGateway model
   *                           (typically the admin_db client or the module's own client
   *                            if it holds the PaymentGateway table)
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ── getAdapter ───────────────────────────────────────────────────────────

  /**
   * Load gateway config from DB and return an instantiated adapter.
   *
   * @param {string} gatewayCode  – e.g. 'lkvip', 'usdt', 'momo'
   * @param {object} [modulePrisma] – Optional separate Prisma client for the adapter
   *                                  (e.g. game_db for lkvip transactions).
   *                                  Falls back to this.prisma.
   * @throws {Error} if gateway not found, not active, or not implemented
   */
  async getAdapter(gatewayCode, modulePrisma) {
    const code = gatewayCode?.toLowerCase?.();

    // Check implementation exists first (cheap check)
    const AdapterClass = ADAPTER_MAP[code];
    if (!AdapterClass) {
      throw new Error(`Payment gateway '${code}' is not implemented. Available: ${Object.keys(ADAPTER_MAP).join(', ')}`);
    }

    // Load gateway record from DB
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { code },
    });

    if (!gateway) {
      throw new Error(`Payment gateway '${code}' not found in database. Run seed or add via Admin.`);
    }

    if (gateway.status !== 'active') {
      throw new Error(`Payment gateway '${code}' is currently ${gateway.status}.`);
    }

    return new AdapterClass(gateway, modulePrisma ?? this.prisma);
  }

  // ── Convenience queries ───────────────────────────────────────────────────

  /**
   * List all active gateways (public info — no sensitive config fields).
   * @returns {Promise<Array>}
   */
  async getActiveGateways() {
    return this.prisma.paymentGateway.findMany({
      where:   { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id:        true,
        code:      true,
        name:      true,
        type:      true,
        limits:    true,
        // fees excluded to keep it simple for frontend — expose only what's needed
      },
    });
  }

  /**
   * List all gateways (admin — includes status, fees, limits, config masked).
   */
  async getAllGateways() {
    const gateways = await this.prisma.paymentGateway.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Mask sensitive config values (api keys, secrets)
    return gateways.map(gw => ({
      ...gw,
      config: gw.config ? this._maskConfig(gw.config) : null,
    }));
  }

  /**
   * Toggle gateway status between 'active' and 'inactive'.
   * @param {string} code
   */
  async toggleStatus(code) {
    const gw = await this.prisma.paymentGateway.findUnique({ where: { code } });
    if (!gw) throw new Error(`Gateway '${code}' not found`);

    const newStatus = gw.status === 'active' ? 'inactive' : 'active';
    return this.prisma.paymentGateway.update({
      where: { code },
      data:  { status: newStatus, updatedAt: new Date() },
    });
  }

  /**
   * Update gateway config (admin use only).
   * @param {string} code
   * @param {object} updates  – Partial PaymentGateway fields
   */
  async updateGateway(code, updates) {
    // Never allow overriding the code field
    const { code: _c, id: _i, createdAt: _ca, ...safe } = updates;
    return this.prisma.paymentGateway.update({
      where: { code },
      data:  { ...safe, updatedAt: new Date() },
    });
  }

  // ── Static factory helper (backward compat / simple usage) ───────────────

  /**
   * Static shortcut — creates a factory, loads gateway, returns adapter.
   * Useful when you don't want to instantiate PaymentFactory explicitly.
   *
   * @param {string} code
   * @param {object} prisma        – admin_db client (has PaymentGateway)
   * @param {object} [modulePrisma] – module-specific db client (optional)
   */
  static async build(code, prisma, modulePrisma) {
    const factory = new PaymentFactory(prisma);
    return factory.getAdapter(code, modulePrisma);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  _maskConfig(config) {
    const SENSITIVE_KEYS = ['apiKey', 'api_key', 'secretKey', 'secret', 'accessKey', 'privateKey'];
    const out = {};
    for (const [k, v] of Object.entries(config)) {
      out[k] = SENSITIVE_KEYS.includes(k) ? '••••••••' : v;
    }
    return out;
  }
}

// Export both the class and the adapter map so tests / admin can inspect registrations
PaymentFactory.ADAPTER_MAP = ADAPTER_MAP;

module.exports = PaymentFactory;
