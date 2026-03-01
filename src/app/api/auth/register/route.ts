import { prisma } from "@/server/db/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE } from "@/server/auth/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password)
    return Response.json({ error: "Missing fields" }, { status: 400 });

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail) return Response.json({ error: "Missing fields" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed },
    });

    const token = await createSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

    return Response.json({ id: user.id, email: user.email });
  } catch {
    return Response.json({ error: "User exists" }, { status: 400 });
  }
}