import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated first
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to register new users" },
        { status: 401 }
      );
    }

    // Verify token
    const currentUser = verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: RegisterRequest = await request.json();
    const { email, password, name, role = "user" } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await createUser(email, passwordHash, name, role);

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        registeredBy: {
          id: currentUser.userId,
          email: currentUser.email,
          name: currentUser.name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
