import { Card, Skeleton } from "@heroui/react";
import { FileText, ImageOff } from "lucide-react";
import { useState } from "react";
import type { FigureCrop } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function SourceFigure({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		caption: string;
		attachmentId: string;
		filename: string;
		page: number;
		crop: FigureCrop | null;
	};
	const src = context.figureSrc?.({ attachmentId: data.attachmentId, page: data.page, crop: data.crop });
	const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
	return (
		<BlockSection title={data.title} edit={{ node, context }}>
			<Card className="gap-0 overflow-hidden p-0">
				{src && state !== "failed" ? (
					<a href={src} target="_blank" rel="noreferrer" className="relative block bg-preview-surface">
						{state === "loading" && <Skeleton className="absolute inset-0 rounded-none" />}
						{/* Figures are always light: they are pictures of printed pages. */}
						<img
							src={src}
							alt={`${data.title}, page ${data.page} of ${data.filename}`}
							loading="lazy"
							onLoad={() => setState("loaded")}
							onError={() => setState("failed")}
							className="mx-auto block max-h-[36rem] w-auto max-w-full"
						/>
						{state === "loading" && <div className="h-64" />}
					</a>
				) : (
					<div className="grid h-40 place-items-center bg-surface-secondary text-sm text-muted">
						<span className="flex items-center gap-2">
							<ImageOff size={16} />
							This figure isn't available here.
						</span>
					</div>
				)}
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border px-4 py-3">
					<p className="min-w-0 flex-1 text-sm">{data.caption}</p>
					<span className="flex items-center gap-1.5 text-xs text-muted">
						<FileText size={13} />
						{data.filename}, page {data.page}
					</span>
				</div>
			</Card>
		</BlockSection>
	);
}

SourceFigure.template = "source-figure" as const;
SourceFigure.info =
	"A figure, diagram, schematic, or photo cropped from a page of an attached PDF, with a caption and page citation.";
SourceFigure.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
