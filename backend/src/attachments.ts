import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Per-file cap; OpenAI accepts PDFs up to 32 MB per request in total. */
export const maxAttachmentBytes = 20 * 1024 * 1024;
export const maxAttachmentPages = 100;
/** Files per generation, and their combined size. */
export const maxAttachmentsPerArtefact = 3;
export const maxAttachmentBytesPerArtefact = 30 * 1024 * 1024;

/** Figures render at this resolution; enough for datasheet text at full width. */
const figureDpi = 150;
const toolTimeoutMs = 20_000;

export class AttachmentError extends Error {}

/** True when the bytes start like a PDF (the header may follow a little junk). */
export function looksLikePdf(bytes: Uint8Array) {
	const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
	return head.includes("%PDF-");
}

/** A readable, bounded filename for display and for the model. */
export function cleanFilename(name: string | undefined) {
	const cleaned = (name ?? "")
		.replace(/[\u0000-\u001f\u007f/\\]/g, "")
		.trim()
		.slice(0, 120);
	return cleaned || "document.pdf";
}

export type Crop = { x: number; y: number; width: number; height: number };

/**
 * Parses and bounds a crop given as fractions of the page (0-1). Returns
 * undefined for a whole page. Values are rounded so cache keys stay stable.
 */
export function parseCrop(value: unknown): Crop | undefined {
	if (typeof value !== "string" || !value) return;
	const parts = value.split(",").map(Number);
	if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return;
	const round = (part: number) => Math.round(Math.min(1, Math.max(0, part)) * 1000) / 1000;
	const [x, y] = parts.map(round);
	const width = round(Math.min(parts[2], 1 - x));
	const height = round(Math.min(parts[3], 1 - y));
	if (width < 0.02 || height < 0.02) return;
	return { x, y, width, height };
}

export function figureKey(attachmentId: string, page: number, crop: Crop | undefined) {
	const area = crop ? `${crop.x}-${crop.y}-${crop.width}-${crop.height}` : "page";
	return `figures/${attachmentId}/${page}-${area}.png`;
}

async function withTempPdf<T>(bytes: Uint8Array, work: (path: string, dir: string) => Promise<T>) {
	const dir = await mkdtemp(join(tmpdir(), "klee-pdf-"));
	try {
		const path = join(dir, "input.pdf");
		await writeFile(path, bytes);
		return await work(path, dir);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

/** Page count of a PDF, rejecting anything poppler can't open. */
export async function inspectPdf(bytes: Uint8Array) {
	if (!looksLikePdf(bytes)) throw new AttachmentError("Only PDF files can be attached.");
	const output = await withTempPdf(bytes, (path) =>
		run("pdfinfo", [path], { timeout: toolTimeoutMs }).then(({ stdout }) => stdout),
	).catch((error: unknown) => {
		if (error instanceof AttachmentError) throw error;
		throw new AttachmentError("That PDF couldn't be read. It may be damaged or password-protected.");
	});
	const pages = Number(output.match(/^Pages:\s+(\d+)/m)?.[1]);
	if (!pages) throw new AttachmentError("That PDF has no pages.");
	if (pages > maxAttachmentPages)
		throw new AttachmentError(`PDFs can have at most ${maxAttachmentPages} pages.`);
	return { pages };
}

/** Renders one page, or a region of it, to PNG. */
export async function renderFigure(bytes: Uint8Array, page: number, crop: Crop | undefined) {
	return withTempPdf(bytes, async (path, dir) => {
		const args = ["-png", "-r", String(figureDpi), "-f", String(page), "-l", String(page), "-singlefile"];
		if (crop) {
			const { stdout } = await run("pdfinfo", ["-f", String(page), "-l", String(page), path], {
				timeout: toolTimeoutMs,
			});
			const size = stdout.match(/Page\s+\d+\s+size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/);
			if (!size) throw new AttachmentError("Couldn't measure the page.");
			const pixels = (points: string) => (Number(points) / 72) * figureDpi;
			const [width, height] = [pixels(size[1]), pixels(size[2])];
			args.push(
				"-x", String(Math.floor(crop.x * width)),
				"-y", String(Math.floor(crop.y * height)),
				"-W", String(Math.ceil(crop.width * width)),
				"-H", String(Math.ceil(crop.height * height)),
			);
		}
		const output = join(dir, "figure");
		await run("pdftoppm", [...args, path, output], { timeout: toolTimeoutMs });
		return new Uint8Array(await readFile(`${output}.png`));
	});
}
