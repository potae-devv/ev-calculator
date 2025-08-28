import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createEVCar, getAllEVCars, getUserEVCars } from "@/lib/prisma";

interface CreateEVCarRequest {
  name: string;
  batteryCapacityKwh: number;
  kwhPerBaht: number;
}

// GET /api/ev-cars - Get all EV cars or user's EV cars
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // 'user' or 'all'

    let evCars;
    if (scope === "all" && decoded.role === "admin") {
      // Admin can view all EV cars
      evCars = await getAllEVCars();
    } else {
      // Regular users see only their own cars
      evCars = await getUserEVCars(decoded.userId);
    }

    return NextResponse.json({ evCars }, { status: 200 });
  } catch (error) {
    console.error("Get EV cars error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/ev-cars - Create a new EV car
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body: CreateEVCarRequest = await request.json();
    const { name, batteryCapacityKwh, kwhPerBaht } = body;

    // Validate required fields
    if (!name || !batteryCapacityKwh || !kwhPerBaht) {
      return NextResponse.json(
        { error: "Name, battery capacity (kWh) and kWh per Baht are required" },
        { status: 400 }
      );
    }

    // Validate battery capacity
    if (batteryCapacityKwh <= 0 || batteryCapacityKwh > 300) {
      return NextResponse.json(
        { error: "Battery capacity must be between 0 and 300 kWh" },
        { status: 400 }
      );
    }

    // Validate kWh per Baht rate
    if (kwhPerBaht <= 0 || kwhPerBaht > 100) {
      return NextResponse.json(
        { error: "kWh per Baht must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Create EV car
    const evCar = await createEVCar(decoded.userId, {
      name: name.trim(),
      batteryCapacityKwh,
      kwhPerBaht,
    });

    return NextResponse.json(
      {
        success: true,
        message: "EV car created successfully",
        evCar,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create EV car error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
