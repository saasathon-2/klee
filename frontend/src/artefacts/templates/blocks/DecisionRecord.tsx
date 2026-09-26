import { Card, Chip, Paragraph } from "@heroui/react";
import { CalendarClock, Check, Minus, Plus } from "lucide-react";
import type { DecisionOption } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { formatDate } from "../page/dates";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const statuses = {
	proposed: { label: "Proposed", color: "warning" },
	accepted: { label: "Accepted", color: "success" },
	rejected: { label: "Rejected", color: "danger" },
	superseded: { label: "Superseded", color: "default" },
} as const;

export function DecisionRecord({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		question: string;
		decision: string;
		status: keyof typeof statuses;
		options: DecisionOption[];
		rationale: string;
		consequences: string[];
		reviewDate?: string | null;
	};
	const text = editableFor(node, context);
	const status = statuses[data.status] ?? statuses.proposed;

	return (
		<BlockSection title={data.title} edit={{ node, context }}>
			<Paragraph color="muted" className="-mt-3 max-w-3xl">
				{text(["question"], data.question, "Question", true)}
			</Paragraph>

			<Card variant="secondary" className="mt-5">
				<Card.Header>
					<div className="flex flex-wrap items-center gap-2">
						<Chip size="sm" color={status.color}>{status.label}</Chip>
						{data.reviewDate && (
							<Chip size="sm" variant="tertiary">
								<CalendarClock size={12} />
								Review {formatDate(data.reviewDate)}
							</Chip>
						)}
					</div>
					<Card.Title className="mt-2 text-heading-3">
						{text(["decision"], data.decision, "Decision", true)}
					</Card.Title>
					<Card.Description className="mt-1">
						{text(["rationale"], data.rationale, "Rationale", true)}
					</Card.Description>
				</Card.Header>
			</Card>

			<div className={`mt-4 grid gap-3 ${data.options.length >= 3 ? "lg:grid-cols-3" : ""} sm:grid-cols-2`}>
				{data.options.map((option, index) => (
					<Card
						key={index}
						className={option.selected ? "ring-2 ring-accent-text" : ""}
						aria-label={option.selected ? `${option.label} (chosen)` : option.label}
					>
						<Card.Header className="flex-row items-center justify-between gap-2">
							<Card.Title>{text(["options", index, "label"], option.label, "Option")}</Card.Title>
							{option.selected && (
								<Chip size="sm" color="accent">
									<Check size={12} />
									Chosen
								</Chip>
							)}
						</Card.Header>
						<Card.Content>
							<ul className="flex flex-col gap-1.5">
								{option.pros.map((pro, proIndex) => (
									<li key={`pro-${proIndex}`} className="flex items-start gap-2 text-sm">
										<Plus size={14} className="mt-0.5 shrink-0 text-success" aria-label="Pro" />
										<span>{text(["options", index, "pros", proIndex], pro, "Pro")}</span>
									</li>
								))}
								{option.cons.map((con, conIndex) => (
									<li key={`con-${conIndex}`} className="flex items-start gap-2 text-sm text-muted">
										<Minus size={14} className="mt-0.5 shrink-0 text-danger" aria-label="Con" />
										<span>{text(["options", index, "cons", conIndex], con, "Con")}</span>
									</li>
								))}
							</ul>
						</Card.Content>
					</Card>
				))}
			</div>

			{data.consequences.length > 0 && (
				<div className="mt-6">
					<Paragraph size="sm" weight="medium" className="mb-2">Consequences</Paragraph>
					<ol className="flex flex-col gap-2">
						{data.consequences.map((consequence, index) => (
							<li key={index} className="flex items-start gap-3 text-sm">
								<span className="mt-0.5 w-4 shrink-0 text-xs text-muted tabular-nums">{index + 1}</span>
								<span className="min-w-0 flex-1">
									{text(["consequences", index], consequence, "Consequence", true)}
								</span>
							</li>
						))}
					</ol>
				</div>
			)}
		</BlockSection>
	);
}

DecisionRecord.template = "decision-record" as const;
DecisionRecord.info =
	"Decision card with the question, options and their pros and cons, the chosen direction and rationale, consequences, status, and review date. Pick it for an architectural, product, or delivery decision with real options and trade-offs.";
DecisionRecord.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
