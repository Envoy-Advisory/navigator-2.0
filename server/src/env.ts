
import { config } from 'dotenv';

/**
 * Load environment variables from .env file
 * This function will load the appropriate .env file based on NODE_ENV
 * and populate process.env with the values
 */
export function loadEnvironment(): void {
  // Check Vercel environment first
  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = process.env.NODE_ENV || 'local';
  
  console.log(`Vercel Environment: ${vercelEnv}`);
  console.log(`Node Environment: ${nodeEnv}`);
  
  // Determine which environment file to load
  let targetEnv = nodeEnv;
  
  if (vercelEnv === 'preview') {
    targetEnv = 'dev'; // Use .env.dev for preview deployments
  } else if (vercelEnv === 'production') {
    targetEnv = 'prod'; // Use .env.prod for production deployments
  } else if (vercelEnv === 'development') {
    targetEnv = 'dev'; // Use .env.dev for development deployments
  }
  
  console.log(`Loading environment for target: ${targetEnv}`);
  
  // Define possible .env file paths in order of priority
  const envFiles = [
    `.env.${targetEnv}`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env'
  ];

  let loaded = false;

  // Try to load environment files in order of priority
  for (const envFile of envFiles) {

    const result = config({ path: envFile });
      
      if (result.error) {
        console.error(`Error loading ${envFile}:`, result.error);
      } else {
        console.log(`Successfully loaded environment variables from ${envFile}`);
        loaded = true;
        break;
      }
    
  }

  if (!loaded) {
    console.warn('No .env file found. Using system environment variables only.');
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('JWT') || key.includes('NODE_ENV') || key.includes('VERCEL')));
  }

  // Validate required environment variables
  validateRequiredEnvVars();
}

/**
 * Validate that required environment variables are present
 */
function validateRequiredEnvVars(): void {
  const requiredVars = ['DATABASE_URL'];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file configuration.');
    console.error('Current working directory:', process.cwd());
    console.error('Current NODE_ENV:', process.env.NODE_ENV);
    console.error('Current VERCEL_ENV:', process.env.VERCEL_ENV);
  } else {
    console.log('All required environment variables are present');
  }
}

/**
 * Get environment variable with optional default value
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not defined`);
  }
  
  return value;
}

/**
 * Get environment variable as number
 */
export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not defined`);
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} is not a valid number: ${value}`);
  }
  
  return parsed;
}

/**
 * Get environment variable as boolean
 */
export function getEnvVarAsBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not defined`);
  }
  
  return value.toLowerCase() === 'true' || value === '1';
}
