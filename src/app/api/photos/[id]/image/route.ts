import { getPhotoImage } from "@/server/services/photoService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const { data, mimeType } = await getPhotoImage(id);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba";
    return Response.json({ error: msg }, { status: 404 });
  }
}