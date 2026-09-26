import { Card, Paragraph, Separator } from "@heroui/react";
import { Fragment } from "react";
import type { DerivationStep } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { MathText } from "../page/MathText";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function Derivation({ node, context }: TemplateProps) {
	const { title, description, steps, result } = node.data as {
		title: string;
		description: string;
		steps: DerivationStep[];
		result: string | null;
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<Card className="gap-0 p-0">
				<ol aria-label="Steps">
					{steps.map((step, index) => (
						<Fragment key={index}>
							{index > 0 && <Separator />}
							<li className="grid gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,16rem)] sm:items-center">
								<span className="text-xs text-muted tabular-nums">{index + 1}</span>
								<div className="min-w-0 overflow-x-auto py-1 text-lg">
									{context.isEditing ? (
										text(["steps", index, "latex"], step.latex, "Step (LaTeX)")
									) : (
										<MathText latex={step.latex} />
									)}
								</div>
								{step.justification && (
									<Paragraph size="sm" color="muted" className="sm:text-right">
										{text(["steps", index, "justification"], step.justification, "Justification")}
									</Paragraph>
								)}
							</li>
						</Fragment>
					))}
				</ol>
			</Card>
			{result && (
				<div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-brand px-6 py-5 text-brand-foreground">
					<Paragraph size="xs" weight="medium" className="text-inherit uppercase tracking-wide opacity-70">
						Result
					</Paragraph>
					<div className="max-w-full overflow-x-auto text-xl">
						{context.isEditing ? (
							text(["result"], result, "Result (LaTeX)")
						) : (
							<MathText latex={result} display />
						)}
					</div>
				</div>
			)}
		</BlockSection>
	);
}

Derivation.template = "derivation" as const;
Derivation.info =
	"Typeset step-by-step working, one LaTeX line per step with its justification, ending in a highlighted result. Pick it for proofs, derivations, worked solutions, or algebraic simplifications.";
Derivation.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
