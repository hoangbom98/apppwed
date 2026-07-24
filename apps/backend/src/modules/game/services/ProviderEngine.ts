// @ts-nocheck
// backend/src/modules/game/services/ProviderEngine.js
const AuthStrategy = require('./strategies/AuthStrategy');
const axios = require('axios');
const logger = require('@shared/config/logger');

class ProviderEngine {
  constructor(providerModel) {
    this.provider = providerModel; // Record từ DB
    this.meta = providerModel.config; // JSON Metadata
  }

  async execute(action, payload) {
    const endpoint = this.meta.endpoints[action];
    const authType = this.meta.auth.type;
    const strategy = AuthStrategy[authType];

    const requestOptions = this.prepareRequest(payload, strategy, endpoint);
    
    try {
      logger.info(`Executing ${action} for ${this.provider.code}`);
      const response = await axios(requestOptions);
      return this.handleResponse(response.data);
    } catch (err) {
      logger.error(`Provider Engine Error [${action}]: ${err.message}`);
      throw new Error(`Provider Error: ${err.message}`);
    }
  }

  prepareRequest(payload, strategy, endpoint) {
    let data;
    
    // Tự động áp dụng chiến lược mã hóa/ký từ metadata
    if (this.meta.auth.type === 'DES_SHA256') {
      const encryptedParams = strategy.encrypt(payload, this.provider.secretKey);
      const sign = strategy.sign(encryptedParams, this.provider.hashKey);
      
      data = new URLSearchParams({
        merchant_code: this.provider.apiKey,
        params: encryptedParams,
        sign: sign
      }).toString();
    } else {
      data = payload;
    }

    return {
      method: endpoint.method,
      url: this.provider.baseUrl + endpoint.path,
      data: data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
  }

  handleResponse(responseData) {
    // Check status based on mapping
    if (responseData[this.meta.mapping.status_field] !== this.meta.mapping.success_value) {
      throw new Error(`Provider Error: ${responseData.error_desc || 'Unknown error'}`);
    }
    return responseData;
  }
}

module.exports = ProviderEngine;
