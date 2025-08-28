import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getEVCarById, updateEVCar, deleteEVCar } from "@/lib/prisma";

interface UpdateEVCarRequest {
  name?: string;
  batteryCapacityKwh?: number;
  kwhPerBaht?: number;
}

// GET /api/ev-cars/[id] - Get a specific EV car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const evCarId = parseInt(resolvedParams.id);
    if (isNaN(evCarId)) {
      return NextResponse.json(
        { error: "Invalid EV car ID" },
        { status: 400 }
      );
    }

    const evCar = await getEVCarById(evCarId);

    if (!evCar) {
      return NextResponse.json(
        { error: "EV car not found" },
        { status: 404 }
      );
    }

    // Check if user owns this EV car or is admin
    if (evCar.userId !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ evCar }, { status: 200 });
  } catch (error) {
    console.error("Get EV car error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/ev-cars/[id] - Update a specific EV car
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const evCarId = parseInt(resolvedParams.id);
    if (isNaN(evCarId)) {
      return NextResponse.json(
        { error: "Invalid EV car ID" },
        { status: 400 }
      );
    }

    // Check if EV car exists and user owns it
    const existingEvCar = await getEVCarById(evCarId);
    if (!existingEvCar) {
      return NextResponse.json(
        { error: "EV car not found" },
        { status: 404 }
      );
    }

    if (existingEvCar.userId !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body: UpdateEVCarRequest = await request.json();
    const { name, batteryCapacityKwh, kwhPerBaht } = body;

    // Validate battery capacity if provided
    if (batteryCapacityKwh !== undefined && (batteryCapacityKwh <= 0 || batteryCapacityKwh > 300)) {
      return NextResponse.json(
        { error: "Battery capacity must be between 0 and 300 kWh" },
        { status: 400 }
      );
    }

    // Validate kWh per Baht rate if provided
    if (kwhPerBaht !== undefined && (kwhPerBaht <= 0 || kwhPerBaht > 100)) {
      return NextResponse.json(
        { error: "kWh per Baht must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      batteryCapacityKwh?: number;
      kwhPerBaht?: number;
    } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (batteryCapacityKwh !== undefined) updateData.batteryCapacityKwh = batteryCapacityKwh;
    if (kwhPerBaht !== undefined) updateData.kwhPerBaht = kwhPerBaht;

    const updatedEvCar = await updateEVCar(evCarId, updateData);

    return NextResponse.json(
      {
        success: true,
        message: "EV car updated successfully",
        evCar: updatedEvCar,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update EV car error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/ev-cars/[id] - Delete a specific EV car
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const evCarId = parseInt(resolvedParams.id);
    if (isNaN(evCarId)) {
      return NextResponse.json(
        { error: "Invalid EV car ID" },
        { status: 400 }
      );
    }

    // Check if EV car exists and user owns it
    const existingEvCar = await getEVCarById(evCarId);
    if (!existingEvCar) {
      return NextResponse.json(
        { error: "EV car not found" },
        { status: 404 }
      );
    }

    if (existingEvCar.userId !== decoded.userId && decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await deleteEVCar(evCarId);

    return NextResponse.json(
      {
        success: true,
        message: "EV car deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete EV car error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
