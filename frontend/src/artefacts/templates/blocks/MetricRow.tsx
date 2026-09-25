import type { Metric } from "../../model";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function MetricRow({ node }: TemplateProps) {
	const { items } = node.data as { items: Metric[] };
	return (
		<section className="grid border-b border-divider sm:grid-cols-3">
			{items.map((item) => (
				<div
					key={item.label}
					className="border-b border-divider px-6 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:last:border-r-0"
				>
					<p className="text-xs font-medium text-muted">
						{item.label}
					</p>
					<p className="mt-2 text-2xl font-semibold tracking-tight">
						{item.value}
					</p>
					<p className="mt-1 text-sm text-muted">{item.detail}</p>
				</div>
			))}
		</section>
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
