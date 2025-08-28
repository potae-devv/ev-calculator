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

// Helper function to get authenticated user from request
export function getAuthenticatedUser(request: Request): AuthToken | null {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    // Parse cookies manually to get auth-token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['auth-token'];
    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Next.js API route context type
export interface ApiRouteContext {
  params?: { [key: string]: string | string[] };
}

// Authentication middleware wrapper for API routes
export function requireAuthentication(
  handler: (request: Request, user: AuthToken, context?: ApiRouteContext) => Promise<Response>
) {
  return async (request: Request, context?: ApiRouteContext): Promise<Response> => {
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return handler(request, user, context);
  };
}
