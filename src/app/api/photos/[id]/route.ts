import { auth } from "@/auth";
import { deletePhotoById } from "@/server/services/photoService";
import { AppError } from "@/server/http/errors";
import { withErrorHandling } from "@/server/http/withErrorHandling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withErrorHandling(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

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