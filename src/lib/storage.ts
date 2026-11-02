import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type StorageDriver = "local" | "s3";

export function buildObjectKey(organizationId: string, installationId: string, ext: string): string {
  const safeExt = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return `${organizationId}/${installationId}/${randomUUID()}${safeExt}`;
}

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function createLocalStorage(): ObjectStorage {
  return {
    async put(key, body) {
      const fullPath = path.join(UPLOAD_DIR, key);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, body);
    },
    async get(key) {
      return readFile(path.join(UPLOAD_DIR, key));
    },
    async delete(key) {
      try {
        await unlink(path.join(UPLOAD_DIR, key));
      } catch {
        // Arquivo já ausente — a exclusão do registro no banco é o que importa.
      }
    },
  };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável de ambiente ${name} é obrigatória quando STORAGE_DRIVER=s3.`);
  }
  return value;
}

function createS3Storage(): ObjectStorage {
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  const bucket = requireEnv("S3_BUCKET");
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });

  return {
    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    },
    async get(key) {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        throw new Error(`Objeto vazio no storage: ${key}`);
      }
      return Buffer.from(bytes);
    },
    async delete(key) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
      } catch {
        // Mesmo critério do driver local: ausência no bucket não bloqueia.
      }
    },
  };
}

let cached: ObjectStorage | null = null;

export function getStorage(): ObjectStorage {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER?.trim().toLowerCase() || "local") as StorageDriver;
  cached = driver === "s3" ? createS3Storage() : createLocalStorage();
  return cached;
}
