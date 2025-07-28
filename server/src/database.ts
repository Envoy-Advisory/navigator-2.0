
import { Pool } from 'pg';

// PostgreSQL connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  organization?: string;
  organization_id?: number;
  created_at: Date;
  last_login?: Date;
}

export interface Organization {
  id: number;
  name: string;
  subscription_type: string;
  settings: any;
  created_at: Date;
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employer',
        organization VARCHAR(255),
        organization_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subscription_type VARCHAR(50) DEFAULT 'basic',
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// User operations
export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, name, email, role, organization, organization_id, created_at, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
    organization?: string;
    organizationId?: number;
  }): Promise<User> {
    const { name, email, password, organization, organizationId } = userData;
    const result = await pool.query(
      `INSERT INTO users (name, email, password, organization, organization_id, last_login) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id, name, email, role, organization, organization_id, created_at, last_login`,
      [name, email, password, organization, organizationId]
    );
    return result.rows[0];
  }

  static async updateLastLogin(id: number): Promise<void> {
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }
}

// Organization operations
export class OrganizationService {
  static async create(name: string): Promise<{ id: number }> {
    const result = await pool.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [name]
    );
    return result.rows[0];
  }

  static async findById(id: number): Promise<Organization | null> {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
