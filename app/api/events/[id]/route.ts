import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { EventModel } from "@/app/lib/models/Event";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    const updated = await EventModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).lean();
    if (!updated)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const deleted = await EventModel.findByIdAndDelete(id).lean();
    if (!deleted)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
