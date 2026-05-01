import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { TicketTierModel } from "@/app/lib/models/TicketTier";

export async function GET() {
  try {
    await connectDB();
    const tiers = await TicketTierModel.find().sort({ price: 1 }).lean();
    return NextResponse.json(tiers);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ticket tiers" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const tier = await TicketTierModel.create(body);
    return NextResponse.json(tier, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create ticket tier" },
      { status: 500 },
    );
  }
}
