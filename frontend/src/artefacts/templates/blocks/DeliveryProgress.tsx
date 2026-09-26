import { Alert, Chip, Paragraph } from "@heroui/react";
import { CalendarClock } from "lucide-react";
import type { ScopeChange, WorkStatus } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { formatDate } from "../page/dates";
import { editableFor } from "../page/editableFor";
import { workStatuses } from "../page/workStatus";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function DeliveryProgress({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		unit?: string | null;
		completed: number;
		inProgress: number;
		blocked: number;
		notStarted: number;
		forecast?: string | null;
		scopeChange?: ScopeChange | null;
		summary: string;
	};
	const text = editableFor(node, context);
	const segments: { status: WorkStatus; value: number }[] = [
		{ status: "done", value: data.completed },
		{ status: "active", value: data.inProgress },
		{ status: "blocked", value: data.blocked },
		{ status: "planned", value: data.notStarted },
	];
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	const percent = total ? Math.round((data.completed / total) * 100) : 0;
	const unit = data.unit ?? "items";
	const scope = data.scopeChange;
	const net = scope ? scope.added - scope.removed : 0;

	return (
		<BlockSection title={data.title} edit={{ node, context }}>
			<div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
				<div>
					<Paragraph className="text-heading-1 tabular-nums">{percent}%</Paragraph>
					<Paragraph size="sm" color="muted">
						{data.completed} of {total} {unit} complete
					</Paragraph>
				</div>
				{data.forecast && (
					<Chip size="md" variant="secondary">
						<CalendarClock size={14} />
						Forecast {formatDate(data.forecast)}
					</Chip>
				)}
			</div>

			<div
				role="img"
				aria-label={segments
					.map(({ status, value }) => `${workStatuses[status].label}: ${value} ${unit}`)
					.join(", ")}
				className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full"
			>
				{segments
					.filter(({ value }) => value > 0)
					.map(({ status, value }) => (
						<div
							key={status}
							className={`h-full ${workStatuses[status].fill}`}
							style={{ width: `${(value / total) * 100}%` }}
						/>
					))}
			</div>
			<ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1" aria-hidden>
				{segments.map(({ status, value }) => (
					<li key={status} className="flex items-center gap-2 text-xs">
						<span className={`size-2 rounded-full ${workStatuses[status].fill}`} />
						<span className="text-muted">{workStatuses[status].label}</span>
						<span className="font-medium tabular-nums">{value}</span>
					</li>
				))}
			</ul>

			{scope && (scope.added > 0 || scope.removed > 0) && (
				<Alert status="warning" className="mt-5">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>
							Scope {net >= 0 ? "grew" : "shrank"} by {Math.abs(net)} {unit}
							{scope.added > 0 && scope.removed > 0 && ` (+${scope.added} / −${scope.removed})`}
						</Alert.Title>
						<Alert.Description>
							{text(["scopeChange", "detail"], scope.detail, "Scope change detail", true)}
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<Paragraph className="mt-4 max-w-3xl">
				{text(["summary"], data.summary, "Progress summary", true)}
			</Paragraph>
		</BlockSection>
	);
}

DeliveryProgress.template = "delivery-progress" as const;
DeliveryProgress.info =
	"Answers “are we on track?” with a status-segmented progress bar, scope-change callout, forecast date, and one concise explanation. Pick it only when scope and status data allow completed, active, blocked, and remaining work to be compared; never to repeat task counts.";
DeliveryProgress.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
