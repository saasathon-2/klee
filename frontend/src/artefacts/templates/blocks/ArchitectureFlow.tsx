import { Card, Chip } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import type { FlowNode } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function ArchitectureFlow({ node }: TemplateProps) {
	const { title, description, nodes } = node.data as {
		title: string;
		description: string;
		nodes: FlowNode[];
	};
	return (
		<BlockSection title={title} description={description}>
			<div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
				{nodes.map((item, index) => (
					<div key={item.label} className="contents">
						<Card variant="secondary" className="min-w-0">
							<Card.Header className="items-start gap-2">
								<Chip size="sm">Step {index + 1}</Chip>
								<Card.Title>{item.label}</Card.Title>
								<Card.Description>{item.detail}</Card.Description>
							</Card.Header>
						</Card>
						{index < nodes.length - 1 && (
							<ArrowRight
								size={16}
								className="mx-auto rotate-90 self-center text-muted sm:rotate-0"
							/>
						)}
					</div>
				))}
			</div>
		</BlockSection>
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
