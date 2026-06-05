import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { connectWithRetry, query } from './db';

const runMigrations = async () => {
  console.log('Starting Database Migrations...');
  
  try {
    // Connect to database
    await connectWithRetry(5, 2000);

    // 1. Read and execute schema.sql
    const schemaPath = path.join(process.cwd(), 'src', 'config', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');
    await query(schemaSql);
    console.log('Tables created successfully.');

    // 2. Read and execute seed.sql
    const seedPath = path.join(process.cwd(), 'src', 'config', 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('Executing seed.sql...');
    await query(seedSql);
    console.log('Static seed data populated successfully.');

    // 3. Insert default users with hashed passwords
    console.log('Seeding default users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    const usersToSeed = [
      { name: 'System Admin', email: 'admin@eduai.com', role_name: 'admin' },
      { name: 'Jane Doe (Teacher)', email: 'teacher@eduai.com', role_name: 'teacher' },
      { name: 'John Doe (Student)', email: 'student@eduai.com', role_name: 'student' }
    ];

    for (const u of usersToSeed) {
      // Find role id
      const roleRes = await query('SELECT id FROM roles WHERE name = $1', [u.role_name]);
      if (roleRes.rows.length > 0) {
        const roleId = roleRes.rows[0].id;
        
        // Insert user if they don't already exist
        await query(
          `INSERT INTO users (name, email, password_hash, role_id, is_verified) 
           VALUES ($1, $2, $3, $4, TRUE)
           ON CONFLICT (email) DO NOTHING`,
          [u.name, u.email, defaultPasswordHash, roleId]
        );
      }
    }
    
    console.log('Default users seeded successfully (Credentials: email, password: "password123").');
    console.log('Migrations Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
