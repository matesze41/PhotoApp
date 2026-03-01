import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionToken, SESSION_COOKIE } from "@/server/auth/session";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = await parseSessionToken(token);

  const isReadOnlyGet = req.method === "GET";

  if (!isReadOnlyGet && !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-auth-user-id", userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/photos/:path*"],
};
