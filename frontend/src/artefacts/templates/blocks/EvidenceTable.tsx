import { Card, Separator, Table } from "@heroui/react";
import { Fragment } from "react";
import type { EvidenceRow } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function EvidenceTable({ node, context }: TemplateProps) {
	const { title, description, columns, rows } = node.data as {
		title: string;
		description: string;
		columns: string[];
		rows: EvidenceRow[];
	};
	const text = editableFor(node, context);
	// React Aria builds generated columns from a keyed collection.
	const columnKeys = columns.map((label, index) => ({ id: `column-${index}`, index, label }));
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			{context.isEditing ? (
				<Card className="gap-0 p-0">
					<div className="grid gap-1 px-4 py-3 sm:grid-cols-2">
						{columns.map((column, index) => (
							<Fragment key={index}>{text(["columns", index], column, "Column name")}</Fragment>
						))}
					</div>
					<Separator />
					{rows.map((row, rowIndex) => (
						<Fragment key={rowIndex}>
							{rowIndex > 0 && <Separator />}
							<div className="grid gap-1 px-4 py-3 sm:grid-cols-2">
								{columns.map((column, columnIndex) =>
									<Fragment key={columnIndex}>
										{text(["rows", rowIndex, "cells", columnIndex], row.cells[columnIndex] ?? "", column)}
									</Fragment>,
								)}
							</div>
						</Fragment>
					))}
				</Card>
			) : (
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label={title} className={columns.length > 3 ? "min-w-[640px]" : ""}>
							<Table.Header columns={columnKeys}>
								{(column) => (
									<Table.Column id={column.id} isRowHeader={column.index === 0}>
										{column.label}
									</Table.Column>
								)}
							</Table.Header>
							<Table.Body>
								{rows.map((row, rowIndex) => (
									<Table.Row key={rowIndex} id={`row-${rowIndex}`} columns={columnKeys}>
										{(column) => (
											<Table.Cell className={column.index === 0 ? "font-medium" : "text-muted"}>
												{column.index === 0 ? (
													<ExternalLink href={row.url}>{row.cells[0]}</ExternalLink>
												) : (
													row.cells[column.index]
												)}
											</Table.Cell>
										)}
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			)}
		</BlockSection>
	);
}

EvidenceTable.template = "evidence-table" as const;
EvidenceTable.info =
	"Generic table with stable columns and an optional link per row. Pick it to compare or link heterogeneous records such as tickets, PRs, documents, alerts, deploys, or customer reports when no specialised block fits.";
EvidenceTable.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
