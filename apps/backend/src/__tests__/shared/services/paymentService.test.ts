const fs = require('fs');
const paymentService = require('../../../shared/services/paymentService');
const logger = require('../../__mocks__/logger');

jest.mock('fs');

describe('paymentService.getBankList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load local bank list successfully', async () => {
    const mockBanks = [{ id: 1, name: 'Test Bank', code: 'TB', bin: '123' }];
    fs.readFileSync.mockReturnValue(JSON.stringify(mockBanks));

    const result = await paymentService.getBankList();

    expect(result).toEqual(mockBanks);
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  it('should return empty array and log error if file loading fails', async () => {
    fs.readFileSync.mockImplementation(() => { throw new Error('File read error'); });

    const result = await paymentService.getBankList();

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalled();
  });
});
