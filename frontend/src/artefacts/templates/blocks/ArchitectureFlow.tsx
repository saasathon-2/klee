import { Card } from "@heroui/react";
import { ArrowRight, CircleDot, GitBranch } from "lucide-react";
import type { FlowNode } from "../../model";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function ArchitectureFlow({ node }: TemplateProps) {
	const { title, description, nodes } = node.data as {
		title: string;
		description: string;
		nodes: FlowNode[];
	};
	return (
		<section className="border-b border-divider px-6 py-9 sm:px-10 sm:py-12">
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
					<GitBranch size={17} />
				</div>
				<div>
					<h3 className="text-xl font-semibold tracking-tight">
						{title}
					</h3>
					<p className="mt-1 text-sm leading-6 text-muted">
						{description}
					</p>
				</div>
			</div>
			<div className="mt-7 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
				{nodes.map((item, index) => (
					<div key={item.label} className="contents">
						<Card
							variant={index === 1 ? "tertiary" : "secondary"}
							className="min-w-0"
						>
							<Card.Header className="gap-2 p-4">
								<div className="flex items-center gap-2 text-xs font-semibold text-muted">
									<CircleDot size={13} /> 0{index + 1}
								</div>
								<Card.Title className="text-sm">
									{item.label}
								</Card.Title>
								<Card.Description className="text-xs leading-5">
									{item.detail}
								</Card.Description>
							</Card.Header>
						</Card>
						{index < nodes.length - 1 && (
							<ArrowRight
								className="mx-1 hidden self-center text-muted sm:block"
								size={17}
							/>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

ArchitectureFlow.template = "architecture-flow" as const;
ArchitectureFlow.info =
	"Three-stage visual flow for explaining how context or inputs become an implementation and outcome. Pick it when the prompt involves architecture, dependencies, data movement, or a before-to-after technical change.";
ArchitectureFlow.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
