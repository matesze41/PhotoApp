import { NextRequest } from "next/server";
import { deletePhotoById } from "@/server/services/photoService";
import { AppError } from "@/server/http/errors";
import { withErrorHandling } from "@/server/http/withErrorHandling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withErrorHandling(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const nextReq = req as NextRequest;
  const userId = nextReq.headers.get("x-auth-user-id");
  if (!userId) {
    throw new AppError({
      message: "Unauthorized",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  const { id } = await ctx.params;
  await deletePhotoById(id, userId);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
});