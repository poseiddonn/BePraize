import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { SummerRegistrantModel } from "@/app/lib/models/SummerRegistrant";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, parentPhone, selectedInstruments, paymentId } =
      body;

    // Validate input
    if (
      !name ||
      !email ||
      !phone ||
      !parentPhone ||
      !selectedInstruments ||
      selectedInstruments.length === 0
    ) {
      console.error("Validation failed for summer registration");
      return NextResponse.json(
        {
          error:
            "Name, email, phone, parent phone, and at least one instrument selection are required",
        },
        { status: 400 },
      );
    }

    // Validate maximum 3 instruments
    if (selectedInstruments.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 instruments can be selected" },
        { status: 400 },
      );
    }

    // Check if registrant already exists
    const existingRegistrant = await SummerRegistrantModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingRegistrant) {
      return NextResponse.json(
        { error: "A registration with this email or phone already exists" },
        { status: 409 },
      );
    }

    // Create new registrant
    const registrant = new SummerRegistrantModel({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      parentPhone: parentPhone.trim(),
      selectedInstruments: selectedInstruments.map((inst: string) =>
        inst.trim(),
      ),
      paymentId,
    });

    

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
        error:
          error instanceof Error
            ? error.message
            : "Failed to process registration",
      },
      { status: 500 },
    );
  }
}
