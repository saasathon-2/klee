import { Button } from "@heroui/react";
import { ArrowUpRight } from "lucide-react";
import type { SuggestedAction } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function NextSteps({ node, context }: TemplateProps) {
	if (!context.canInteract) return null;
	const { title, actions } = node.data as {
		title: string;
		actions: SuggestedAction[];
	};
	return (
		<BlockSection title={title}>
			<div className="grid gap-3 sm:grid-cols-3">
				{actions.map((action) => (
					<Button
						key={action.action}
						variant="secondary"
						className="h-auto w-full min-w-0 items-start justify-between gap-3 rounded-xl px-4 py-3 text-left whitespace-normal"
						onPress={() => context.onAction?.(action.label)}
					>
						<span className="min-w-0">
							<span className="block text-sm font-medium text-foreground">
								{action.label}
							</span>
							<span className="mt-0.5 block text-xs leading-5 font-normal text-muted">
								{action.description}
							</span>
						</span>
						<ArrowUpRight size={16} className="mt-0.5 shrink-0 text-muted" />
					</Button>
				))}
			</div>
		</BlockSection>
	);
}

NextSteps.template = "next-steps" as const;
NextSteps.info =
	"Owner-only actions that continue the work in Klee or a connected app. Pick it when the artefact supports concrete follow-up actions; omit it for passive reference material or public viewers.";
NextSteps.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
