import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { SummerRegistrantModel } from "@/app/lib/models/SummerRegistrant";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    // Check if registrant with this name already exists
    const existingRegistrant = await SummerRegistrantModel.findOne({
      name: name.trim(),
    });

    if (existingRegistrant) {
      return NextResponse.json(
        { error: "A registration with this name already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Name is available",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate registration",
      },
      { status: 500 },
    );
  }
}
