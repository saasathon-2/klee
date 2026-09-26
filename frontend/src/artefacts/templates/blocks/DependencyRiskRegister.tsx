import { Card, Chip, Paragraph, Separator, Table } from "@heroui/react";
import { Fragment } from "react";
import type { Level, RiskItem } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const weight: Record<Level, number> = { high: 3, medium: 2, low: 1 };

/** Impact × likelihood, from 1 (low × low) to 9 (high × high). */
const score = (item: RiskItem) =>
	(weight[item.impact] ?? 1) * (weight[item.likelihood] ?? 1);

function severity(value: number) {
	if (value >= 6) return { label: "High", color: "danger" } as const;
	if (value >= 3) return { label: "Medium", color: "warning" } as const;
	return { label: "Low", color: "default" } as const;
}

const types: Record<RiskItem["type"], string> = {
	dependency: "Dependency",
	assumption: "Assumption",
	risk: "Risk",
};

const statuses: Record<RiskItem["status"], string> = {
	open: "Open",
	mitigating: "Mitigating",
	accepted: "Accepted",
	closed: "Closed",
};

export function DependencyRiskRegister({ node, context }: TemplateProps) {
	const { title, description, items } = node.data as {
		title: string;
		description: string;
		items: RiskItem[];
	};
	const text = editableFor(node, context);
	// Keep each item's original index so edits write to the right record.
	const ranked = items
		.map((item, index) => ({ item, index }))
		.sort(
			(a, b) =>
				Number(a.item.status === "closed") - Number(b.item.status === "closed") ||
				score(b.item) - score(a.item),
		);

	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			{context.isEditing ? (
				<Card className="gap-0 p-0">
					{ranked.map(({ item, index }, position) => (
						<Fragment key={index}>
							{position > 0 && <Separator />}
							<div className="flex flex-col gap-1 px-4 py-3">
								{text(["items", index, "title"], item.title, "Risk")}
								{text(["items", index, "mitigation"], item.mitigation, "Mitigation", true)}
							</div>
						</Fragment>
					))}
				</Card>
			) : (
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label={title} className="min-w-[640px]">
							<Table.Header>
								<Table.Column isRowHeader>Item</Table.Column>
								<Table.Column>Severity</Table.Column>
								<Table.Column>Mitigation</Table.Column>
								<Table.Column>Owner</Table.Column>
								<Table.Column>Status</Table.Column>
							</Table.Header>
							<Table.Body>
								{ranked.map(({ item, index }) => {
									const level = severity(score(item));
									return (
										<Table.Row key={index} id={String(index)}>
											<Table.Cell>
												<Paragraph size="sm" weight="medium">
													<ExternalLink href={item.url}>{item.title}</ExternalLink>
												</Paragraph>
												<Paragraph size="xs" color="muted">
													{types[item.type] ?? item.type}
												</Paragraph>
											</Table.Cell>
											<Table.Cell>
												<Chip size="sm" color={level.color}>{level.label}</Chip>
												<Paragraph size="xs" color="muted" className="mt-1 whitespace-nowrap">
													{item.impact} impact · {item.likelihood} likelihood
												</Paragraph>
											</Table.Cell>
											<Table.Cell className="text-muted">{item.mitigation}</Table.Cell>
											<Table.Cell className="whitespace-nowrap">
												{item.owner ?? <span className="text-muted">Unassigned</span>}
											</Table.Cell>
											<Table.Cell>
												<Chip size="sm" variant="tertiary">
													{statuses[item.status] ?? item.status}
												</Chip>
											</Table.Cell>
										</Table.Row>
									);
								})}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			)}
		</BlockSection>
	);
}

DependencyRiskRegister.template = "dependency-risk-register" as const;
DependencyRiskRegister.info =
	"Register of external dependencies, assumptions, and risks, sorted by impact × likelihood, each with owner, mitigation, and status. Pick it when a plan or migration has concrete dependencies or risks with an owner or next action; never for vague concerns.";
DependencyRiskRegister.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
