// tests/setup/prisma-mock.ts
// Utility to mock PrismaService for unit tests
// Jest globals (jest.fn) are available in the test environment; no import needed.
/// <reference types="jest" />

export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // ...add more as needed
  },
  booking: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    // ...add more as needed
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    // ...add more as needed
  },
  // ...mock other models as needed
}; 