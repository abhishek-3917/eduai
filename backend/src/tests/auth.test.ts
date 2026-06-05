import request from 'supertest';
import app from '../app';
import * as db from '../config/db';

// Mock the DB module
jest.mock('../config/db', () => ({
  query: jest.fn(),
  connectWithRetry: jest.fn().mockImplementation(() => Promise.resolve({}))
}));

describe('Authentication APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student user successfully', async () => {
      // Mock db queries
      (db.query as jest.Mock)
        // Check if user exists (should return 0 rows)
        .mockResolvedValueOnce({ rows: [] })
        // Fetch default role 'student'
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        // Save user returning details
        .mockResolvedValueOnce({
          rows: [{
            id: 10,
            name: 'Alice Cooper',
            email: 'alice@eduai.com',
            created_at: new Date()
          }]
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Cooper',
          email: 'alice@eduai.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: 10,
        name: 'Alice Cooper',
        email: 'alice@eduai.com',
        role: 'student'
      });
    });

    it('should reject registration if fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'missingname@eduai.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user and return a token if credentials are valid', async () => {
      // We will hash 'password123' and mock the database result
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('password123', 10);

      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: 5,
          name: 'John Doe',
          email: 'john@eduai.com',
          password_hash: hash,
          role_name: 'student'
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@eduai.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('john@eduai.com');
    });

    it('should reject login if credentials are incorrect', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [] // No user found
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@eduai.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });
});
