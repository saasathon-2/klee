import { Chip, Paragraph } from "@heroui/react";
import {
	CircleCheck,
	CircleDashed,
	CircleDot,
	CircleSlash,
	CircleX,
	ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import type { ReleaseEvent } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { safeUrl } from "../page/safeUrl";
import { formatDateTime } from "../page/dates";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const outcomes = {
	succeeded: { label: "Succeeded", icon: CircleCheck, tone: "text-success" },
	failed: { label: "Failed", icon: CircleX, tone: "text-danger" },
	"in-progress": { label: "In progress", icon: CircleDot, tone: "text-accent-text" },
	pending: { label: "Pending", icon: CircleDashed, tone: "text-muted" },
	skipped: { label: "Skipped", icon: CircleSlash, tone: "text-muted" },
} as const;

const kinds: Record<ReleaseEvent["kind"], string> = {
	build: "Build",
	deploy: "Deploy",
	gate: "Gate",
	rollout: "Rollout",
	rollback: "Rollback",
	note: "Note",
};

export function ReleaseTimeline({ node, context }: TemplateProps) {
	const { title, release, currentStage, nextGate, events } = node.data as {
		title: string;
		release?: string | null;
		currentStage?: string | null;
		nextGate?: string | null;
		events: ReleaseEvent[];
	};
	const text = editableFor(node, context);
	const facts = [
		{ label: "Release", value: release },
		{ label: "Current stage", value: currentStage },
		{ label: "Next gate", value: nextGate },
	].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

	return (
		<BlockSection title={title} edit={{ node, context }}>
			{facts.length > 0 && (
				<dl className="mb-6 grid gap-3 sm:grid-cols-3">
					{facts.map((fact) => (
						<div key={fact.label} className="rounded-xl bg-surface-secondary px-4 py-3">
							<dt className="text-xs text-muted">{fact.label}</dt>
							<dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
						</div>
					))}
				</dl>
			)}
			<ol aria-label="Release events">
				{events.map((event, index) => {
					const outcome = outcomes[event.status] ?? outcomes.pending;
					const Icon = outcome.icon;
					const url = safeUrl(event.url);
					const last = index === events.length - 1;
					return (
						<li key={index} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)]">
							<time
								dateTime={event.time}
								className="hidden pt-0.5 text-right text-xs text-muted tabular-nums sm:block"
							>
								{formatDateTime(event.time)}
							</time>
							<div className="flex flex-col items-center">
								<Icon size={20} className={`shrink-0 ${outcome.tone}`} aria-label={outcome.label} />
								{!last && <div aria-hidden className="w-px flex-1 bg-border" />}
							</div>
							<div className={last ? "" : "pb-6"}>
								<div className="flex flex-wrap items-center gap-2">
									<Paragraph size="sm" weight="medium">
										{text(["events", index, "label"], event.label, "Event")}
									</Paragraph>
									{event.environment && (
										<Chip size="sm" variant="secondary" className="font-mono">
											{event.environment}
										</Chip>
									)}
									<Chip size="sm" variant="tertiary">{kinds[event.kind] ?? event.kind}</Chip>
								</div>
								<Paragraph size="xs" color="muted" className="sm:hidden">
									{formatDateTime(event.time)}
								</Paragraph>
								{(event.detail || context.isEditing) && (
									<Paragraph size="sm" color="muted" className="mt-1">
										{text(["events", index, "detail"], event.detail, "Event detail", true)}
									</Paragraph>
								)}
								{url && (
									<a
										href={url}
										target="_blank"
										rel="noreferrer"
										className="mt-1 inline-flex items-center gap-1 text-xs text-muted underline decoration-muted underline-offset-4 hover:text-accent-text"
									>
										View details <ExternalLinkIcon size={12} />
									</a>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</BlockSection>
	);
}

ReleaseTimeline.template = "release-timeline" as const;
ReleaseTimeline.info =
	"Vertical event timeline for a release, rollout, deployment sequence, or feature launch, with environment badges, outcome states, the current stage, and the next gate. Pick it when work moves through environments, gates, or phased exposure.";
ReleaseTimeline.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
