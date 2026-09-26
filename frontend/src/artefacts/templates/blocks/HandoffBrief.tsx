import { Avatar, Card, Chip, Paragraph } from "@heroui/react";
import { ArrowRight, CircleCheck, CircleDot, Eye, ListTodo } from "lucide-react";
import type { LinkedItem } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { editableFor } from "../page/editableFor";
import { initials } from "../page/initials";
import type { EditPath, TemplateProps, TemplateSelectionInfo } from "../types";

const statuses = {
	"on-track": { label: "On track", color: "success" },
	"at-risk": { label: "At risk", color: "warning" },
	blocked: { label: "Blocked", color: "danger" },
} as const;

function Person({ name, role }: { name: string; role: string }) {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<Avatar size="sm" className="shrink-0">
				<Avatar.Fallback>{initials(name)}</Avatar.Fallback>
			</Avatar>
			<div className="min-w-0">
				<Paragraph size="xs" color="muted">{role}</Paragraph>
				<Paragraph size="sm" weight="medium" className="truncate">{name}</Paragraph>
			</div>
		</div>
	);
}

export function HandoffBrief({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		from: string;
		to?: string | null;
		status: keyof typeof statuses;
		completed: LinkedItem[];
		active: LinkedItem[];
		risks: LinkedItem[];
		nextActions: LinkedItem[];
	};
	const text = editableFor(node, context);
	const status = statuses[data.status] ?? statuses["on-track"];
	const sections = [
		{ key: "completed", label: "Done", icon: CircleCheck, tone: "text-success", items: data.completed },
		{ key: "active", label: "In flight", icon: CircleDot, tone: "text-accent-text", items: data.active },
		{ key: "risks", label: "Watch", icon: Eye, tone: "text-warning", items: data.risks },
		{ key: "nextActions", label: data.to ? `Next for ${data.to}` : "Next actions", icon: ListTodo, tone: "text-foreground", items: data.nextActions },
	] as const;

	const item = (path: EditPath, entry: LinkedItem) => (
		<>
			<Paragraph size="sm" weight="medium">
				<ExternalLink href={entry.url}>{text([...path, "title"], entry.title, "Item")}</ExternalLink>
			</Paragraph>
			{(entry.detail || entry.owner) && (
				<Paragraph size="xs" color="muted">
					{entry.detail && text([...path, "detail"], entry.detail, "Item detail")}
					{entry.detail && entry.owner && " · "}
					{entry.owner}
				</Paragraph>
			)}
		</>
	);

	return (
		<BlockSection title={data.title} edit={{ node, context }}>
			<div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
				<Person name={data.from} role="From" />
				<ArrowRight size={16} className="text-muted" aria-hidden />
				<Person name={data.to ?? "Unassigned"} role="To" />
				<Chip size="sm" color={status.color} className="sm:ml-auto">{status.label}</Chip>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{sections.map((section) => {
					const Icon = section.icon;
					return (
						<Card key={section.key} variant="secondary">
							<Card.Header className="flex-row items-center gap-2">
								<Icon size={16} className={section.tone} aria-hidden />
								<Card.Title>{section.label}</Card.Title>
								<Chip size="sm" variant="tertiary" className="ml-auto">{section.items.length}</Chip>
							</Card.Header>
							<Card.Content>
								{section.items.length === 0 ? (
									<Paragraph size="sm" color="muted">Nothing to note</Paragraph>
								) : (
									<ul className="flex flex-col gap-3">
										{section.items.map((entry, index) => (
											<li key={index}>{item([section.key, index], entry)}</li>
										))}
									</ul>
								)}
							</Card.Content>
						</Card>
					);
				})}
			</div>
		</BlockSection>
	);
}

HandoffBrief.template = "handoff-brief" as const;
HandoffBrief.info =
	"Structured handoff with done, in-flight, watch, and next-owner sections plus the overall status. Pick it when work is changing hands between people, teams, or shifts and the recipient needs current state, risks, and exact next actions.";
HandoffBrief.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
