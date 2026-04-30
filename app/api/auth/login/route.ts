import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Connect to MongoDB using existing connection
    const connection = await connectDB();

    // Access the database and collection using native MongoDB driver
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    // First check admins collection (for backward compatibility)
    const adminsCollection = db.collection("admins");
    let admin = await adminsCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    const isAdminAccount = Boolean(admin);

    // If not found in admins, check users collection
    if (!admin) {
      admin = await UserModel.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      });
    }

    // Check if user exists and password matches
    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check if user is active (for users collection)
    if (admin.isActive === false) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 401 },
      );
    }

    // Update last login time
    if (admin._id && typeof admin._id.toString === "function") {
      // For users collection, update last login (email field exists even if null)
      if (admin.email !== undefined) {
        await UserModel.findByIdAndUpdate(admin._id.toString(), {
          lastLogin: new Date(),
        });
      }
    }

    // Successful login - set authentication cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        username: admin.username,
        role: isAdminAccount ? "admin" : "user",
        permissions: isAdminAccount ? [] : admin.permissions || [],
        // Don't return the password in production
      },
    });

    // Set authentication cookie
    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Store username in a separate cookie to identify the logged-in user
    response.cookies.set("admin-username", admin.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.set(
      "admin-account-type",
      isAdminAccount ? "admin" : "user",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      },
    );

    response.cookies.set("admin-user-id", admin._id?.toString?.() || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
