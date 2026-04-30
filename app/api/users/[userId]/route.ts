import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await connectDB();

    const { userId } = await params;

    const user = await UserModel.findById(userId).select(
      "username email role permissions isActive lastLogin createdAt updatedAt",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user.toObject(),
        _id: user._id?.toString?.() ?? user._id,
        role: "user",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await connectDB();

    const { userId } = await params;
    const body = await request.json();
    const { username, email, permissions, isActive } = body;

    // Find and update user
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        username,
        email,
        role: "user",
        permissions,
        isActive,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    ).select(
      "username email role permissions isActive lastLogin createdAt updatedAt",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        ...user.toObject(),
        _id: user._id?.toString?.() ?? user._id,
        role: "user",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await connectDB();

    const { userId } = await params;

    const user = await UserModel.findByIdAndDelete(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
