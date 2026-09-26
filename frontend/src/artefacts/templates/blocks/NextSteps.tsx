import { Button, Card } from "@heroui/react";
import { ExternalLink, Sparkles } from "lucide-react";
import type { ComponentProps } from "react";
import type { SuggestedAction } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import { safeUrl } from "../page/safeUrl";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function NextSteps({ node, context }: TemplateProps) {
	const { title, actions: allActions } = node.data as {
		title: string;
		actions: SuggestedAction[];
	};
	// Link buttons work for every viewer; follow-up prompts are owner-only.
	const actions = context.canInteract || context.isEditing
		? allActions
		: allActions.filter((action) => safeUrl(action.url));
	if (actions.length === 0) return null;
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} edit={{ node, context }}>
			<div className="grid gap-3 sm:grid-cols-3">
				{actions.map((action, index) =>
					context.isEditing ? (
						// Inputs can't sit inside a button, so edit the actions as plain cards.
						<Card key={action.action} variant="secondary" className="gap-1">
							{text(["actions", index, "label"], action.label, "Action label")}
							{text(
								["actions", index, "description"],
								action.description,
								"Action description",
							)}
						</Card>
					) : (
						<ActionButton key={action.action} action={action} onAction={context.onAction} />
					),
				)}
			</div>
		</BlockSection>
	);
}

const actionClass =
	"h-auto w-full min-w-0 items-start justify-between gap-3 rounded-xl px-4 py-3 text-left whitespace-normal";

function ActionButton({
	action,
	onAction,
}: {
	action: SuggestedAction;
	onAction?: (label: string) => void;
}) {
	const url = safeUrl(action.url);
	const Icon = url ? ExternalLink : Sparkles;
	const content = (
		<>
			<span className="min-w-0">
				<span className="block text-sm font-medium text-foreground">{action.label}</span>
				<span className="mt-0.5 block text-xs leading-5 font-normal text-muted">
					{action.description}
				</span>
			</span>
			<Icon size={16} aria-hidden className="mt-0.5 shrink-0 text-muted" />
		</>
	);
	if (url)
		return (
			<Button
				variant="secondary"
				className={actionClass}
				render={(props) => (
					<a {...(props as ComponentProps<"a">)} href={url} target="_blank" rel="noreferrer" />
				)}
			>
				{content}
			</Button>
		);
	return (
		<Button variant="secondary" className={actionClass} onPress={() => onAction?.(action.label)}>
			{content}
		</Button>
	);
}

NextSteps.template = "next-steps" as const;
NextSteps.info =
	"Buttons that continue the work: links that open a supplied page for every viewer, and owner-only prompts that ask Klee for a follow-up. Pick it when the artefact supports concrete follow-up actions; omit it for passive reference material.";
NextSteps.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
