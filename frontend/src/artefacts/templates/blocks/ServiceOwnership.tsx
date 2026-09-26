import { Card, Chip, Paragraph, Separator } from "@heroui/react";
import { BookOpen, FolderGit2 } from "lucide-react";
import { Fragment } from "react";
import type { ServiceRecord } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { ExternalLink } from "../page/ExternalLink";
import { safeUrl } from "../page/safeUrl";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const health = {
	healthy: { label: "Healthy", color: "success" },
	degraded: { label: "Degraded", color: "warning" },
	down: { label: "Down", color: "danger" },
	unknown: { label: "Unknown", color: "default" },
} as const;

function ResourceLink({
	value,
	label,
	icon: Icon,
}: {
	value?: string | null;
	label: string;
	icon: typeof BookOpen;
}) {
	if (!value) return null;
	const url = safeUrl(value);
	// A repository may be a name like "acme/billing" rather than a URL.
	const text = url ? label : value;
	return (
		<span className="inline-flex items-center gap-1 text-xs text-muted">
			<Icon size={12} aria-hidden />
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="underline decoration-muted underline-offset-4 hover:text-accent-text"
				>
					{text}
				</a>
			) : (
				<span className="font-mono">{text}</span>
			)}
		</span>
	);
}

export function ServiceOwnership({ node, context }: TemplateProps) {
	const { title, description, services } = node.data as {
		title: string;
		description: string;
		services: ServiceRecord[];
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<Card className="gap-0 p-0">
				{services.map((service, index) => {
					const state = service.health ? health[service.health] : undefined;
					const people = [
						service.owner && `Owned by ${service.owner}`,
						service.onCall && `On call: ${service.onCall}`,
					].filter(Boolean);
					return (
						<Fragment key={`${service.name}-${index}`}>
							{index > 0 && <Separator />}
							<div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<Paragraph size="sm" weight="medium">
											<ExternalLink href={context.isEditing ? null : service.url}>
												{text(["services", index, "name"], service.name, "Service name")}
											</ExternalLink>
										</Paragraph>
										{service.environment && (
											<Chip size="sm" variant="secondary" className="font-mono">
												{service.environment}
											</Chip>
										)}
									</div>
									{people.length > 0 && (
										<Paragraph size="xs" color="muted" className="mt-0.5">
											{people.join(" · ")}
										</Paragraph>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
									<ResourceLink value={service.repository} label="Repository" icon={FolderGit2} />
									<ResourceLink value={service.runbook} label="Runbook" icon={BookOpen} />
									{state && (
										<Chip size="sm" color={state.color}>{state.label}</Chip>
									)}
								</div>
							</div>
						</Fragment>
					);
				})}
			</Card>
		</BlockSection>
	);
}

ServiceOwnership.template = "service-ownership" as const;
ServiceOwnership.info =
	"Compact service directory with owner, on-call, environment, health, repository, and runbook links. Pick it when the reader needs to know who owns affected systems and where to act; it pairs well beside a change-impact-map or incident-timeline.";
ServiceOwnership.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
