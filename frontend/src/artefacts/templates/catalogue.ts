import type { ArtefactNode } from "../model";
import { ArchitectureFlow } from "./blocks/ArchitectureFlow";
import { CheckList } from "./blocks/CheckList";
import { CodeDiff } from "./blocks/CodeDiff";
import { CommitList } from "./blocks/CommitList";
import { Glue } from "./blocks/Glue";
import { MetricRow } from "./blocks/MetricRow";
import { NextSteps } from "./blocks/NextSteps";
import { Prose } from "./blocks/Prose";
import { ReviewComments } from "./blocks/ReviewComments";
import { SoftwareDiagram } from "./blocks/SoftwareDiagram";
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
