import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
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
      !Array.isArray(selectedInstruments) ||
      selectedInstruments.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email, phone, parent phone, and at least one instrument selection are required",
        },
        { status: 400 },
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing payment confirmation" },
        { status: 400 },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (
      paymentIntent.status !== "succeeded" ||
      paymentIntent.metadata?.type !== "summer-registration" ||
      paymentIntent.metadata?.name !== name ||
      paymentIntent.metadata?.phone !== phone ||
      paymentIntent.currency !== "cad" ||
      paymentIntent.amount_received < 5000
    ) {
      return NextResponse.json(
        { error: "Payment has not been confirmed" },
        { status: 402 },
      );
    }

    // Validate maximum 3 instruments
    if (selectedInstruments.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 instruments can be selected" },
        { status: 400 },
      );
    }

    // Check if registrant with this name already exists
    const existingRegistrant = await SummerRegistrantModel.findOne({
      $or: [{ name: name.trim() }, { paymentId }],
    });

    if (existingRegistrant) {
      return NextResponse.json(
        { error: "A registration with this name already exists" },
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
