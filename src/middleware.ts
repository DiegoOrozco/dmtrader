import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Protect Admin Routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const adminSession = request.cookies.get("admin_session")?.value;
        
        // Simple client-side redirect guard. Actual secure verification is enforced 
        // by Server Components & Server Actions via ensureAdmin().
        const verifiedValue = adminSession ? adminSession.split('.')[0] : null;

        if (verifiedValue !== "valid") {
            // DEVELOPER BYPASS: If we have ANY cookie in dev, let it go (Server Action will catch real issues)
            if (process.env.NODE_ENV === "development" && adminSession) {
                return response;
            }
            
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
