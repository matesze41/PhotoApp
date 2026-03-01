import { prisma } from "@/server/db/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE } from "@/server/auth/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return Response.json({ error: "Invalid" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return Response.json({ error: "Invalid" }, { status: 401 });

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

  return Response.json({ success: true });
}