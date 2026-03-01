import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/session";
import { withErrorHandling } from "@/server/http/withErrorHandling";

export const POST = withErrorHandling(async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return Response.json({ success: true });
});