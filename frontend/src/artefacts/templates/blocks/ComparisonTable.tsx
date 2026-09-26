import { Label, Switch, Table } from "@heroui/react";
import { useState } from "react";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

type Row = { label: string; values: string[] };

const normalise = (value: string) => value.trim().toLowerCase();
const differs = (row: Row) => new Set(row.values.map(normalise)).size > 1;

export function ComparisonTable({ node, context }: TemplateProps) {
	const data = node.data as { title: string; description: string; columns: string[]; rows: Row[] };
	const [onlyDifferences, setOnlyDifferences] = useState(false);
	const differing = data.rows.filter(differs).length;
	const rows = onlyDifferences ? data.rows.filter(differs) : data.rows;
	return (
		<BlockSection
			title={data.title}
			description={data.description}
			edit={{ node, context }}
			action={
				differing > 0 &&
				differing < data.rows.length && (
					<Switch size="sm" isSelected={onlyDifferences} onChange={setOnlyDifferences} className="shrink-0">
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Label className="text-sm">Only differences</Label>
					</Switch>
				)
			}
		>
			<Table>
				<Table.ScrollContainer>
					<Table.Content aria-label={data.title}>
						<Table.Header>
							<Table.Column isRowHeader>
								<span className="sr-only">Attribute</span>
							</Table.Column>
							{data.columns.map((column, index) => (
								<Table.Column key={index}>{column}</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{rows.map((row) => {
								const different = differs(row);
								return (
									<Table.Row key={row.label} id={row.label}>
										<Table.Cell className="font-medium">
											<span className="flex items-center gap-2">
												{row.label}
												{different && (
													<span className="rounded-sm bg-accent-soft px-1.5 text-xs font-normal text-accent-soft-foreground">
														Differs
													</span>
												)}
											</span>
										</Table.Cell>
										{row.values.map((value, index) => (
											<Table.Cell key={index} className={different ? "" : "text-muted"}>
												{value || "—"}
											</Table.Cell>
										))}
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
		</BlockSection>
	);
}

ComparisonTable.template = "comparison-table" as const;
ComparisonTable.info =
	"Side-by-side comparison of two to five items across attributes, highlighting the rows where they differ.";
ComparisonTable.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
