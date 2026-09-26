import { Card, Chip, Separator, Table } from "@heroui/react";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import { Fragment } from "react";
import type { Check } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const statuses = {
	passed: { color: "success", label: "Passed", icon: CircleCheck },
	failed: { color: "danger", label: "Failed", icon: CircleX },
	pending: { color: "warning", label: "Pending", icon: CircleDashed },
} as const;

export function CheckList({ node, context }: TemplateProps) {
	const { title, checks } = node.data as { title: string; checks: Check[] };
	const passed = checks.filter((check) => check.status === "passed").length;
	const text = editableFor(node, context);
	return (
		<BlockSection
			title={title}
			description={`${passed} of ${checks.length} checks passed`}
			edit={{ node, context }}
		>
			{context.isEditing ? (
				// Table keyboard navigation would swallow keystrokes, so edit as a list.
				<Card className="gap-0 p-0">
					{checks.map((check, index) => (
						<Fragment key={index}>
							{index > 0 && <Separator />}
							<div className="flex flex-col gap-1 px-4 py-3">
								{text(["checks", index, "name"], check.name, "Check name")}
								{text(["checks", index, "detail"], check.detail, "Check detail")}
							</div>
						</Fragment>
					))}
				</Card>
			) : (
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label={title}>
							<Table.Header>
								<Table.Column isRowHeader>Check</Table.Column>
								<Table.Column>Status</Table.Column>
								<Table.Column>Details</Table.Column>
							</Table.Header>
							<Table.Body>
								{checks.map((check) => {
									const status = statuses[check.status] ?? statuses.pending;
									const Icon = status.icon;
									return (
										<Table.Row key={check.name} id={check.name}>
											<Table.Cell className="font-medium">
											{check.url?.startsWith("https://") ? <a className="underline decoration-muted underline-offset-4 hover:text-primary" href={check.url} target="_blank" rel="noreferrer">{check.name}</a> : check.name}
											</Table.Cell>
											<Table.Cell>
												<Chip size="sm" color={status.color}>
													<Icon size={12} />
													{status.label}
												</Chip>
											</Table.Cell>
											<Table.Cell className="text-muted">
												{check.detail}
											</Table.Cell>
										</Table.Row>
									);
								})}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			)}
		</BlockSection>
	);
}

CheckList.template = "check-list" as const;
CheckList.info =
	"Table of CI checks, tests, or merge requirements marked passed, failed, or pending. Pick it when the prompt includes build, test, lint, deploy, or merge-readiness results.";
CheckList.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
