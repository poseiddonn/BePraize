import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { UserModel } from "@/app/lib/models/User";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from "@/app/lib/auth/adminSession";
import { hashPassword, isPasswordHash, verifyPassword } from "@/app/lib/auth/password";

const SESSION_MAX_AGE = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const connection = await connectDB();
    const db = connection.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const adminsCollection = db.collection("admins");
    let admin = await adminsCollection.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    const isAdminAccount = Boolean(admin);

    if (!admin) {
      admin = await UserModel.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      });
    }

    if (!admin || !verifyPassword(password, admin.password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!isPasswordHash(admin.password)) {
      const hashedPassword = hashPassword(password);
      if (isAdminAccount) {
        await adminsCollection.updateOne(
          { _id: admin._id },
          { $set: { password: hashedPassword } },
        );
      } else if (admin._id) {
        await UserModel.findByIdAndUpdate(admin._id.toString(), {
          password: hashedPassword,
        });
      }
    }

    if (admin.isActive === false) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 401 },
      );
    }

    if (admin._id && typeof admin._id.toString === "function") {
      if (admin.email !== undefined) {
        await UserModel.findByIdAndUpdate(admin._id.toString(), {
          lastLogin: new Date(),
        });
      }
    }

    const sessionToken = await createAdminSessionToken(
      {
        username: admin.username,
        accountType: isAdminAccount ? "admin" : "user",
        userId: admin._id?.toString?.() || "",
      },
      SESSION_MAX_AGE,
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        username: admin.username,
        role: isAdminAccount ? "admin" : "user",
        permissions: isAdminAccount ? [] : admin.permissions || [],
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    // Legacy metadata cookies are retained for existing UI/logout behavior, but
    // authorization now depends on the signed admin-session cookie.
    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    response.cookies.set("admin-username", admin.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    response.cookies.set(
      "admin-account-type",
      isAdminAccount ? "admin" : "user",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      },
    );

    response.cookies.set("admin-user-id", admin._id?.toString?.() || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}