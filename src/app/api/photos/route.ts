import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { createPhotoFromUpload } from "@/server/services/photoService";
import { AppError } from "@/server/http/errors";
import { withErrorHandling } from "@/server/http/withErrorHandling";

type PhotoListItem = {
  id: string;
  name: string;
  createdAt: Date;
  userId: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionUserId(session: unknown): string | null {
  const maybeUser = (session as { user?: { id?: string } } | null)?.user;
  return maybeUser?.id ?? null;
}

/**
 * GET /api/photos
 * Minden kép listázása publikus
 */
export const GET = withErrorHandling(async (req: Request) => {
  const session = await auth();
  const viewerUserId = getSessionUserId(session);
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
});

/**
 * POST /api/photos
 * Feltöltés – csak bejelentkezett user
 */
export const POST = withErrorHandling(async (req: Request) => {
  const session = await auth();
  const userId = getSessionUserId(session);

  if (!userId) {
    throw new AppError({
      message: "Unauthorized",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "");
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError({
      message: "file mező hiányzik vagy nem fájl.",
      status: 400,
      code: "VALIDATION_ERROR",
    });
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
});