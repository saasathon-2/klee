import { Chip, Paragraph, Tooltip } from "@heroui/react";
import type { Milestone, WorkItem, WorkStatus } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { formatDate, parseDate } from "../page/dates";
import { editableFor } from "../page/editableFor";
import { workStatus, workStatuses } from "../page/workStatus";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const day = 86_400_000;

/** Position of a date within the window as a 0–100 percentage. */
function scale(start: string, end: string) {
	const from = parseDate(start)?.getTime();
	// A date-only end covers that whole day.
	const to = (parseDate(end)?.getTime() ?? NaN) + (end.includes("T") ? 0 : day);
	return (value?: string | null, endOfDay = false) => {
		const at = parseDate(value)?.getTime();
		if (at === undefined || from === undefined || !(to > from)) return undefined;
		const shifted = endOfDay && value && !value.includes("T") ? at + day : at;
		return Math.min(100, Math.max(0, ((shifted - from) / (to - from)) * 100));
	};
}

export function SprintTimeline({ node, context }: TemplateProps) {
	const { title, start, end, today, milestones, items } = node.data as {
		title: string;
		start: string;
		end: string;
		today?: string | null;
		milestones: Milestone[];
		items: WorkItem[];
	};
	const text = editableFor(node, context);
	const at = scale(start, end);
	const now = at(today);
	const counts = (Object.keys(workStatuses) as WorkStatus[])
		.map((status) => ({
			status,
			count: items.filter((item) => workStatus(item.status) === workStatuses[status]).length,
		}))
		.filter(({ count }) => count > 0);
	const todayLine = now !== undefined && (
		<div
			aria-hidden
			className="absolute inset-y-0 w-px bg-foreground/40"
			style={{ left: `${now}%` }}
		/>
	);

	return (
		<BlockSection
			title={title}
			description={counts
				.map(({ status, count }) => `${count} ${workStatuses[status].label.toLowerCase()}`)
				.join(" · ")}
			edit={{ node, context }}
		>
			<div className="grid gap-x-4 sm:grid-cols-[minmax(0,20rem)_1fr]">
				<div className="hidden sm:block" />
				<div>
					<div className="mb-2 flex justify-between gap-2">
						<Paragraph size="xs" color="muted">{formatDate(start)}</Paragraph>
						{now !== undefined && (
							<Paragraph size="xs" weight="medium">
								Today · {formatDate(today!)}
							</Paragraph>
						)}
						<Paragraph size="xs" color="muted">{formatDate(end)}</Paragraph>
					</div>
					<div
						role="img"
						aria-label={`Sprint from ${formatDate(start)} to ${formatDate(end)}${now !== undefined ? `, ${Math.round(now)}% elapsed` : ""}`}
						className="relative h-2 rounded-full bg-default"
					>
						{now !== undefined && (
							<div className="h-full rounded-full bg-brand" style={{ width: `${now}%` }} />
						)}
						{milestones.map((milestone, index) => {
							const left = at(milestone.date);
							if (left === undefined) return null;
							return (
								<Tooltip key={index} delay={0}>
									<Tooltip.Trigger
										aria-label={`${milestone.label}, ${formatDate(milestone.date)}`}
										className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-xs border-2 border-surface bg-foreground"
										style={{ left: `${left}%` }}
										tabIndex={0}
									/>
									<Tooltip.Content>
										{milestone.label} · {formatDate(milestone.date)}
									</Tooltip.Content>
								</Tooltip>
							);
						})}
					</div>
					{milestones.length > 0 && (
						<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Milestones">
							{milestones.map((milestone, index) => (
								<li key={index} className="flex items-center gap-2 text-xs">
									<span aria-hidden className="size-2 rotate-45 rounded-xs bg-foreground" />
									<span className="font-medium">
										{text(["milestones", index, "label"], milestone.label, "Milestone")}
									</span>
									<span className="text-muted">{formatDate(milestone.date)}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<ul className="mt-6 flex flex-col" aria-label="Work items">
				{items.map((item, index) => {
					const status = workStatus(item.status);
					const left = at(item.start);
					const right = at(item.end, true);
					const scheduled = left !== undefined && right !== undefined;
					return (
						<li
							key={item.id}
							className="grid items-center gap-x-4 gap-y-1 border-t border-separator py-2 sm:grid-cols-[minmax(0,20rem)_1fr]"
						>
							<div className="flex min-w-0 items-center gap-2">
								<span className="min-w-0 flex-1 truncate text-sm font-medium">
									<ExternalLink href={item.url}>
										{text(["items", index, "title"], item.title, "Work item title")}
									</ExternalLink>
								</span>
								{item.estimate && (
									<span className="shrink-0 text-xs text-muted">{item.estimate}</span>
								)}
								<Chip size="sm" color={status.color} className="shrink-0">
									{status.label}
								</Chip>
							</div>
							<div className="relative h-6">
									{todayLine}
									{scheduled ? (
										<div
											aria-label={`${item.title}: ${formatDate(item.start!)} to ${formatDate(item.end!)}`}
											role="img"
											className={`absolute top-1/2 h-3 -translate-y-1/2 rounded-sm ${status.fill}`}
											style={{
												left: `${left}%`,
												width: `max(0.5rem, ${right - left}%)`,
											}}
										/>
									) : (
										<span className="absolute inset-y-0 flex items-center text-xs text-muted">
											Unscheduled
										</span>
									)}
							</div>
						</li>
					);
				})}
			</ul>
		</BlockSection>
	);
}

SprintTimeline.template = "sprint-timeline" as const;
SprintTimeline.info =
	"Horizontal date band for a bounded sprint, milestone, or delivery window with milestone markers and compact work-item lanes. Pick it when work items have dates, status, estimates, or a clear ordering; it shows done, in-progress, and remaining work against today.";
SprintTimeline.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
