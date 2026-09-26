import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env.ts";

let client: S3Client | undefined;

function r2() {
	if (!env.r2Endpoint || !env.r2Bucket || !env.r2AccessKeyId || !env.r2SecretAccessKey)
		return;
	return (client ??= new S3Client({
		region: "auto",
		endpoint: env.r2Endpoint,
		credentials: { accessKeyId: env.r2AccessKeyId, secretAccessKey: env.r2SecretAccessKey },
	}));
}

const previewKey = (artefactId: string) => `artefact-previews/${artefactId}.png`;

/** Saves a generated preview without making the R2 bucket public. */
export async function putArtefactPreview(artefactId: string, body: Uint8Array) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return false;
	await storage.send(new PutObjectCommand({
		Bucket: env.r2Bucket,
		Key: previewKey(artefactId),
		Body: body,
		ContentType: "image/png",
		CacheControl: "public, max-age=300",
	}));
	return true;
}

/** Loads an artefact preview for the app's public proxy route. */
export async function getArtefactPreview(artefactId: string) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return;
	const object = await storage.send(new GetObjectCommand({ Bucket: env.r2Bucket, Key: previewKey(artefactId) }));
	return object.Body?.transformToByteArray();
}

/*
 * Private files (uploaded PDFs and the figures cropped from them). They live in
 * R2 when it is configured; local development without R2 keeps them on disk.
 */
const localRoot = new URL("../.data/files/", import.meta.url).pathname;
const localPath = (key: string) => join(localRoot, ...key.split("/"));

export async function putFile(key: string, body: Uint8Array, contentType: string) {
	const storage = r2();
	if (storage && env.r2Bucket) {
		await storage.send(new PutObjectCommand({
			Bucket: env.r2Bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
		}));
		return;
	}
	await mkdir(dirname(localPath(key)), { recursive: true });
	await writeFile(localPath(key), body);
}

/** The file's bytes, or undefined when it doesn't exist. */
export async function getFile(key: string): Promise<Uint8Array | undefined> {
	const storage = r2();
	if (storage && env.r2Bucket) {
		try {
			const object = await storage.send(new GetObjectCommand({ Bucket: env.r2Bucket, Key: key }));
			return object.Body?.transformToByteArray();
		} catch (error) {
			if ((error as { name?: string }).name === "NoSuchKey") return;
			throw error;
		}
	}
	return readFile(localPath(key)).then(
		(buffer) => new Uint8Array(buffer),
		(error: NodeJS.ErrnoException) => {
			if (error.code === "ENOENT") return undefined;
			throw error;
		},
	);
}

export async function deleteFile(key: string) {
	const storage = r2();
	if (storage && env.r2Bucket) {
		await storage.send(new DeleteObjectCommand({ Bucket: env.r2Bucket, Key: key }));
		return;
	}
	await rm(localPath(key), { force: true });
}
