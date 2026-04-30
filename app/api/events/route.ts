import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { EventModel } from "@/app/lib/models/Event";

export async function GET() {
  try {
    await connectDB();
    const events = await EventModel.find().sort({ date: 1 }).lean();
    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const event = await EventModel.create(body);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
