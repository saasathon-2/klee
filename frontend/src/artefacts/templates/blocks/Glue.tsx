import type { ReactNode } from "react";
import { Paragraph } from "@heroui/react";
import { EditableText } from "../page/EditableText";
import { Scallop } from "../page/Scallop";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function GlueBand({ children }: { children: ReactNode }) {
	return (
		<div className="my-4 text-brand-foreground">
			<Scallop edge="top" />
			<div className="bg-brand px-6 py-3">
				<Paragraph align="center" weight="medium" className="text-inherit">
					{children}
				</Paragraph>
			</div>
			<Scallop edge="bottom" />
		</div>
	);
}

export function Glue({ node, context }: TemplateProps) {
	return (
		<GlueBand>
			<EditableText
				node={node}
				context={context}
				path={["label"]}
				value={String(node.data.label)}
				label="Transition text"
				className="text-center"
			/>
		</GlueBand>
	);
}

Glue.template = "glue" as const;
Glue.info =
	"Short transition that explains the relationship between adjacent blocks. Pick it only when the conceptual jump would otherwise be unclear; omit it between naturally related sections.";
Glue.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
