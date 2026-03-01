import { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { createPhotoFromUpload } from "@/server/services/photoService";

type PhotoListItem = {
  id: string;
  name: string;
  createdAt: Date;
  userId: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAuthedUserId(req: NextRequest) {
  return req.headers.get("x-auth-user-id");
}

/**
 * GET /api/photos
 * Minden kép listázása publikus
 */
export async function GET(req: NextRequest) {
  const viewerUserId = getAuthedUserId(req);
  const isAuthenticated = Boolean(viewerUserId);

  const url = new URL(req.url);
  const sortRaw = (url.searchParams.get("sort") ?? "date").toLowerCase();
  const dirRaw = (url.searchParams.get("dir") ?? "desc").toLowerCase();

  const sortBy = sortRaw === "name" ? "name" : "createdAt";
  const dir = dirRaw === "asc" ? "asc" : "desc";

  const items = await prisma.photo.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      userId: true,
    },
    orderBy: { [sortBy]: dir },
  });

  return Response.json(
    (items as PhotoListItem[]).map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.toISOString(),
      canDelete: viewerUserId === p.userId,
    })),
    {
      headers: {
        "Cache-Control": "no-store",
        "x-authenticated": isAuthenticated ? "1" : "0",
      },
    }
  );
}

/**
 * POST /api/photos
 * Feltöltés – csak bejelentkezett user
 */
export async function POST(req: NextRequest) {
  const userId = getAuthedUserId(req);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "");
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "file mező hiányzik vagy nem fájl." },
        { status: 400 }
      );
    }

    const created = await createPhotoFromUpload({ name, file, userId });

    return Response.json(
      {
        id: created.id,
        name: created.name,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba";
    return Response.json({ error: msg }, { status: 400 });
  }
}