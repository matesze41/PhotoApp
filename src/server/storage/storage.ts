import "server-only";
import { AzureBlobStorage } from "@/server/storage/azureBlobStorage";
import { LocalFsStorage } from "@/server/storage/localFsStorage";

export interface Storage {
  putObject(key: string, data: Buffer): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
}

export type StorageBackend = "local" | "azure";

function getStorageBackend(): StorageBackend {
  const backend = (process.env.STORAGE_BACKEND ?? "local").toLowerCase();

  if (backend === "azure") {
    return "azure";
  }

  return "local";
}

function createStorage(): Storage {
  const backend = getStorageBackend();

  if (backend === "azure") {
    return new AzureBlobStorage();
  }

  return new LocalFsStorage();
}

export const storage: Storage = createStorage();