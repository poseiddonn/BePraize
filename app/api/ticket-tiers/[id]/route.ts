import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { TicketTierModel } from "@/app/lib/models/TicketTier";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const updated = await TicketTierModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).lean();
    if (!updated)
      return NextResponse.json(
        { error: "Ticket tier not found" },
        { status: 404 },
      );
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update ticket tier" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await TicketTierModel.findByIdAndDelete(id).lean();
    if (!deleted)
      return NextResponse.json(
        { error: "Ticket tier not found" },
        { status: 404 },
      );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete ticket tier" },
      { status: 500 },
    );
  }
}
