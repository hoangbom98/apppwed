export const getPrismaClient = jest.fn().mockReturnValue({
  user: {
    findUnique: jest.fn(),
    update:     jest.fn(),
    count:      jest.fn(),
  },
  transaction: {
    create:   jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
});

export const disconnectAll = jest.fn();
