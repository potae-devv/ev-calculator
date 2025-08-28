import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export function generateToken(user: User): string {
  const payload: Omit<AuthToken, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// User validation function using Prisma
export async function validateUser(email: string, password: string): Promise<User | null> {
  try {
    const bcrypt = await import('bcryptjs');
    const { findUserByEmail } = await import('./prisma');
    
    // Find user in database
    const dbUser = await findUserByEmail(email);
    
    if (!dbUser) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password hash
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    };
  } catch (error) {
    console.error('User validation error:', error);
    return null;
  }
}
