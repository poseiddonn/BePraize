import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";
import { hashPassword } from "@/app/lib/auth/password";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET() {
  try {
    await connectDB();

    const users = await UserModel.find({})
      .select(
        "username email role permissions isActive lastLogin createdAt updatedAt",
      )
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        ...user.toObject(),
        _id: user._id?.toString?.() ?? user._id,
        role: "user",
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch users",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { username, email, password, permissions } = body;
    const normalizedUsername = typeof username === "string" ? username.trim() : "";

    // Validate input
    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      username: {
        $regex: new RegExp(`^${escapeRegex(normalizedUsername)}$`, "i"),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 409 },
      );
    }

    // Create new user
    const user = new UserModel({
      username: normalizedUsername,
      email: email || null, // Handle optional email
      password: hashPassword(password),
      role: "user",
      permissions: permissions || [],
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        ...user.toObject(),
        _id: user._id?.toString?.() ?? user._id,
        password: undefined, // Don't return password
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create user",
      },
      { status: 500 },
    );
  }
}
