import { Card, Checkbox, Chip, Description, Label, Separator } from "@heroui/react";
import { Fragment } from "react";
import type { ArtefactTask } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function TaskList({ node }: TemplateProps) {
	const { title, description, tasks } = node.data as {
		title: string;
		description: string;
		tasks: ArtefactTask[];
	};
	return (
		<BlockSection title={title} description={description}>
			<Card className="gap-0 p-0">
				{tasks.map((task, index) => (
					<Fragment key={task.id}>
						{index > 0 && <Separator />}
						<div className="flex items-start gap-3 px-4 py-3">
							<Checkbox variant="secondary" className="min-w-0 flex-1">
								<Checkbox.Content className="items-start">
									<Checkbox.Control className="mt-1">
										<Checkbox.Indicator />
									</Checkbox.Control>
									<div className="flex min-w-0 flex-col">
										<Label>{task.title}</Label>
										<Description>{task.detail}</Description>
									</div>
								</Checkbox.Content>
							</Checkbox>
							<div className="flex shrink-0 items-center gap-2">
								<span className="hidden text-xs text-muted sm:inline">
									{task.meta}
								</span>
								<Chip size="sm">{task.status}</Chip>
							</div>
						</div>
					</Fragment>
				))}
			</Card>
		</BlockSection>
	);
}

TaskList.template = "task-list" as const;
TaskList.info =
	"Checklist of ordered work items with status, effort, and supporting detail. Pick it for tickets, review plans, sprint work, checklists, or recommendations where each item benefits from extra context.";
TaskList.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
