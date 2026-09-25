import { Accordion } from "@heroui/react";
import type { ArtefactTask } from "../../model";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function TaskList({ node }: TemplateProps) {
	const { title, description, tasks } = node.data as {
		title: string;
		description: string;
		tasks: ArtefactTask[];
	};
	return (
		<section className="border-b border-divider px-6 py-9 sm:px-10 sm:py-12">
			<p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">
				Recommended focus
			</p>
			<h3 className="mt-2 text-2xl font-semibold tracking-tight">
				{title}
			</h3>
			<p className="mt-2 max-w-xl text-sm leading-6 text-muted">
				{description}
			</p>
			<Accordion
				variant="surface"
				className="mt-7"
				defaultExpandedKeys={[tasks[0]?.id]}
			>
				{tasks.map((task) => (
					<Accordion.Item key={task.id} id={task.id}>
						<Accordion.Heading>
							<Accordion.Trigger className="gap-4 px-4 py-4 text-left">
								<span className="font-mono text-xs text-muted">
									{task.key}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-semibold">
										{task.title}
									</span>
									<span className="mt-1 block text-xs text-muted">
										{task.status} · {task.meta}
									</span>
								</span>
								<Accordion.Indicator />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body className="pb-5 pl-12 pr-5 text-sm leading-6 text-muted">
								{task.detail}
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</section>
	);
}

TaskList.template = "task-list" as const;
TaskList.info =
	"Expandable ordered work items with status, effort, and supporting detail. Pick it for tickets, review plans, sprint work, checklists, or recommendations where each item benefits from extra context.";
TaskList.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
