import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Next.js 16: proxy.ts (ranije middleware.ts) radi u Node.js runtime-u,
// pa ovde možemo da proverimo pravu sesiju iz baze.
// Ovo je prva linija zaštite; stranice i akcije i dalje zovu requireUser/requireRole.
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { pathname, search } = request.nextUrl;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard") && session.user.role !== "CLUB_OWNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/igrac/:path*", "/dashboard/:path*"],
};
