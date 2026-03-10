import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      if (
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/register") ||
        path.startsWith("/api/trending/scrape") || // Allow scrape to be triggered if needed, but our APIs check token
        path.startsWith("/api/spy/scrape") || // Exclude scrape api
        path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
      ) {
        return true;
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
