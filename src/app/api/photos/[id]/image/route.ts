import { getPhotoImage } from "@/server/services/photoService";
import { withErrorHandling } from "@/server/http/withErrorHandling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { data, mimeType } = await getPhotoImage(id);

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "no-store",
    },
  });
});