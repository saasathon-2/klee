import { Paragraph } from "@heroui/react";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function Prose({ node }: TemplateProps) {
	const paragraphs = String(node.data.body).split(/\n\s*\n/);
	return (
		<BlockSection title={String(node.data.title)}>
			<div className="-mt-3 space-y-3">
				{paragraphs.map((paragraph, index) => (
					<Paragraph key={index}>{paragraph}</Paragraph>
				))}
			</div>
		</BlockSection>
	);
}

Prose.template = "prose" as const;
Prose.info =
	"General-purpose titled narrative for summaries, explanations, decisions, or context that has no richer supported visual block. Prefer a specialised block when one represents the information accurately.";
Prose.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
