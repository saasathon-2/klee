import { Paragraph } from "@heroui/react";
import { BlockSection } from "../page/BlockSection";
import { EditableText } from "../page/EditableText";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function Prose({ node, context }: TemplateProps) {
	const body = String(node.data.body);
	const paragraphs = body.split(/\n\s*\n/);
	return (
		<BlockSection title={String(node.data.title)} edit={{ node, context }}>
			<div className="-mt-3 space-y-3">
				{context.isEditing ? (
					<EditableText node={node} context={context} path={["body"]} value={body} label="Body" multiline />
				) : (
					paragraphs.map((paragraph, index) => (
						<Paragraph key={index}>{paragraph}</Paragraph>
					))
				)}
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
