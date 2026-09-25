import { Card } from "@heroui/react";
import type { Metric } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function MetricRow({ node }: TemplateProps) {
	const { items } = node.data as { items: Metric[] };
	return (
		<BlockSection>
			<div className="grid gap-3 sm:grid-cols-3">
				{items.map((item) => (
					<Card key={item.label} variant="secondary">
						<Card.Header>
							<Card.Description>{item.label}</Card.Description>
							<Card.Title className="text-2xl font-semibold tracking-tight">
								{item.value}
							</Card.Title>
						</Card.Header>
						<Card.Content>
							<Card.Description>{item.detail}</Card.Description>
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
