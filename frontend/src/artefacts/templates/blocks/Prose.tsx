import { Check } from "lucide-react";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function Prose({ node }: TemplateProps) {
	return (
		<section className="border-b border-divider px-6 py-9 sm:px-10 sm:py-12">
			<div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
				<Check size={17} />
			</div>
			<h3 className="mt-5 text-2xl font-semibold tracking-tight">
				{String(node.data.title)}
			</h3>
			<p className="mt-3 max-w-2xl text-base leading-7 text-muted">
				{String(node.data.body)}
			</p>
		</section>
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
