import { Card, Chip, Paragraph, Separator } from "@heroui/react";
import { CircleAlert, CircleCheck, Clock, OctagonX, ThumbsUp } from "lucide-react";
import type { LinkedItem, ReadinessGate, ReadinessSignal } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { checkStatuses } from "../page/checkStatus";
import { ExternalLink } from "../page/ExternalLink";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const verdicts = {
	ready: { label: "Ready", icon: CircleCheck, band: "bg-success-soft", tone: "text-success" },
	"not-ready": { label: "Not ready", icon: OctagonX, band: "bg-danger-soft", tone: "text-danger" },
	waiting: { label: "Waiting", icon: Clock, band: "bg-warning-soft", tone: "text-warning" },
} as const;

/**
 * The verdict is derived from the gates rather than stated by the model, so it
 * can never contradict them: any blocker or failed gate means not ready, any
 * pending gate means waiting.
 */
function verdictFor(gates: ReadinessGate[], blockers: LinkedItem[]) {
	if (blockers.length > 0 || gates.some((gate) => gate.status === "failed"))
		return verdicts["not-ready"];
	if (gates.some((gate) => gate.status !== "passed")) return verdicts.waiting;
	return verdicts.ready;
}

export function DeliveryReadiness({ node, context }: TemplateProps) {
	const { title, subject, summary, gates, signals, blockers } = node.data as {
		title: string;
		subject: string;
		summary: string;
		gates: ReadinessGate[];
		signals: ReadinessSignal[];
		blockers: LinkedItem[];
	};
	const text = editableFor(node, context);
	const verdict = verdictFor(gates, blockers);
	const Verdict = verdict.icon;
	const passed = gates.filter((gate) => gate.status === "passed").length;

	return (
		<BlockSection title={title} edit={{ node, context }}>
			<Card className="gap-0 overflow-hidden p-0">
				<div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${verdict.band}`}>
					<Verdict size={28} className={`shrink-0 ${verdict.tone}`} aria-hidden />
					<div className="min-w-48 flex-1">
						<Paragraph className="text-heading-2">{verdict.label}</Paragraph>
						<Paragraph size="sm" color="muted">
							{text(["subject"], subject, "Decision subject")}
						</Paragraph>
					</div>
					<Chip size="sm" variant="secondary">
						{passed} of {gates.length} required gates passed
					</Chip>
				</div>
				<div className="px-5 py-4">
					<Paragraph>{text(["summary"], summary, "Readiness summary", true)}</Paragraph>
				</div>

				{blockers.length > 0 && (
					<>
						<Separator />
						<section aria-label="Blockers" className="px-5 py-4">
							<Paragraph size="sm" weight="medium" className="mb-2">Blockers</Paragraph>
							<ul className="flex flex-col gap-2">
								{blockers.map((blocker, index) => (
									<li key={index} className="flex items-start gap-2 text-sm">
										<CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden />
										<span className="min-w-0 flex-1">
											<ExternalLink href={context.isEditing ? null : blocker.url}>
												{text(["blockers", index, "title"], blocker.title, "Blocker")}
											</ExternalLink>
											{blocker.owner && <span className="text-muted"> · {blocker.owner}</span>}
										</span>
									</li>
								))}
							</ul>
						</section>
					</>
				)}

				<Separator />
				<section aria-label="Required gates" className="px-5 py-4">
					<Paragraph size="sm" weight="medium" className="mb-2">Required gates</Paragraph>
					<ul>
						{gates.map((gate, index) => {
							const status = checkStatuses[gate.status] ?? checkStatuses.pending;
							const Icon = status.icon;
							return (
								<li key={index} className="flex items-start gap-3 py-2">
										<Icon size={16} className={`mt-0.5 shrink-0 ${status.tone}`} aria-label={status.label} />
										<div className="min-w-0 flex-1">
											<Paragraph size="sm" weight="medium">
												<ExternalLink href={context.isEditing ? null : gate.url}>
													{text(["gates", index, "name"], gate.name, "Gate name")}
												</ExternalLink>
											</Paragraph>
											<Paragraph size="xs" color="muted">
												{text(["gates", index, "detail"], gate.detail, "Gate detail")}
											</Paragraph>
										</div>
										<Chip size="sm" color={status.color} className="shrink-0">{status.label}</Chip>
								</li>
							);
						})}
					</ul>
				</section>

				{signals.length > 0 && (
					<>
						<Separator />
						<section aria-label="Advisory signals" className="px-5 py-4">
							<Paragraph size="sm" weight="medium" className="mb-2">Advisory</Paragraph>
							<ul className="grid gap-2 sm:grid-cols-2">
								{signals.map((signal, index) => {
									const Icon = signal.tone === "positive" ? ThumbsUp : CircleAlert;
									return (
										<li key={index} className="flex items-start gap-2 rounded-lg bg-surface-secondary px-3 py-2">
											<Icon
												size={14}
												className={`mt-0.5 shrink-0 ${signal.tone === "positive" ? "text-success" : "text-warning"}`}
												aria-label={signal.tone === "positive" ? "Positive" : "Caution"}
											/>
											<div className="min-w-0">
												<Paragraph size="sm" weight="medium">
													{text(["signals", index, "label"], signal.label, "Signal")}
												</Paragraph>
												<Paragraph size="xs" color="muted">
													{text(["signals", index, "detail"], signal.detail, "Signal detail")}
												</Paragraph>
											</div>
										</li>
									);
								})}
							</ul>
						</section>
					</>
				)}
			</Card>
		</BlockSection>
	);
}

DeliveryReadiness.template = "delivery-readiness" as const;
DeliveryReadiness.info =
	"Decision card for a merge, release, rollout, or handoff: a ready, not-ready, or waiting verdict derived from required gates and blockers, plus advisory signals. Pick it when someone needs a go/no-go based on checks, approvals, risk, documentation, and deployment state.";
DeliveryReadiness.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
