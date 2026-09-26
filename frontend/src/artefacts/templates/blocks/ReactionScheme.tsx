import { Card, Chip, Paragraph } from "@heroui/react";
import { ArrowDown } from "lucide-react";
import { Fragment } from "react";
import type { ReactionStep } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { MathText } from "../page/MathText";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

/** Escapes plain text for a LaTeX `\text{}` group. */
const latexText = (value: string) =>
	value.replace(/[\\{}$%#&_^~]/g, (char) =>
		char === "\\" ? "\\textbackslash{}" : char === "~" ? "\\textasciitilde{}" : char === "^" ? "\\textasciicircum{}" : `\\${char}`,
	);

/**
 * The step as mhchem, with its conditions written over the first reaction
 * arrow unless the equation already annotates it.
 */
function schemeLatex(step: ReactionStep) {
	const arrow = /(<=>>|<<=>|<-->|<=>|<->|->|<-)(?!\[)/;
	const equation = step.conditions
		? step.equation.replace(arrow, (match) => `${match}[{\\text{${latexText(step.conditions!)}}}]`)
		: step.equation;
	return `\\ce{${equation}}`;
}

export function ReactionScheme({ node, context }: TemplateProps) {
	const { title, description, steps } = node.data as {
		title: string;
		description: string;
		steps: ReactionStep[];
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<ol aria-label="Reaction steps" className="flex flex-col items-stretch">
				{steps.map((step, index) => (
					<Fragment key={index}>
						{index > 0 && (
							<li aria-hidden className="flex justify-center py-1 text-muted">
								<ArrowDown size={18} />
							</li>
						)}
						<li>
							<Card variant="secondary" className="gap-3 px-5 py-4">
								<div className="flex items-center justify-between gap-3">
									<Paragraph size="xs" weight="medium" color="muted" className="uppercase tracking-wide">
										{steps.length > 1 ? `Step ${index + 1}` : "Reaction"}
									</Paragraph>
									{step.yield !== null && (
										<Chip size="sm" color="success">
											{step.yield}% yield
										</Chip>
									)}
								</div>
								<div className="overflow-x-auto py-2 text-center text-lg">
									{context.isEditing ? (
										text(["steps", index, "equation"], step.equation, "Equation (mhchem)")
									) : (
										<MathText latex={schemeLatex(step)} display />
									)}
								</div>
								{context.isEditing && step.conditions && text(["steps", index, "conditions"], step.conditions, "Conditions")}
								{step.note && (
									<Paragraph size="sm" color="muted">
										{text(["steps", index, "note"], step.note, "Note", true)}
									</Paragraph>
								)}
							</Card>
						</li>
					</Fragment>
				))}
			</ol>
		</BlockSection>
	);
}

ReactionScheme.template = "reaction-scheme" as const;
ReactionScheme.info =
	"Typeset chemical equations for a reaction or multi-step synthesis, with conditions over each arrow, yields, and notes. Pick it for syntheses, mechanisms summarised as equations, balanced equations, or equilibria.";
ReactionScheme.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
