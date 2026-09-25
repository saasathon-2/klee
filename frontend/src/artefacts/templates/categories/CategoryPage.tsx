import { Layers3 } from "lucide-react";
import type { Template, TemplateProps, TemplateSelectionInfo } from "../types";

const CategoryPage: Template = ({ node, children, context }) => {
	const data = node.data as {
		eyebrow: string;
		title: string;
		summary: string;
		tags: string[];
	};

	return (
		<>
			<header className="relative overflow-hidden border-b border-divider bg-accent px-6 py-8 text-accent-foreground sm:px-10 sm:py-12">
				<div className="absolute -right-10 -top-16 size-48 rounded-full border-[28px] border-accent-foreground/10" />
				<div className="relative max-w-2xl">
					<p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
						<Layers3 size={14} /> {data.eyebrow}
					</p>
					<h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
						{data.title}
					</h2>
					<p className="mt-5 max-w-xl text-base leading-7 text-accent-foreground/75 sm:text-lg">
						{data.summary}
					</p>
					<div className="mt-7 flex flex-wrap items-center gap-2">
						{data.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full border border-accent-foreground/20 px-3 py-1 text-xs font-medium"
							>
								{tag}
							</span>
						))}
						<span className="ml-auto text-xs text-accent-foreground/60">
							{new Date(context.createdAt).toLocaleDateString(
								undefined,
								{
									day: "numeric",
									month: "short",
									year: "numeric",
								},
							)}
						</span>
					</div>
				</div>
			</header>
			<div className="space-y-0">{children}</div>
		</>
	);
};

export function DeveloperPage(props: TemplateProps) {
	return <CategoryPage {...props} />;
}

DeveloperPage.template = "developer-page" as const;
DeveloperPage.info =
	"Developer-focused page for prompts about code, pull requests, branches, architecture, APIs, deployments, tickets, or sprint work. Prefer specialised engineering blocks when their information is available.";
DeveloperPage.children = {
	min: 1,
	max: 8,
	allowed: [
		"metric-row",
		"code-diff",
		"architecture-flow",
		"glue",
		"task-list",
		"next-steps",
		"prose",
	],
} satisfies TemplateSelectionInfo["children"];

export function GenericPage(props: TemplateProps) {
	return <CategoryPage {...props} />;
}

GenericPage.template = "generic-page" as const;
GenericPage.info =
	"Fallback page for requests without a supported specialist category. Use broadly applicable prose, summaries, metrics, transitions, and next steps to fit the available context.";
GenericPage.children = {
	min: 1,
	max: 8,
	allowed: ["prose", "metric-row", "glue", "next-steps"],
} satisfies TemplateSelectionInfo["children"];
