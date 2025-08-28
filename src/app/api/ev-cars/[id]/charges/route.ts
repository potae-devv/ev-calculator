import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getChargesByEvCarWithDateFilter, getEVCarById } from "@/lib/prisma";

// GET /api/ev-cars/[id]/charges - Get all charges for a specific EV car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const evCarId = parseInt(resolvedParams.id);
    if (isNaN(evCarId)) {
      return NextResponse.json(
        { error: "Invalid EV car ID" },
        { status: 400 }
      );
    }

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

    // Verify that the EV car belongs to the user
    const evCar = await getEVCarById(evCarId);
    if (!evCar) {
      return NextResponse.json(
        { error: "EV car not found" },
        { status: 404 }
      );
    }

    if (evCar.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get query parameters for date filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    // Get charges for this EV car with optional date filtering
    const charges = await getChargesByEvCarWithDateFilter(evCarId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: charges,
      evCar: {
        id: evCar.id,
        name: evCar.name,
        batteryCapacityKwh: evCar.batteryCapacityKwh,
        kwhPerBaht: evCar.kwhPerBaht,
      },
    });
  } catch (error) {
    console.error("Error fetching charges for EV car:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
