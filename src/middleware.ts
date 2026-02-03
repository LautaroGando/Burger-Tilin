import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");
  const isPublicAsset =
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/static") ||
    req.nextUrl.pathname.startsWith("/favicon.ico") ||
    req.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/);

  if (isPublicAsset) return;

  if (isOnLogin || req.nextUrl.pathname.startsWith("/menu")) {
    if (isOnLogin && isLoggedIn) {
      return Response.redirect(new URL("/admin", req.nextUrl));
    }
    return;
  }

  if (req.nextUrl.pathname === "/") {
    return Response.redirect(new URL("/admin", req.nextUrl));
  }

  if (req.nextUrl.pathname.startsWith("/admin") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Protect anything else that isn't login or menu?
  // No, let's keep it specific to /admin for transparency.
  if (!isLoggedIn && !req.nextUrl.pathname.startsWith("/menu")) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
