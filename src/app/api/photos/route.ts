import { NextRequest } from "next/server";
import { listPhotos, SortBy, SortDir } from "@/server/repositories/photoRepository";
import { createPhotoFromUpload } from "@/server/services/photoService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseSort(url: URL): { sortBy: SortBy; dir: SortDir } {
  const sortRaw = (url.searchParams.get("sort") ?? "date").toLowerCase();
  const dirRaw = (url.searchParams.get("dir") ?? "desc").toLowerCase();

  const sortBy: SortBy = sortRaw === "name" ? "name" : "date";
  const dir: SortDir = dirRaw === "asc" ? "asc" : "desc";

  return { sortBy, dir };
}

export async function GET(req: NextRequest) {
  const { sortBy, dir } = parseSort(new URL(req.url));
  const items = await listPhotos(sortBy, dir);

  return Response.json(
    items.map((p) => ({ id: p.id, name: p.name, createdAt: p.createdAt.toISOString() })),
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "");
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "file mező hiányzik vagy nem fájl." }, { status: 400 });
    }

    const created = await createPhotoFromUpload({ name, file });

    return Response.json(
      { id: created.id, name: created.name, createdAt: created.createdAt.toISOString() },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba";
    return Response.json({ error: msg }, { status: 400 });
  }
}