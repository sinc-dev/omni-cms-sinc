// Global test setup
// This file runs before all tests

// Mock environment variables if needed
// Use type assertion to allow setting NODE_ENV in test environment
(process.env as { NODE_ENV?: string }).NODE_ENV = 'test';

// Note: jest.setTimeout is configured in jest.config.mjs