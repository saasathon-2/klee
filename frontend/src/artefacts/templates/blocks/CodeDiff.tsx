import { Code2 } from "lucide-react";
import type { CodeDiff as CodeDiffData } from "../../model";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function CodeDiff({ node }: TemplateProps) {
	const { filename, summary, patch } = node.data as CodeDiffData;
	return (
		<section className="border-b border-divider px-6 py-9 sm:px-10 sm:py-12">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
					<Code2 size={17} />
				</div>
				<div>
					<h3 className="text-xl font-semibold tracking-tight">{filename}</h3>
					<p className="mt-1 text-sm leading-6 text-muted">{summary}</p>
				</div>
			</div>
			<pre className="mt-6 overflow-x-auto rounded-lg bg-foreground p-4 text-sm leading-6 text-background">
				<code>{patch}</code>
			</pre>
		</section>
	);
}

CodeDiff.template = "code-diff" as const;
CodeDiff.info =
	"A concise source diff excerpt with its filename and practical explanation. Use it for the one to three changed files most central to a developer artefact; do not use it to dump every file in a large change.";
CodeDiff.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
