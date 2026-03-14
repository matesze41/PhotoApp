import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import type { Storage } from "@/server/storage/storage";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

function safeJoin(base: string, key: string): string {
  const full = path.join(base, key);
  const normalizedBase = path.resolve(base);
  const normalizedFull = path.resolve(full);

  if (!normalizedFull.startsWith(normalizedBase)) {
    throw new Error("Invalid storage key (path traversal).");
  }

  return normalizedFull;
}

export class LocalFsStorage implements Storage {
  async putObject(key: string, data: Buffer): Promise<void> {
    const dir = getUploadDir();
    await fs.mkdir(dir, { recursive: true });
    const target = safeJoin(dir, key);
    await fs.writeFile(target, data);
  }

  async getObject(key: string): Promise<Buffer> {
    const dir = getUploadDir();
    const target = safeJoin(dir, key);
    return fs.readFile(target);
  }

  async deleteObject(key: string): Promise<void> {
    const dir = getUploadDir();
    const target = safeJoin(dir, key);
    await fs.rm(target, { force: true });
  }
}
