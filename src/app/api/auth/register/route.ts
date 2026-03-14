import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";
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

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError({
      message: "Missing fields",
      status: 400,
      code: "BAD_REQUEST",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed },
    });

    const token = await createSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());

    return Response.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError({
        message: "User exists",
        status: 409,
        code: "CONFLICT",
      });
    }

    throw error;
  }
});