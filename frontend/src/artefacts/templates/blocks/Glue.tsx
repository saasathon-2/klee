import { ArrowDown } from "lucide-react";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function Glue({ node }: TemplateProps) {
	return (
		<div className="flex items-center justify-center bg-foreground px-6 py-5 text-background">
			<span className="flex items-center gap-3 text-center text-sm font-medium">
				<ArrowDown size={16} className="text-accent" />
				{String(node.data.label)}
			</span>
		</div>
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
