import { getEnvVar, getEnvVarAsNumber, getEnvVarAsBoolean, loadEnvironment } from '../env';

describe('Environment Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvVar', () => {
    it('should return environment variable value when it exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return default value when environment variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR', 'default-value')).toBe('default-value');
    });

    it('should throw error when environment variable does not exist and no default provided', () => {
      delete process.env.TEST_VAR;
      expect(() => getEnvVar('TEST_VAR')).toThrow('Environment variable TEST_VAR is not defined');
    });

    it('should handle empty string values', () => {
      process.env.TEST_VAR = '';
      expect(getEnvVar('TEST_VAR')).toBe('');
    });
  });

  describe('getEnvVarAsNumber', () => {
    it('should return parsed number when valid number is provided', () => {
      process.env.NUMBER_VAR = '42';
      expect(getEnvVarAsNumber('NUMBER_VAR')).toBe(42);
    });

    it('should return default value when environment variable does not exist', () => {
      delete process.env.NUMBER_VAR;
      expect(getEnvVarAsNumber('NUMBER_VAR', 100)).toBe(100);
    });

    it('should throw error when environment variable does not exist and no default provided', () => {
      delete process.env.NUMBER_VAR;
      expect(() => getEnvVarAsNumber('NUMBER_VAR')).toThrow('Environment variable NUMBER_VAR is not defined');
    });

    it('should throw error when invalid number is provided', () => {
      process.env.NUMBER_VAR = 'not-a-number';
      expect(() => getEnvVarAsNumber('NUMBER_VAR')).toThrow('Environment variable NUMBER_VAR is not a valid number: not-a-number');
    });

    it('should handle negative numbers', () => {
      process.env.NUMBER_VAR = '-10';
      expect(getEnvVarAsNumber('NUMBER_VAR')).toBe(-10);
    });

    it('should handle zero', () => {
      process.env.NUMBER_VAR = '0';
      expect(getEnvVarAsNumber('NUMBER_VAR')).toBe(0);
    });
  });

  describe('getEnvVarAsBoolean', () => {
    it('should return true for "true" string', () => {
      process.env.BOOL_VAR = 'true';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(true);
    });

    it('should return true for "1" string', () => {
      process.env.BOOL_VAR = '1';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(true);
    });

    it('should return false for "false" string', () => {
      process.env.BOOL_VAR = 'false';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(false);
    });

    it('should return false for "0" string', () => {
      process.env.BOOL_VAR = '0';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(false);
    });

    it('should return false for any other string', () => {
      process.env.BOOL_VAR = 'random';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(false);
    });

    it('should be case insensitive', () => {
      process.env.BOOL_VAR = 'TRUE';
      expect(getEnvVarAsBoolean('BOOL_VAR')).toBe(true);
    });

    it('should return default value when environment variable does not exist', () => {
      delete process.env.BOOL_VAR;
      expect(getEnvVarAsBoolean('BOOL_VAR', true)).toBe(true);
      expect(getEnvVarAsBoolean('BOOL_VAR', false)).toBe(false);
    });

    it('should throw error when environment variable does not exist and no default provided', () => {
      delete process.env.BOOL_VAR;
      expect(() => getEnvVarAsBoolean('BOOL_VAR')).toThrow('Environment variable BOOL_VAR is not defined');
    });
  });

  describe('loadEnvironment', () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    beforeEach(() => {
      console.log = jest.fn();
      console.error = jest.fn();
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    });

    it('should handle missing NODE_ENV by defaulting to local', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      // loadEnvironment() doesn't set NODE_ENV, it just uses it to determine which .env file to load
      // The function will default to 'local' internally when NODE_ENV is not set
      expect(() => loadEnvironment()).not.toThrow();
      // NODE_ENV might be set by the loaded .env file, or remain undefined
      // The important part is that the function doesn't throw an error
      expect(console.log).toHaveBeenCalledWith('Node Environment: local');
      // Restore original NODE_ENV
      if (originalNodeEnv) process.env.NODE_ENV = originalNodeEnv;
    });

    it('should use existing NODE_ENV when set', () => {
      process.env.NODE_ENV = 'production';
      loadEnvironment();
      expect(process.env.NODE_ENV).toBe('production');
    });

    it('should handle Vercel environment variables', () => {
      process.env.VERCEL_ENV = 'preview';
      loadEnvironment();
      // Should log the Vercel environment
      expect(console.log).toHaveBeenCalledWith('Vercel Environment: preview');
    });

    it('should validate required environment variables', () => {
      // Test by checking that validation logs appropriately when DATABASE_URL is present
      // (We can't easily test the missing case because .env.test always provides it)
      loadEnvironment();
      
      // When DATABASE_URL is present (from .env.test), should log success
      expect(console.log).toHaveBeenCalledWith('All required environment variables are present');
      
      // Verify DATABASE_URL is actually set
      expect(process.env.DATABASE_URL).toBeDefined();
    });
  });
});
