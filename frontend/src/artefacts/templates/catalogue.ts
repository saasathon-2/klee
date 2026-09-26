import type { ArtefactNode } from "../model";
import { ArchitectureFlow } from "./blocks/ArchitectureFlow";
import { CheckList } from "./blocks/CheckList";
import { CodeDiff } from "./blocks/CodeDiff";
import { CommitList } from "./blocks/CommitList";
import { ComparisonTable } from "./blocks/ComparisonTable";
import { CurveChart } from "./blocks/CurveChart";
import { Glue } from "./blocks/Glue";
import { HazardRegister } from "./blocks/HazardRegister";
import { HierarchyTree } from "./blocks/HierarchyTree";
import { MetricRow } from "./blocks/MetricRow";
import { NextSteps } from "./blocks/NextSteps";
import { Pinout } from "./blocks/Pinout";
import { Prose } from "./blocks/Prose";
import { ReviewComments } from "./blocks/ReviewComments";
import { RiskMatrix } from "./blocks/RiskMatrix";
import { SignOffGrid } from "./blocks/SignOffGrid";
import { SoftwareDiagram } from "./blocks/SoftwareDiagram";
import { SourceFigure } from "./blocks/SourceFigure";
import { SpecTable } from "./blocks/SpecTable";
import { TaskList } from "./blocks/TaskList";
import { DeveloperPage, GenericPage } from "./categories/CategoryPage";
import { ArtefactPage } from "./page/ArtefactPage";
import type {
	Template,
	TemplateDefinition,
	TemplateName,
	TemplateSelectionInfo,
} from "./types";

function definition(
	component: Template & TemplateSelectionInfo,
): TemplateDefinition {
	return {
		template: component.template,
		info: component.info,
		children: component.children,
		component,
	};
}

export const templateDefinitions: Record<
	ArtefactNode["template"],
	TemplateDefinition
> = {
	"artefact-page": definition(ArtefactPage),
	"developer-page": definition(DeveloperPage),
	"generic-page": definition(GenericPage),
	"metric-row": definition(MetricRow),
	"architecture-flow": definition(ArchitectureFlow),
	"software-diagram": definition(SoftwareDiagram),
	glue: definition(Glue),
	"task-list": definition(TaskList),
	"next-steps": definition(NextSteps),
	prose: definition(Prose),
	"code-diff": definition(CodeDiff),
	"review-comments": definition(ReviewComments),
	"commit-list": definition(CommitList),
	"check-list": definition(CheckList),
	"risk-matrix": definition(RiskMatrix),
	"hazard-register": definition(HazardRegister),
	"hierarchy-tree": definition(HierarchyTree),
	"sign-off-grid": definition(SignOffGrid),
	"spec-table": definition(SpecTable),
	pinout: definition(Pinout),
	"curve-chart": definition(CurveChart),
	"comparison-table": definition(ComparisonTable),
	"source-figure": definition(SourceFigure),
};

function selectionInfo(definition: TemplateDefinition): TemplateSelectionInfo {
	return {
		template: definition.template,
		info: definition.info,
		children: definition.children,
	};
}

/** Serializable metadata suitable for structured-output model context. */
export const templateSelectionGuide = (
	Object.keys(templateDefinitions) as TemplateName[]
).map((name) => selectionInfo(templateDefinitions[name]));

/** Returns the model-facing definitions allowed in a specific parent slot. */
export function getChildTemplateSelectionGuide(
	parent: TemplateName,
): TemplateSelectionInfo[] {
	return templateDefinitions[parent].children.allowed.map((name) =>
		selectionInfo(templateDefinitions[name]),
	);
}
