import { Chip, Heading, Paragraph } from "@heroui/react";
import { Scallop } from "../page/Scallop";
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
			<header className="text-lavender-foreground">
				<div className="relative flex flex-col items-center gap-3 bg-lavender px-6 pt-10 pb-5 text-center sm:px-10">
					<img src="/klee.svg" alt="Klee" className="absolute top-5 left-6 h-5 w-auto sm:left-10" />
					<Heading
						level={2}
						align="center"
						className="text-balance text-inherit"
					>
						{data.title}
					</Heading>
					<Paragraph
						align="center"
						className="max-w-2xl text-inherit opacity-80"
					>
						{data.summary}
					</Paragraph>
					<div className="flex flex-wrap items-center justify-center gap-2">
						{data.tags.map((tag) => (
							<Chip key={tag} size="sm">
								{tag}
							</Chip>
						))}
						<span className="text-xs opacity-70">
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
				<Scallop edge="bottom" />
			</header>
			<div className="pt-4 [&>section]:mx-auto [&>section]:w-full [&>section]:max-w-[1000px]">
				{children}
			</div>
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
		"architecture-flow",
		"glue",
		"task-list",
		"next-steps",
		"prose",
		"review-comments",
		"commit-list",
		"check-list",
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
