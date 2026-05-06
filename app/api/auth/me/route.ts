import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/app/lib/auth/adminSession";

function normalizePermissions(value: unknown) {
  return Array.isArray(value) ? value.filter((p) => typeof p === "string") : [];
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAdminSessionToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const connection = await connectDB();
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    let admin = null;
    const isAdminAccount = session.accountType === "admin";

    if (session.accountType === "user" && session.userId) {
      admin = await UserModel.findById(session.userId).select(
        "username email permissions isActive",
      );

      if (admin?.isActive === false) {
        return NextResponse.json(
          { error: "Account is disabled" },
          { status: 401 },
        );
      }
    } else if (session.accountType === "admin") {
      const adminsCollection = db.collection("admins");
      admin = await adminsCollection.findOne(
        { username: { $regex: new RegExp(`^${session.username}$`, "i") } },
        { projection: { username: 1, email: 1 } },
      );
    }

    if (!admin) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    return NextResponse.json({
      username: admin.username,
      email: admin.email,
      role: isAdminAccount ? "admin" : "user",
      permissions: isAdminAccount
        ? []
        : normalizePermissions(admin.permissions),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get user info",
      },
      { status: 500 },
    );
  }
}