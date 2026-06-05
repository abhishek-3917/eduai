import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

import apiRouter from './routes';
import { connectWithRetry, query } from './config/db';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Set limits to 10MB to handle notes/document base64 upload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Mount Master Router
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Self-healing database initialization & Express Startup
const startServer = async () => {
  try {
    // 1. Establish database connection with retry
    await connectWithRetry(5, 3000);

    // 2. Programmatically verify schema / migrations
    const tableCheck = await query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles'"
    );

    if (tableCheck.rows.length === 0) {
      console.log('Database tables not detected. Commencing automatic self-healing migration...');
      
      // Read schema file
      const schemaSql = fs.readFileSync(path.join(process.cwd(), 'src', 'config', 'schema.sql'), 'utf8');
      await query(schemaSql);
      console.log('Schema tables created successfully.');

      // Read seeds file
      const seedSql = fs.readFileSync(path.join(process.cwd(), 'src', 'config', 'seed.sql'), 'utf8');
      await query(seedSql);
      console.log('Static seed data populated.');

      // Hash default credentials password 'password123'
      console.log('Generating password hashes for seed users...');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);

      const rolesRes = await query('SELECT id, name FROM roles');
      for (const r of rolesRes.rows) {
        const email = `${r.name}@eduai.com`;
        const name = `Default ${r.name.charAt(0).toUpperCase() + r.name.slice(1)}`;
        await query(
          `INSERT INTO users (name, email, password_hash, role_id, is_verified) 
           VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (email) DO NOTHING`,
          [name, email, hash, r.id]
        );
      }
      console.log('Dynamic user seeding complete (Default credentials: role@eduai.com / password123).');
    }

    // 3. Start listening
    app.listen(PORT, () => {
      console.log(`EduAI Express backend is listening on port ${PORT}...`);
    });

  } catch (error) {
    console.error('Failed to initialize and start the server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app; // exported for testing
