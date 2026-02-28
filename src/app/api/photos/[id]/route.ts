import { NextRequest } from "next/server";
import { deletePhotoById } from "@/server/services/photoService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await deletePhotoById(id);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba";
    return Response.json({ error: msg }, { status: 400 });
  }
}