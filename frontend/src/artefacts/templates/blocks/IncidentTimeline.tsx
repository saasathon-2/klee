import { Accordion, Alert, Card, Chip, Paragraph, Separator } from "@heroui/react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Fragment } from "react";
import type { Causality, IncidentEvent, LinkedItem } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { safeUrl } from "../page/safeUrl";
import { formatDateTime, formatDuration, formatTime, parseDate } from "../page/dates";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const severities = {
	critical: { label: "Critical", fill: "bg-danger" },
	major: { label: "Major", fill: "bg-warning" },
	minor: { label: "Minor", fill: "bg-accent-text" },
	info: { label: "Info", fill: "bg-muted/40" },
} as const;

const causality = {
	confirmed: { label: "Confirmed", color: "default" },
	suspected: { label: "Suspected", color: "warning" },
} as const satisfies Record<Causality, { label: string; color: "default" | "warning" }>;

const types: Record<IncidentEvent["type"], string> = {
	alert: "Alert",
	deploy: "Deploy",
	log: "Log",
	update: "Update",
	mitigation: "Mitigation",
	resolution: "Resolution",
};

function EventSummary({ event }: { event: IncidentEvent }) {
	const severity = severities[event.severity] ?? severities.info;
	const cause = event.status ? causality[event.status] : undefined;
	return (
		<span className="flex min-w-0 flex-1 items-start gap-3 text-left">
			<time dateTime={event.time} className="w-16 shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted tabular-nums">
				{formatTime(event.time)}
			</time>
			<span
				aria-label={`${severity.label} severity`}
				role="img"
				className={`mt-1.5 size-2 shrink-0 rounded-full ${severity.fill}`}
			/>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-medium">{event.summary}</span>
				<span className="mt-1 flex flex-wrap gap-1.5">
					<Chip size="sm" variant="tertiary">{types[event.type] ?? event.type}</Chip>
					{cause && <Chip size="sm" color={cause.color}>{cause.label}</Chip>}
				</span>
			</span>
		</span>
	);
}

export function IncidentTimeline({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		startedAt: string;
		resolvedAt?: string | null;
		impact: string;
		events: IncidentEvent[];
		rootCause?: { summary: string; status: Causality } | null;
		followUps: LinkedItem[];
	};
	const text = editableFor(node, context);
	// Keep each event's original index so edits write to the right record.
	const events = data.events
		.map((event, index) => ({ event, index }))
		.sort((a, b) => (parseDate(a.event.time)?.getTime() ?? 0) - (parseDate(b.event.time)?.getTime() ?? 0));
	const duration = data.resolvedAt && formatDuration(data.startedAt, data.resolvedAt);
	const facts = [
		{ label: "Started", value: formatDateTime(data.startedAt) },
		{ label: "Resolved", value: data.resolvedAt ? formatDateTime(data.resolvedAt) : "Ongoing" },
		...(duration ? [{ label: "Duration", value: duration }] : []),
	];

	return (
		<BlockSection title={data.title} edit={{ node, context }}>
			<dl className={`grid gap-3 ${facts.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
				{facts.map((fact) => (
					<div key={fact.label} className="rounded-xl bg-surface-secondary px-4 py-3">
						<dt className="text-xs text-muted">{fact.label}</dt>
						<dd className="mt-0.5 flex items-center gap-2 text-sm font-medium">
							{fact.value === "Ongoing" ? <Chip size="sm" color="danger">Ongoing</Chip> : fact.value}
						</dd>
					</div>
				))}
			</dl>
			<Paragraph className="mt-4 max-w-3xl">
				<span className="font-medium">Impact: </span>
				{text(["impact"], data.impact, "Impact", true)}
			</Paragraph>

			<Card className="mt-6 gap-0 p-0">
				{context.isEditing ? (
					// Accordion triggers are buttons, which can't hold text fields.
					events.map(({ event, index }, position) => (
						<Fragment key={index}>
							{position > 0 && <Separator />}
							<div className="flex flex-col gap-1 px-4 py-3">
								{text(["events", index, "summary"], event.summary, "Event summary")}
								{event.evidence &&
									text(["events", index, "evidence"], event.evidence, "Evidence", true)}
							</div>
						</Fragment>
					))
				) : (
					<Accordion allowsMultipleExpanded aria-label="Incident events">
						{events.map(({ event, index }) => {
							const url = safeUrl(event.url);
							const expandable = Boolean(event.evidence || url);
							return (
								<Accordion.Item key={index} id={String(index)} isDisabled={!expandable}>
									<Accordion.Heading>
										<Accordion.Trigger className="px-4 disabled:opacity-100">
											<EventSummary event={event} />
											{expandable && <Accordion.Indicator />}
										</Accordion.Trigger>
									</Accordion.Heading>
									{expandable && (
										<Accordion.Panel>
											<Accordion.Body className="pr-4 pl-[6.25rem]">
												{event.evidence && (
													<Paragraph size="sm" color="muted" className="whitespace-pre-line">
														{event.evidence}
													</Paragraph>
												)}
												{url && (
													<a
														href={url}
														target="_blank"
														rel="noreferrer"
														className="mt-2 inline-flex items-center gap-1 text-xs underline decoration-muted underline-offset-4 hover:text-accent-text"
													>
														Open evidence <ExternalLinkIcon size={12} />
													</a>
												)}
											</Accordion.Body>
										</Accordion.Panel>
									)}
								</Accordion.Item>
							);
						})}
					</Accordion>
				)}
			</Card>

			{data.rootCause && (
				<Alert status={data.rootCause.status === "confirmed" ? "danger" : "warning"} className="mt-4">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>
							{data.rootCause.status === "confirmed" ? "Confirmed root cause" : "Suspected root cause"}
						</Alert.Title>
						<Alert.Description>
							{text(["rootCause", "summary"], data.rootCause.summary, "Root cause", true)}
						</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			{data.followUps.length > 0 && (
				<div className="mt-6">
					<Paragraph size="sm" weight="medium" className="mb-2">Follow-ups</Paragraph>
					<Card className="gap-0 p-0">
						{data.followUps.map((item, index) => (
							<Fragment key={index}>
								{index > 0 && <Separator />}
								<div className="flex items-center gap-3 px-4 py-3">
									<Paragraph size="sm" className="min-w-0 flex-1">
										<ExternalLink href={context.isEditing ? null : item.url}>
											{text(["followUps", index, "title"], item.title, "Follow-up")}
										</ExternalLink>
									</Paragraph>
									{item.owner && (
										<Paragraph size="xs" color="muted" className="shrink-0">
											{item.owner}
										</Paragraph>
									)}
								</div>
							</Fragment>
						))}
					</Card>
				</div>
			)}
		</BlockSection>
	);
}

IncidentTimeline.template = "incident-timeline" as const;
IncidentTimeline.info =
	"Time-ordered incident event stream with severity markers, expandable evidence links, impact, root cause, and follow-ups. Pick it when diagnosing or summarising an incident from alerts, deploys, logs, chat updates, mitigations, or follow-ups; every causal claim is labelled confirmed or suspected.";
IncidentTimeline.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
