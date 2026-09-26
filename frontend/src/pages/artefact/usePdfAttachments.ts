import { useState } from "react";

export type PendingAttachment = {
	/** Local key; the server id arrives once the upload finishes. */
	key: string;
	filename: string;
	status: "uploading" | "ready" | "failed";
	id?: string;
	pages?: number;
	error?: string;
};

/** Match the API: three PDFs of up to 20 MB each per artefact. */
export const maxAttachments = 3;
const maxBytes = 20 * 1024 * 1024;

export const isPdf = (file: File) =>
	file.type === "application/pdf" || /\.pdf$/i.test(file.name);

/** PDFs attached to the prompt, uploaded as soon as they're added. */
export function usePdfAttachments() {
	const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
	const update = (key: string, patch: Partial<PendingAttachment>) =>
		setAttachments((current) =>
			current.map((attachment) => (attachment.key === key ? { ...attachment, ...patch } : attachment)),
		);

	async function upload(key: string, file: File) {
		try {
			const response = await fetch("/api/uploads", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/pdf",
					"X-Filename": encodeURIComponent(file.name),
				},
				body: file,
			});
			if (!response.ok) {
				const body = (await response.json().catch(() => ({}))) as { error?: string };
				const error =
					response.status === 413 ? "This PDF is over 20 MB." : (body.error ?? "Upload failed.");
				return update(key, { status: "failed", error });
			}
			const result = (await response.json()) as { id: string; pages: number };
			update(key, { status: "ready", id: result.id, pages: result.pages });
		} catch {
			update(key, { status: "failed", error: "Upload failed." });
		}
	}

	/** Starts uploading the PDFs among `files`; returns a message for any turned away. */
	function add(files: File[]) {
		const pdfs = files.filter(isPdf);
		const room = maxAttachments - attachments.length;
		const accepted = pdfs.slice(0, Math.max(room, 0));
		const added = accepted.map((file): PendingAttachment => ({
			key: crypto.randomUUID(),
			filename: file.name,
			status: file.size > maxBytes ? "failed" : "uploading",
			error: file.size > maxBytes ? "This PDF is over 20 MB." : undefined,
		}));
		setAttachments((current) => [...current, ...added]);
		added.forEach((attachment, index) => {
			if (attachment.status === "uploading") void upload(attachment.key, accepted[index]);
		});
		if (pdfs.length < files.length) return "Only PDF files can be attached.";
		if (accepted.length < pdfs.length) return `Attach up to ${maxAttachments} PDFs.`;
	}

	function remove(key: string) {
		const attachment = attachments.find((item) => item.key === key);
		setAttachments((current) => current.filter((item) => item.key !== key));
		if (attachment?.id)
			void fetch(`/api/uploads/${attachment.id}`, { method: "DELETE", credentials: "include" }).catch(
				() => {},
			);
	}

	return {
		attachments,
		add,
		remove,
		/** Forget the list once a generation has claimed the files. */
		clear: () => setAttachments([]),
		readyIds: attachments.flatMap((attachment) =>
			attachment.status === "ready" && attachment.id ? [attachment.id] : [],
		),
		isUploading: attachments.some((attachment) => attachment.status === "uploading"),
	};
}
