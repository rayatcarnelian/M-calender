import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public routes — always allow through without auth check
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/api/auth",     // NextAuth internal routes (session, csrf, callback, etc.)
    "/api/register", // User registration endpoint
  ];

  const isPublic = publicPaths.some(p => path === p || path.startsWith(p + "/") || path.startsWith(p));

  // Static assets — always allow
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // Public paths — no auth needed
  if (isPublic) {
    return NextResponse.next();
  }

  // For all other paths, check for a valid JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "supersecret123" });

  if (!token) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
