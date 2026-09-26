import type { TemplateProps, TemplateSelectionInfo } from "../types";

/**
 * Wordless layout row that sets two blocks side by side, in equal columns,
 * once the artefact itself is wide enough, and stacks them otherwise. It runs
 * wider than full-width blocks so each column keeps a comfortable measure.
 */
export function TwoColumn({ children }: TemplateProps) {
	return (
		<div className="@container mx-auto w-full max-w-[1400px]">
			<div className="grid @4xl:grid-cols-2 @4xl:px-5 [&>section]:min-w-0 @4xl:[&>section]:px-5">
				{children}
			</div>
		</div>
	);
}

TwoColumn.template = "two-column" as const;
TwoColumn.info =
	"Wordless layout row that places exactly two compact blocks side by side in equal columns, such as a trend chart beside the table or checks it summarises. Pick it only when the two blocks are read together; it stacks them when the page is narrow.";
TwoColumn.children = {
	min: 2,
	max: 2,
	allowed: [
		"prose",
		"activity-trend",
		"evidence-table",
		"check-list",
		"commit-list",
		"task-list",
		"delivery-progress",
		"delivery-readiness",
		"service-ownership",
	],
} satisfies TemplateSelectionInfo["children"];
