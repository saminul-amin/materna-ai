import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/dashboard", "/profile", "/monitoring", "/trends", "/explain", "/documents", "/assistant", "/ask-doctor", "/care", "/emergency", "/danger-signs", "/guide", "/wellbeing", "/birth-plan", "/reminders", "/medicine", "/family", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const token = req.cookies.get("materna_session")?.value;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET || "materna-insecure-dev-secret-change-me"));
      return NextResponse.next();
    } catch {
      /* fall through */
    }
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
