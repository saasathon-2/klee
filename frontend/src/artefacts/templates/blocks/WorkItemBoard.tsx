import { Card, Chip, Code, Paragraph } from "@heroui/react";
import type { BoardColumn } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { editableFor } from "../page/editableFor";
import { workStatus } from "../page/workStatus";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

/** Items shown per column before the rest collapse into a “more” count. */
const visibleItems = 5;

const priorities = {
	urgent: { label: "Urgent", color: "danger" },
	high: { label: "High", color: "warning" },
	medium: { label: "Medium", color: "default" },
	low: { label: "Low", color: "default" },
} as const;

export function WorkItemBoard({ node, context }: TemplateProps) {
	const { title, description, columns } = node.data as {
		title: string;
		description: string;
		columns: BoardColumn[];
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<div
				className={`grid gap-3 sm:grid-cols-2 ${columns.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
			>
				{columns.map((column, columnIndex) => {
					const status = workStatus(column.id);
					const total = Math.max(column.total ?? 0, column.items.length);
					const more = total - Math.min(visibleItems, column.items.length);
					return (
						<section
							key={column.id}
							aria-label={column.label}
							className="flex min-w-0 flex-col gap-2 rounded-xl bg-surface-secondary p-2"
						>
							<header className="flex items-center gap-2 px-2 pt-1">
								<span aria-hidden className={`size-2 rounded-full ${status.fill}`} />
								<Paragraph size="sm" weight="medium" className="min-w-0 flex-1 truncate">
									{text(["columns", columnIndex, "label"], column.label, "Column name")}
								</Paragraph>
								<Chip size="sm" variant="tertiary">{total}</Chip>
							</header>
							{column.items.slice(0, visibleItems).map((item, index) => {
								const priority = item.priority ? priorities[item.priority] : undefined;
								return (
									<Card key={`${item.key}-${index}`} className="gap-2 p-3">
										<div className="flex items-center justify-between gap-2">
											<Code className="text-xs">
												<ExternalLink href={item.url}>{item.key}</ExternalLink>
											</Code>
											{priority && (
												<Chip size="sm" color={priority.color}>{priority.label}</Chip>
											)}
										</div>
										<Paragraph size="sm" weight="medium">
											{text(["columns", columnIndex, "items", index, "title"], item.title, "Item title")}
										</Paragraph>
										{(item.owner || item.meta) && (
											<Paragraph size="xs" color="muted" className="truncate">
												{[item.owner, item.meta].filter(Boolean).join(" · ")}
											</Paragraph>
										)}
									</Card>
								);
							})}
							{column.items.length === 0 && (
								<Paragraph size="xs" color="muted" className="px-2 pb-2">
									Nothing here
								</Paragraph>
							)}
							{more > 0 && (
								<Paragraph size="xs" color="muted" className="px-2 pb-1">
									+{more} more
								</Paragraph>
							)}
						</section>
					);
				})}
			</div>
		</BlockSection>
	);
}

WorkItemBoard.template = "work-item-board" as const;
WorkItemBoard.info =
	"Responsive three- or four-column board of issues, tickets, or tasks grouped as planned, active, blocked, and done, with owner and priority. Pick it over task-list when the reader must triage several items and grouping by state matters.";
WorkItemBoard.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
