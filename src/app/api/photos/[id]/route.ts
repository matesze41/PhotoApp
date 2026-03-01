import { NextRequest } from "next/server";
import { deletePhotoById } from "@/server/services/photoService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get("x-auth-user-id");
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    await deletePhotoById(id, userId);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba";
    return Response.json({ error: msg }, { status: 400 });
  }
}