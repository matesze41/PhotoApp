import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { storage } from "@/server/storage/storage";
import * as repo from "@/server/repositories/photoRepository";

function normalizeName(name: string): string {
  return name.trim();
}

export function validatePhotoName(name: string) {
  const n = normalizeName(name);
  if (!n) throw new Error("A név kötelező.");
  if (n.length > 40) throw new Error("A név maximum 40 karakter lehet.");
  return n;
}

export async function createPhotoFromUpload(params: { name: string; file: File; userId: string }) {
  const name = validatePhotoName(params.name);

  if (!params.file || params.file.size === 0) {
    throw new Error("A fájl kötelező.");
  }

  const ext = path.extname(params.file.name || "").toLowerCase();
  const key = `${randomUUID()}${ext}`;

  const buf = Buffer.from(await params.file.arrayBuffer());
  await storage.putObject(key, buf);

  return repo.createPhoto({
    name,
    userId: params.userId,
    storageKey: key,
    originalFilename: params.file.name || undefined,
    mimeType: params.file.type || undefined,
  });
}

export async function deletePhotoById(id: string, userId: string) {
  const photo = await repo.getPhoto(id, userId);
  if (!photo) throw new Error("Nincs ilyen kép.");

  await storage.deleteObject(photo.storageKey);
  await repo.deletePhoto(id, userId);
}

export async function getPhotoImage(id: string) {
  const photo = await repo.getPhotoPublic(id);
  if (!photo) throw new Error("Nincs ilyen kép.");

  const data = await storage.getObject(photo.storageKey);
  return { data, mimeType: photo.mimeType ?? "application/octet-stream" };
}