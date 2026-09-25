import { Button } from "@heroui/react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { SuggestedAction } from "../../model";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function NextSteps({ node, context }: TemplateProps) {
	if (!context.canInteract) return null;
	const { title, actions } = node.data as {
		title: string;
		actions: SuggestedAction[];
	};
	return (
		<section className="bg-surface-secondary px-6 py-9 sm:px-10 sm:py-12">
			<div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-muted uppercase">
				<Sparkles size={14} /> Suggested next steps
			</div>
			<h3 className="mt-2 text-2xl font-semibold tracking-tight">
				{title}
			</h3>
			<div className="mt-6 grid gap-3 sm:grid-cols-2">
				{actions.map((action) => (
					<Button
						key={action.action}
						variant="secondary"
						className="h-auto min-h-20 min-w-0 justify-between gap-4 rounded-xl border border-divider bg-surface px-4 py-4 text-left whitespace-normal"
						onPress={() => context.onAction?.(action.label)}
					>
						<span className="min-w-0">
							<span className="block text-sm font-semibold">
								{action.label}
							</span>
							<span className="mt-1 block text-xs leading-5 text-muted">
								{action.description}
							</span>
						</span>
						<ArrowRight size={16} className="shrink-0" />
					</Button>
				))}
			</div>
		</section>
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
