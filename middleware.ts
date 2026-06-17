import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-dev-only-change-in-prod';

async function verifySession(signedValue: string | undefined): Promise<string | null> {
    if (!signedValue) return null;
    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;
    const [value, signature] = parts;

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(SESSION_SECRET);
        const messageData = encoder.encode(value);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            cryptoKey,
            messageData
        );

        const hashArray = Array.from(new Uint8Array(signatureBuffer));
        const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        return signature === expectedSignature ? value : null;
    } catch (e) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Protect Admin Routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const adminSession = request.cookies.get("admin_session")?.value;
        const verifiedValue = await verifySession(adminSession);

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
