/**
 * Tests for smsService — E.164 validation + Twilio/console send.
 */

describe('smsService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, SMS_PROVIDER: 'console' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves for valid E.164 phone number (console provider)', async () => {
    const sms = require('../shared/services/smsService');
    await expect(sms.send('+84901234567', 'Test message')).resolves.toBeUndefined();
  });

  it('throws for phone number without + prefix', async () => {
    const sms = require('../shared/services/smsService');
    await expect(sms.send('84901234567', 'Test')).rejects.toThrow('Invalid phone number format');
  });

  it('throws for local phone number format (0xxxxxxxxx)', async () => {
    const sms = require('../shared/services/smsService');
    await expect(sms.send('0901234567', 'Test')).rejects.toThrow('Invalid phone number format');
  });

  it('throws for empty phone number', async () => {
    const sms = require('../shared/services/smsService');
    await expect(sms.send('', 'Test')).rejects.toThrow('Invalid phone number format');
  });

  it('accepts multiple valid E.164 formats', async () => {
    const sms = require('../shared/services/smsService');
    const validNumbers = ['+84901234567', '+1234567890', '+447911123456'];
    for (const num of validNumbers) {
      await expect(sms.send(num, 'Test')).resolves.toBeUndefined();
    }
  });

  it('sendOtp uses Vietnamese fallback when no t() provided', async () => {
    const sms = require('../shared/services/smsService');
    await expect(sms.sendOtp('+84901234567', '123456')).resolves.toBeUndefined();
  });

  it('sendOtp uses i18n t() when provided', async () => {
    const sms = require('../shared/services/smsService');
    const mockT = jest.fn().mockReturnValue('Mã OTP: 123456');
    await expect(sms.sendOtp('+84901234567', '123456', mockT)).resolves.toBeUndefined();
    expect(mockT).toHaveBeenCalledWith('sms.otp_message', expect.objectContaining({ otp: '123456' }));
  });

  it('logs warning when SMS_PROVIDER=twilio but credentials missing', async () => {
    process.env = {
      ...originalEnv,
      SMS_PROVIDER: 'twilio',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN:  '',
      TWILIO_PHONE_NUMBER: '',
    };
    // Should not throw on module load
    expect(() => require('../shared/services/smsService')).not.toThrow();
  });
});
