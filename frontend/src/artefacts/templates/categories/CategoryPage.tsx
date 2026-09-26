import { Chip, Heading, Paragraph } from "@heroui/react";
import { EditableText } from "../page/EditableText";
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
			<header className="text-brand-foreground">
				<div
					className={
						context.compactHeader
							? "relative bg-brand pb-2 pt-5"
							: "relative bg-brand pb-5 pt-10"
					}
				>
					<div
						className={`mx-auto flex w-full max-w-[1000px] flex-col items-start px-6 text-left sm:px-10 ${context.compactHeader ? "gap-1" : "gap-3"}`}
					>
						<Heading
							level={1}
							align="start"
							className="w-full text-balance text-inherit"
						>
							<EditableText
								node={node}
								context={context}
								path={["title"]}
								value={data.title}
								label="Artefact title"
							/>
						</Heading>
						{!context.compactHeader && (
							<Paragraph
								align="start"
								className="w-full max-w-2xl text-inherit opacity-80"
							>
								<EditableText
									node={node}
									context={context}
									path={["summary"]}
									value={data.summary}
									label="Summary"
									multiline
								/>
							</Paragraph>
						)}
						<div className="inline-flex flex-wrap justify-between gap-2 w-full">
							{!context.compactHeader && (
								<div className="inline-flex flex-wrap gap-2">
									{data.tags.map((tag) => (
										<Chip key={tag} size="sm">
											{tag}
										</Chip>
									))}
								</div>
							)}
							<Paragraph
								size="xs"
								className="text-inherit opacity-70"
							>
								{new Date(context.createdAt).toLocaleDateString(
									undefined,
									{
										day: "numeric",
										month: "short",
										year: "numeric",
									},
								)}
							</Paragraph>
						</div>
					</div>
				</div>
				<Scallop edge="bottom" />
			</header>
			<div
				data-slot="artefact-blocks"
				className="pt-4 [&>section]:mx-auto [&>section]:w-full [&>section]:max-w-[1000px]"
			>
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
