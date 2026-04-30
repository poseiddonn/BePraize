import { NextResponse } from "next/server";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    expires: new Date(0),
  });
}

export async function POST() {
  try {
    // Create response that clears the authentication cookie
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    // Clear the authentication cookie with multiple methods to ensure it's removed
    clearCookie(response, "admin-auth");
    clearCookie(response, "admin-username");
    clearCookie(response, "admin-account-type");
    clearCookie(response, "admin-user-id");

    // Also try to clear any potential session cookies
    clearCookie(response, "session");

    return response;
  } catch (error) {
    // Even if there's an error, try to clear cookies
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );

    clearCookie(response, "admin-auth");
    clearCookie(response, "admin-username");
    clearCookie(response, "admin-account-type");
    clearCookie(response, "admin-user-id");

    return response;
  }
}
