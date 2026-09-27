import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env.ts";

let client: S3Client | undefined;

function r2() {
	if (
		!env.r2Endpoint ||
		!env.r2Bucket ||
		!env.r2AccessKeyId ||
		!env.r2SecretAccessKey
	)
		return;
	return (client ??= new S3Client({
		region: "auto",
		endpoint: env.r2Endpoint,
		credentials: {
			accessKeyId: env.r2AccessKeyId,
			secretAccessKey: env.r2SecretAccessKey,
		},
	}));
}

const previewKey = (artefactId: string) =>
	`artefact-previews/${artefactId}.png`;
const avatarKey = (userId: string) => `profile-avatars/${userId}`;

/** Saves a generated preview without making the R2 bucket public. */
export async function putArtefactPreview(artefactId: string, body: Uint8Array) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return false;
	await storage.send(
		new PutObjectCommand({
			Bucket: env.r2Bucket,
			Key: previewKey(artefactId),
			Body: body,
			ContentType: "image/png",
			CacheControl: "public, max-age=300",
		}),
	);
	return true;
}

/** Loads an artefact preview for the app's public proxy route. */
export async function getArtefactPreview(artefactId: string) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return;
	const object = await storage.send(
		new GetObjectCommand({
			Bucket: env.r2Bucket,
			Key: previewKey(artefactId),
		}),
	);
	return object.Body?.transformToByteArray();
}

export async function putProfileAvatar(
	userId: string,
	body: Uint8Array,
	contentType: string,
) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return false;
	await storage.send(
		new PutObjectCommand({
			Bucket: env.r2Bucket,
			Key: avatarKey(userId),
			Body: body,
			ContentType: contentType,
			CacheControl: "private, max-age=86400",
		}),
	);
	return true;
}

export async function getProfileAvatar(userId: string) {
	const storage = r2();
	if (!storage || !env.r2Bucket) return;
	const object = await storage.send(
		new GetObjectCommand({ Bucket: env.r2Bucket, Key: avatarKey(userId) }),
	);
	const body = await object.Body?.transformToByteArray();
	return body && { body, contentType: object.ContentType ?? "image/jpeg" };
}
