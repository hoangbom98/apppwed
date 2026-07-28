// backend/src/modules/game/services/ProviderEngine.ts
import axios from 'axios';

const AuthStrategy = require('./strategies/AuthStrategy');
const logger       = require('@shared/config/logger').default || require('@shared/config/logger');

interface ProviderModel {
  code:      string;
  config:    ProviderMeta;
  secretKey: string;
  hashKey:   string;
  apiKey:    string;
  baseUrl:   string;
}

interface ProviderMeta {
  endpoints: Record<string, { method: string; path: string }>;
  auth:      { type: string };
  mapping:   { status_field: string; success_value: unknown };
}

class ProviderEngine {
  private provider: ProviderModel;
  private meta:     ProviderMeta;

  constructor(providerModel: ProviderModel) {
    this.provider = providerModel;
    this.meta     = providerModel.config;
  }

  async execute(action: string, payload: Record<string, unknown>): Promise<unknown> {
    const endpoint = this.meta.endpoints[action];
    const authType = this.meta.auth.type;
    const strategy = AuthStrategy[authType];

    const requestOptions = this.prepareRequest(payload, strategy, endpoint);

    try {
      logger.info(`Executing ${action} for ${this.provider.code}`);
      const response = await axios(requestOptions);
      return this.handleResponse(response.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Provider Engine Error [${action}]: ${msg}`);
      throw new Error(`Provider Error: ${msg}`);
    }
  }

  prepareRequest(
    payload:  Record<string, unknown>,
    strategy: Record<string, (p: unknown, k: string) => string>,
    endpoint: { method: string; path: string },
  ): Record<string, unknown> {
    let data: unknown;

    if (this.meta.auth.type === 'DES_SHA256') {
      const encryptedParams = strategy.encrypt(payload, this.provider.secretKey);
      const sign            = strategy.sign(encryptedParams, this.provider.hashKey);

      data = new URLSearchParams({
        merchant_code: this.provider.apiKey,
        params:        encryptedParams,
        sign,
      }).toString();
    } else {
      data = payload;
    }

    return {
      method:  endpoint.method,
      url:     this.provider.baseUrl + endpoint.path,
      data,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };
  }

  handleResponse(responseData: Record<string, unknown>): Record<string, unknown> {
    if (responseData[this.meta.mapping.status_field] !== this.meta.mapping.success_value) {
      throw new Error(`Provider Error: ${responseData.error_desc ?? 'Unknown error'}`);
    }
    return responseData;
  }
}

module.exports = ProviderEngine;
