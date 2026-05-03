import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { SummerRegistrantModel } from "@/app/lib/models/SummerRegistrant";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, paymentId } = body;

    // Validate input
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Check if registrant already exists
    const existingRegistrant = await SummerRegistrantModel.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingRegistrant) {
      return NextResponse.json(
        { error: "A registration with this email or phone already exists" },
        { status: 409 }
      );
    }

    // Create new registrant
    const registrant = new SummerRegistrantModel({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      paymentId,
    });

    await registrant.save();

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      registrant: {
        ...registrant.toObject(),
        _id: registrant._id?.toString?.() ?? registrant._id,
      },
    });
  } catch (error) {
    console.error("Summer registration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process registration",
      },
      { status: 500 }
    );
  }
}
