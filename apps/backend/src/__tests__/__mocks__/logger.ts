export const logger = {
  info:     jest.fn(),
  warn:     jest.fn(),
  error:    jest.fn(),
  debug:    jest.fn(),
  security: jest.fn(),
};

export default logger;
module.exports = logger;
