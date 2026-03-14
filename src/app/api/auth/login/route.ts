import { prisma } from "@/server/db/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE } from "@/server/auth/session";
import { AppError } from "@/server/http/errors";
import { withErrorHandling } from "@/server/http/withErrorHandling";

export const POST = withErrorHandling(async (req: Request) => {
  const { email, password } = await req.json();

  if (!email || !password) {
    throw new AppError({
      message: "Missing fields",
      status: 400,
      code: "BAD_REQUEST",
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError({
      message: "Invalid credentials",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError({
      message: "Invalid credentials",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

  return Response.json({ success: true });
});