import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'eduai_admin',
  password: process.env.DB_PASSWORD || 'secure_postgres_password_123',
  database: process.env.DB_NAME || 'eduai_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const connectWithRetry = async (retries = 5, delay = 3000): Promise<Pool> => {
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database!');
      client.release();
      return pool;
    } catch (err) {
      console.error(`PostgreSQL connection failed. Retries remaining: ${retries - 1}. Error:`, err);
      retries -= 1;
      if (retries === 0) {
        throw new Error('Could not connect to PostgreSQL database. Exiting.');
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  return pool;
};

export default pool;
