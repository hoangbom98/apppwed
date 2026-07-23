// @ts-nocheck
// source/backend/src/shared/providers/tc-gaming/BaseTCGamingProvider.js
/**
 * Shared BaseTCGamingProvider
 *
 * Base class for TC Gaming DES-encrypted API.
 * Shared between game module and sports module.
 */
const crypto = require('crypto');
const axios  = require('axios');

class BaseTCGamingProvider {
  constructor(config) {
    this.config       = config;
    this.merchantCode = config.apiKey;    // merchant_code
    this.desKey       = config.secretKey; // merchant_des_key  (8-byte ASCII)
    this.hashKey      = config.hashKey || config.config?.hashKey; // merchant_hash_key
    this.apiUrl       = config.baseUrl;
    this.currency     = config.config?.currency || 'VND2';
  }

  // Encrypt JSON params via DES-ECB + Base64
  encryptParams(params) {
    const cipher = crypto.createCipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(JSON.stringify(params), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  // SHA-256(encryptedParams + hashKey)
  sign(encryptedParams) {
    return crypto.createHash('sha256').update(encryptedParams + this.hashKey).digest('hex');
  }

  // Decrypt Base64 callback params via DES-ECB
  decryptParams(encrypted) {
    const decipher = crypto.createDecipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  // Verify inbound signature
  verifySign(encryptedParams, sign) {
    return this.sign(encryptedParams) === sign;
  }

  // POST to TC Gaming API (form-urlencoded)
  async callTCGaming(params) {
    const encryptedParams = this.encryptParams(params);
    const sign            = this.sign(encryptedParams);

    const data = new URLSearchParams({
      merchant_code: this.merchantCode,
      params:        encryptedParams,
      sign,
    });

    const response = await axios.post(this.apiUrl, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });
    return response.data;
  }
}

module.exports = BaseTCGamingProvider;
