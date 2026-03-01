import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ success: true });
}