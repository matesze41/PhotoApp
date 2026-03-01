import "server-only";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import type { Storage } from "@/server/storage/storage";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required for Azure storage backend.`);
  }
  return value;
}

async function streamToBuffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of readable) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else {
      chunks.push(Buffer.from(chunk));
    }
  }

  return Buffer.concat(chunks);
}

export class AzureBlobStorage implements Storage {
  private readonly containerClient: ContainerClient;
  private readonly ensureContainerPromise: Promise<void>;

  constructor() {
    const connectionString = getRequiredEnv("AZURE_STORAGE_CONNECTION_STRING");
    const containerName = getRequiredEnv("AZURE_STORAGE_CONTAINER");

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
    this.ensureContainerPromise = this.containerClient.createIfNotExists().then(() => undefined);
  }

  private async getBlobClient(key: string) {
    await this.ensureContainerPromise;
    return this.containerClient.getBlockBlobClient(key);
  }

  async putObject(key: string, data: Buffer): Promise<void> {
    const blobClient = await this.getBlobClient(key);
    await blobClient.uploadData(data);
  }

  async getObject(key: string): Promise<Buffer> {
    const blobClient = await this.getBlobClient(key);
    const response = await blobClient.download();

    const readable = response.readableStreamBody;
    if (!readable) {
      throw new Error("Azure Blob download response has no readable stream.");
    }

    return streamToBuffer(readable);
  }

  async deleteObject(key: string): Promise<void> {
    const blobClient = await this.getBlobClient(key);
    await blobClient.deleteIfExists();
  }
}
