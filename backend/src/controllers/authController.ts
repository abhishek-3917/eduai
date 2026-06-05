import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { query } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  
  try {
    // 1. Check if user already exists
    const checkUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 2. Fetch default student role id
    const roleRes = await query("SELECT id FROM roles WHERE name = 'student'");
    if (roleRes.rows.length === 0) {
      return res.status(500).json({ message: 'Default role not found in system database.' });
    }
    const roleId = roleRes.rows[0].id;

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Save user
    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, role_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash, roleId]
    );

    const newUser = insertRes.rows[0];

    // 5. Generate token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: 'student' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE as any }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'student'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed due to server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Retrieve user and their role name
    const userRes = await query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE as any }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed due to server error.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  try {
    const userRes = await query(
      `SELECT u.id, u.name, u.email, u.bio, u.profile_image, u.is_verified, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    return res.status(200).json(userRes.rows[0]);
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  // Mock reset link sent
  return res.status(200).json({ 
    message: `Password reset instructions have been dispatched to ${email}.` 
  });
};
