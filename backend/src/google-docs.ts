import { auth } from "./auth.ts";
import { pool } from "./db.ts";

const driveFileScope = "https://www.googleapis.com/auth/drive.file";
const googleDocumentMimeType = "application/vnd.google-apps.document";
const googleSpreadsheetMimeType = "application/vnd.google-apps.spreadsheet";
const maxFiles = 5;
const maxFileChars = 6000;
// ponytail: read only the first 3 tabs and A1:T100; add configurable ranges if broader Sheets context is needed.
const maxSheetTabs = 3;

export type DevelopmentNote = {
	sourceId: string;
	title: string;
	url: string;
	text: string;
};

async function driveAccount(userId: string) {
	const { rows } = await pool.query(
		`select id, scope from account where "userId" = $1 and "providerId" = 'google' order by "updatedAt" desc`,
		[userId],
	);
	return rows.find((row) =>
		String(row.scope ?? "").split(/[\s,]+/).includes(driveFileScope),
	);
}

/** Remove Klee's Drive grant without unlinking the user's Google sign-in. */
export async function disconnectGoogleDrive(userId: string) {
	const account = await driveAccount(userId);
	if (!account) return;
	const scope = String(account.scope ?? "")
		.split(/[\s,]+/)
		.filter((value) => value && value !== driveFileScope)
		.join(" ");
	await pool.query(
		`update account
		set "accessToken" = null, "refreshToken" = null,
			"accessTokenExpiresAt" = null, "refreshTokenExpiresAt" = null,
			"scope" = $1, "updatedAt" = current_timestamp
		where id = $2`,
		[scope, account.id],
	);
}

export async function googleDriveAccessToken(userId: string) {
	const account = await driveAccount(userId);
	if (!account) return undefined;
	const tokens = await auth.api.getAccessToken({
		body: { accountId: account.id, userId },
	});
	return tokens.accessToken;
}

async function googleRequest(token: string, url: string) {
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!response.ok)
		throw new Error(`Google file request failed (${response.status})`);
	return response.json() as Promise<Record<string, unknown>>;
}

function documentText(value: unknown): string {
	const pieces: string[] = [];
	const visit = (node: unknown) => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) return node.forEach(visit);
		const record = node as Record<string, unknown>;
		const textRun = record.textRun;
		if (textRun && typeof textRun === "object") {
			const content = (textRun as Record<string, unknown>).content;
			if (typeof content === "string") pieces.push(content);
		}
		Object.values(record).forEach(visit);
	};
	visit(value);
	return pieces.join("").replace(/\n{3,}/g, "\n\n").trim();
}

function spreadsheetText(value: Record<string, unknown>): string {
	const ranges = Array.isArray(value.valueRanges) ? value.valueRanges : [];
	return ranges
		.map((range) => {
			if (!range || typeof range !== "object") return "";
			const record = range as Record<string, unknown>;
			const rows = Array.isArray(record.values) ? record.values : [];
			return rows
				.map((row) => (Array.isArray(row) ? row.join(" | ") : ""))
				.filter(Boolean)
				.join("\n");
		})
		.filter(Boolean)
		.join("\n\n");
}

async function sheetText(token: string, spreadsheetId: string) {
	const spreadsheet = await googleRequest(
		token,
		`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
	);
	const sheets = Array.isArray(spreadsheet.sheets) ? spreadsheet.sheets : [];
	const ranges = sheets
		.slice(0, maxSheetTabs)
		.map((sheet) => {
			const title = (sheet as { properties?: { title?: unknown } }).properties
				?.title;
			return typeof title === "string"
				? `'${title.replaceAll("'", "''")}'!A1:T100`
				: undefined;
		})
		.filter((range): range is string => Boolean(range));
	if (!ranges.length) return "";
	const params = new URLSearchParams();
	ranges.forEach((range) => params.append("ranges", range));
	const values = await googleRequest(
		token,
		`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${params}`,
	);
	return spreadsheetText(values);
}

type GoogleFile = {
	id: string;
	title: string;
	url: string;
	mimeType: string;
};

function fileIds(ids: string[]) {
	const uniqueIds = [...new Set(ids)];
	if (uniqueIds.length > maxFiles)
		throw new Error("Choose between 1 and 5 Google Docs or Sheets.");
	if (uniqueIds.some((id) => !/^[\w-]{10,}$/.test(id)))
		throw new Error("Invalid Google file selection.");
	return uniqueIds;
}

async function googleFiles(token: string, ids: string[]) {
	return Promise.all(
		fileIds(ids).map(async (id): Promise<GoogleFile> => {
			const file = await googleRequest(
				token,
				`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,webViewLink`,
			);
			if (
				(file.mimeType !== googleDocumentMimeType &&
					file.mimeType !== googleSpreadsheetMimeType) ||
				typeof file.name !== "string"
			)
				throw new Error("Select Google Docs or Sheets only.");
			return {
				id,
				title: file.name,
				url:
					typeof file.webViewLink === "string"
						? file.webViewLink
						: file.mimeType === googleSpreadsheetMimeType
							? `https://docs.google.com/spreadsheets/d/${id}/edit`
							: `https://docs.google.com/document/d/${id}/edit`,
				mimeType: file.mimeType,
			};
		}),
	);
}

export async function googleDevelopmentNotes(
	userId: string,
	selectedFileIds: string[] = [],
): Promise<DevelopmentNote[]> {
	if (!selectedFileIds.length) return [];
	const token = await googleDriveAccessToken(userId);
	if (!token) throw new Error("Reconnect Google Docs to use selected files.");
	const files = await googleFiles(token, selectedFileIds);
	return Promise.all(
		files.map(async (file) => {
			const text =
				file.mimeType === googleDocumentMimeType
					? documentText(
							await googleRequest(
								token,
								`https://docs.googleapis.com/v1/documents/${encodeURIComponent(file.id)}`,
							),
						)
					: await sheetText(token, file.id);
			return {
				sourceId: file.id,
				title: file.title,
				url: file.url,
				text: text.slice(0, maxFileChars),
			};
		}),
	);
}

export function addNoteEvidence(document: { root: { children?: { template: string; children?: { template: string; data: Record<string, unknown> }[] }[] } }, notes: DevelopmentNote[]) {
	if (!notes.length) return;
	const category = document.root.children?.find((node) => ["developer-page", "generic-page"].includes(node.template));
	const candidates = category?.children?.filter((node) => node.template === "note-evidence") ?? [];
	const items = candidates.flatMap((node) => Array.isArray(node.data.items) ? node.data.items : [])
		.filter((item): item is { sourceId: string; change: string; justification: string } => Boolean(item) && typeof item === "object" && typeof (item as { sourceId?: unknown }).sourceId === "string" && typeof (item as { change?: unknown }).change === "string" && typeof (item as { justification?: unknown }).justification === "string")
		.flatMap((item) => {
			const note = notes.find((candidate) => candidate.sourceId === item.sourceId);
			return note ? [{ title: note.title, url: note.url, change: item.change.slice(0, 120), justification: item.justification.slice(0, 280) }] : [];
		});
	if (!category || !items.length) return;
	category.children = (category.children ?? []).filter((node) => node.template !== "note-evidence");
	category.children.push({ template: "note-evidence", data: { items } });
}
