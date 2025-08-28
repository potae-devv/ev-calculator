import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createCharge, getChargesByUser, getEVCarById } from "@/lib/prisma";

interface CreateChargeRequest {
  evCarId: number;
  startPct: number;
  endPct: number;
}

// GET /api/charges - Get all charges for the authenticated user
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
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get all charges for the user
    const charges = await getChargesByUser(decoded.userId);

    return NextResponse.json({
      success: true,
      data: charges,
    });
  } catch (error) {
    console.error("Error fetching charges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/charges - Create a new charge record
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
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body: CreateChargeRequest = await request.json();
    const { evCarId, startPct, endPct } = body;

    // Validate required fields
    if (!evCarId || startPct === undefined || endPct === undefined) {
      return NextResponse.json(
        { error: "EV Car, start %, and end % are required" },
        { status: 400 }
      );
    }

    // Verify that the EV car belongs to the user
    const evCar = await getEVCarById(evCarId);
    if (!evCar || evCar.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "EV car not found or access denied" },
        { status: 403 }
      );
    }

    // Validate percentage values
    if (startPct < 0 || startPct > 100 || endPct < 0 || endPct > 100) {
      return NextResponse.json(
        { error: "Start and end percentages must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (endPct <= startPct) {
      return NextResponse.json(
        { error: "End percentage must be greater than start percentage" },
        { status: 400 }
      );
    }

    // Create charge record
    const charge = await createCharge(evCarId, {
      startPct,
      endPct,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Charge record created successfully",
        data: charge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating charge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
