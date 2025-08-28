import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getChargeById, updateCharge, deleteCharge } from "@/lib/prisma";

interface UpdateChargeRequest {
  startPct?: number;
  endPct?: number;
}

// GET /api/charges/[id] - Get a specific charge record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const chargeId = parseInt(resolvedParams.id);
    if (isNaN(chargeId)) {
      return NextResponse.json(
        { error: "Invalid charge ID" },
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

    // Get charge record
    const charge = await getChargeById(chargeId);
    if (!charge) {
      return NextResponse.json(
        { error: "Charge record not found" },
        { status: 404 }
      );
    }

    // Check if the charge belongs to the user
    if (charge.evCar.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: charge,
    });
  } catch (error) {
    console.error("Error fetching charge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/charges/[id] - Update a charge record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const chargeId = parseInt(resolvedParams.id);
    if (isNaN(chargeId)) {
      return NextResponse.json(
        { error: "Invalid charge ID" },
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

    // Get existing charge record
    const existingCharge = await getChargeById(chargeId);
    if (!existingCharge) {
      return NextResponse.json(
        { error: "Charge record not found" },
        { status: 404 }
      );
    }

    // Check if the charge belongs to the user
    if (existingCharge.evCar.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const body: UpdateChargeRequest = await request.json();
    const { startPct, endPct } = body;

    // Validate percentage values if provided
    if (startPct !== undefined && (startPct < 0 || startPct > 100)) {
      return NextResponse.json(
        { error: "Start percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (endPct !== undefined && (endPct < 0 || endPct > 100)) {
      return NextResponse.json(
        { error: "End percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate percentage relationship
    const finalStartPct = startPct !== undefined ? startPct : existingCharge.startPct;
    const finalEndPct = endPct !== undefined ? endPct : existingCharge.endPct;
    
    if (finalEndPct <= finalStartPct) {
      return NextResponse.json(
        { error: "End percentage must be greater than start percentage" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      startPct?: number;
      endPct?: number;
    } = {};
    if (startPct !== undefined) updateData.startPct = startPct;
    if (endPct !== undefined) updateData.endPct = endPct;

    const updatedCharge = await updateCharge(chargeId, updateData);

    return NextResponse.json(
      {
        success: true,
        message: "Charge record updated successfully",
        data: updatedCharge,
      }
    );
  } catch (error) {
    console.error("Error updating charge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/charges/[id] - Delete a charge record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const chargeId = parseInt(resolvedParams.id);
    if (isNaN(chargeId)) {
      return NextResponse.json(
        { error: "Invalid charge ID" },
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

    // Get existing charge record
    const existingCharge = await getChargeById(chargeId);
    if (!existingCharge) {
      return NextResponse.json(
        { error: "Charge record not found" },
        { status: 404 }
      );
    }

    // Check if the charge belongs to the user
    if (existingCharge.evCar.userId !== decoded.userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await deleteCharge(chargeId);

    return NextResponse.json({
      success: true,
      message: "Charge record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting charge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
