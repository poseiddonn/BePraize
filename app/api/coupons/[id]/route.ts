import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { CouponModel } from "@/app/lib/models/Coupon";
import { EventModel } from "@/app/lib/models/Event";

interface Params {
  params: Promise<{ id: string }>;
}

// Full update (edit form) — cascades name change to all events
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json();

    // Fetch the existing coupon so we can detect a name change
    const existing = await CouponModel.findById(id).lean() as { name: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const oldName = existing.name;
    const newName: string | undefined = body.name;

    // Update the coupon itself
    const updated = await CouponModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    ).lean();

    // If the code name changed, cascade to every event that references the old name
    if (newName && newName !== oldName) {
      await EventModel.updateMany(
        { coupons: oldName },
        { $set: { "coupons.$": newName } },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/coupons/:id]", err);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 },
    );
  }
}

// Toggle active / invalidate
export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    coupon.active = !coupon.active;
    await coupon.save();
    return NextResponse.json(coupon.toObject());
  } catch (err) {
    console.error("[PATCH /api/coupons/:id]", err);
    return NextResponse.json(
      { error: "Failed to toggle coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();

    // Fetch name before deleting so we can clean up events
    const existing = await CouponModel.findById(id).lean() as { name: string } | null;
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await CouponModel.findByIdAndDelete(id);

    // Remove this coupon code from all events that reference it
    await EventModel.updateMany(
      { coupons: existing.name },
      { $pull: { coupons: existing.name } },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/coupons/:id]", err);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 },
    );
  }
}