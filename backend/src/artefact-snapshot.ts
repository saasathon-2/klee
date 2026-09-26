import { createHmac, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";
import { env } from "./env.ts";

const localChrome =
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const snapshotTokenTtlSeconds = 120;

function snapshotSignature(artefactId: string, expiresAt: number) {
	return createHmac("sha256", env.betterAuthSecret)
		.update(`${artefactId}.${expiresAt}`)
		.digest("base64url");
}

/** Creates a short-lived, server-only URL for a private artefact screenshot. */
export function snapshotUrl(
	origin: string,
	artefactId: string,
	isShared: boolean,
) {
	const url = new URL(`/artefacts/shared/${artefactId}`, origin);
	if (isShared) return url.toString();
	const expiresAt = Math.floor(Date.now() / 1000) + snapshotTokenTtlSeconds;
	url.searchParams.set(
		"snapshot",
		`${expiresAt}.${snapshotSignature(artefactId, expiresAt)}`,
	);
	return url.toString();
}

/** Validates the short-lived token used only by the headless browser. */
export function validSnapshotToken(
	artefactId: string,
	token: string | undefined,
) {
	const [expiresText, signature] = token?.split(".") ?? [];
	const expiresAt = Number(expiresText);
	if (
		!Number.isSafeInteger(expiresAt) ||
		expiresAt < Math.floor(Date.now() / 1000) ||
		!signature
	)
		return false;
	const expected = snapshotSignature(artefactId, expiresAt);
	return (
		signature.length === expected.length &&
		timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
	);
}

/** Captures the public artefact page, so the social preview is the real UI. */
export async function captureArtefactSnapshot(url: string) {
	const executablePath =
		process.platform === "darwin" && existsSync(localChrome)
			? localChrome
			: await chromium.executablePath();
	const browser = await playwright.launch({
		args: process.platform === "darwin" ? [] : chromium.args,
		executablePath,
		headless: true,
	});
	try {
		const page = await browser.newPage({
			viewport: { width: 1200, height: 900 },
		});
		await page.goto(url, { waitUntil: "domcontentloaded" });
		await page.locator("main > *").first().waitFor({ timeout: 20_000 });
		await page
			.waitForLoadState("networkidle", { timeout: 5_000 })
			.catch(() => {});
		return await page.screenshot({ type: "png" });
	} finally {
		await browser.close();
	}
}
