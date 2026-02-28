import "server-only";
import { prisma } from "@/server/db/prisma";

export type SortBy = "name" | "date";
export type SortDir = "asc" | "desc";

export async function listPhotos(sortBy: SortBy, dir: SortDir) {
  const orderBy = sortBy === "name" ? { name: dir } : { createdAt: dir };

  return prisma.photo.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy,
  });
}

export async function getPhoto(id: string) {
  return prisma.photo.findUnique({
    where: { id },
  });
}

export async function createPhoto(params: {
  name: string;
  storageKey: string;
  originalFilename?: string;
  mimeType?: string;
}) {
  return prisma.photo.create({
    data: {
      name: params.name,
      storageKey: params.storageKey,
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
    },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function deletePhoto(id: string) {
  return prisma.photo.delete({
    where: { id },
  });
}