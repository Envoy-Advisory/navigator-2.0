// Mock implementation of env module for testing
// This file is automatically used when jest.mock('../env') is called

export const loadEnvironment = jest.fn();

export const getEnvVar = jest.fn((name: string, defaultValue?: string): string => {
  return process.env[name] || defaultValue || '';
});

export const getEnvVarAsNumber = jest.fn((name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (value === undefined) return defaultValue || 0;
  return parseInt(value, 10);
});

export const getEnvVarAsBoolean = jest.fn((name: string, defaultValue?: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined) return defaultValue || false;
  return value.toLowerCase() === 'true' || value === '1';
});

