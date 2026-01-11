import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    const { pathname } = request.nextUrl;

    // Public routes that don't need authentication
    const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/interview"];
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith("/api/auth"));

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Protect /dashboard routes - require authentication
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            const url = new URL("/auth/signin", request.url);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Protect /admin routes - require authentication AND admin role
    if (pathname.startsWith("/admin")) {
        if (!token) {
            const url = new URL("/auth/signin", request.url);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }

        if (!(token as any).isAdmin) {
            // Redirect non-admin users to their dashboard
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
