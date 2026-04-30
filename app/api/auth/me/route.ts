import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";

function normalizePermissions(value: unknown) {
  return Array.isArray(value) ? value.filter((p) => typeof p === "string") : [];
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the auth cookie from login
    const authCookie = request.cookies.get("admin-auth")?.value;

    if (!authCookie || authCookie !== "true") {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const username = request.cookies.get("admin-username")?.value;
    const accountType = request.cookies.get("admin-account-type")?.value;
    const userId = request.cookies.get("admin-user-id")?.value;

    const connection = await connectDB();
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    let admin = null;
    let isAdminAccount = false;
    const adminsCollection = db.collection("admins");

    if (accountType === "user" && userId) {
      admin = await UserModel.findById(userId).select(
        "username email permissions isActive",
      );
      isAdminAccount = false;

      if (admin?.isActive === false) {
        return NextResponse.json(
          { error: "Account is disabled" },
          { status: 401 },
        );
      }
    } else if (accountType === "admin" && username) {
      admin = await adminsCollection.findOne(
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        { projection: { username: 1, email: 1 } },
      );
      isAdminAccount = Boolean(admin);
    } else if (username) {
      admin = await adminsCollection.findOne(
        { username: { $regex: new RegExp(`^${username}$`, "i") } },
        { projection: { username: 1, email: 1 } },
      );
      isAdminAccount = Boolean(admin);

      if (!admin) {
        admin = await UserModel.findOne(
          { username: { $regex: new RegExp(`^${username}$`, "i") } },
          { projection: { username: 1, email: 1, permissions: 1, isActive: 1 } },
        );
      }
    } else {
      return NextResponse.json({ error: "No user session found" }, { status: 401 });
    }

    if (!admin) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    return NextResponse.json({
      username: admin.username,
      email: admin.email,
      role: isAdminAccount ? "admin" : "user",
      permissions: isAdminAccount ? [] : normalizePermissions(admin.permissions),
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 },
    );
  }
}
