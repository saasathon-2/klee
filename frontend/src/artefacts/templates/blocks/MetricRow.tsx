import { Card } from "@heroui/react";
import type { Metric } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function MetricRow({ node, context }: TemplateProps) {
	const { items } = node.data as { items: Metric[] };
	const text = editableFor(node, context);
	return (
		<BlockSection>
			<div className="grid gap-3 sm:grid-cols-3">
				{items.map((item, index) => (
					<Card key={index} variant="secondary">
						<Card.Header>
							<Card.Description>
								{text(["items", index, "label"], item.label, "Metric label")}
							</Card.Description>
							<Card.Title className="text-2xl font-semibold tracking-tight">
								{text(["items", index, "value"], item.value, "Metric value")}
							</Card.Title>
						</Card.Header>
						<Card.Content>
							<Card.Description>
								{text(["items", index, "detail"], item.detail, "Metric detail")}
							</Card.Description>
						</Card.Content>
					</Card>
				))}
			</div>
		</BlockSection>
	);
}

MetricRow.template = "metric-row" as const;
MetricRow.info =
	"Compact row of headline values with labels and short explanations. Pick it when two or three comparable status, scope, risk, confidence, progress, or performance values can be stated clearly.";
MetricRow.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
