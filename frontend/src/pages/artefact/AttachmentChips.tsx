import { Button, Spinner } from "@heroui/react";
import { CircleAlert, FileText, X } from "lucide-react";
import type { PendingAttachment } from "./usePdfAttachments";

/** The PDFs attached to the prompt, with upload state and a remove button. */
export function AttachmentChips({
	attachments,
	onRemove,
}: {
	attachments: PendingAttachment[];
	onRemove: (key: string) => void;
}) {
	if (!attachments.length) return null;
	return (
		<ul className="flex flex-wrap gap-2 px-1 pb-2" aria-label="Attached PDFs">
			{attachments.map((attachment) => (
				<li
					key={attachment.key}
					className={`flex max-w-full items-center gap-2 rounded-md border py-1 pr-1 pl-2 text-sm ${attachment.status === "failed" ? "border-danger/40 bg-danger-soft" : "border-border bg-surface-secondary"}`}
				>
					{attachment.status === "uploading" ? (
						<Spinner size="sm" aria-label="Uploading" />
					) : attachment.status === "failed" ? (
						<CircleAlert size={15} className="shrink-0 text-danger" />
					) : (
						<FileText size={15} className="shrink-0 text-muted" />
					)}
					<span className="min-w-0 truncate font-medium">{attachment.filename}</span>
					<span className="shrink-0 text-xs text-muted">
						{attachment.status === "failed"
							? attachment.error
							: attachment.status === "uploading"
								? "Uploading…"
								: `${attachment.pages} page${attachment.pages === 1 ? "" : "s"}`}
					</span>
					<Button
						aria-label={`Remove ${attachment.filename}`}
						variant="ghost"
						size="sm"
						className="size-6 min-w-6 p-0"
						onPress={() => onRemove(attachment.key)}
					>
						<X size={14} />
					</Button>
				</li>
			))}
		</ul>
	);
}
