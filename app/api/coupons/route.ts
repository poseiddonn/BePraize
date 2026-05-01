import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { CouponModel } from "@/app/lib/models/Coupon";

export async function GET() {
  try {
    await connectDB();
    const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const coupon = await CouponModel.create(body);
    return NextResponse.json(coupon, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 },
    );
  }
}
