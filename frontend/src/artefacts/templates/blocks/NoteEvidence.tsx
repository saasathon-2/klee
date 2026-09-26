import { Link, Paragraph } from "@heroui/react";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

type NoteEvidenceItem = { title: string; url: string; change: string; justification: string };

export function NoteEvidence({ node }: TemplateProps) {
	const items = (node.data.items as NoteEvidenceItem[] | undefined) ?? [];
	return (
		<BlockSection title="Development notes">
			<div className="-mt-3 space-y-4">
				{items.map((item, index) => (
					<div key={`${item.url}-${index}`}>
						<Paragraph size="sm" className="font-medium">{item.change}</Paragraph>
						<Paragraph>{item.justification}</Paragraph>
						<Link href={item.url} target="_blank" rel="noreferrer" className="text-sm">{item.title}</Link>
					</div>
				))}
			</div>
		</BlockSection>
	);
}

NoteEvidence.template = "note-evidence" as const;
NoteEvidence.info = "Paraphrased rationale linked to selected Google development notes.";
NoteEvidence.children = { min: 0, max: 0, allowed: [] } satisfies TemplateSelectionInfo["children"];
