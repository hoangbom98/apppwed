// @ts-nocheck
// source/backend/src/shared/providers/BaseProvider.js
/**
 * Shared BaseProvider
 *
 * Base class for all third-party game/sports providers.
 * Used by both the game module and the sports module so that
 * GSC, Goldgate and TC Gaming connection logic is written once.
 */
const axios  = require('axios');
const crypto = require('crypto');

class BaseProvider {
  constructor(providerConfig) {
    this.config = providerConfig; // { baseUrl, apiKey, secretKey, timeout?, config? }
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      headers: this.getHeaders(),
    });
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
    };
  }

  // Required overrides
  async createSession(_userId, _gameCode, _betAmount) {
    throw new Error('createSession must be implemented');
  }

  async getGameResult(_sessionId) {
    throw new Error('getGameResult must be implemented');
  }

  async handleWebhook(_payload) {
    throw new Error('handleWebhook must be implemented');
  }

  // Helper: HMAC-SHA256 signature
  generateSignature(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }
}

module.exports = BaseProvider;
