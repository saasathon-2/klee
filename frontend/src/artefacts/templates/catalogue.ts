import type { ArtefactNode } from "../model";
import { ActivityTrend } from "./blocks/ActivityTrend";
import { ArchitectureFlow } from "./blocks/ArchitectureFlow";
import { ChangeImpactMap } from "./blocks/ChangeImpactMap";
import { CheckList } from "./blocks/CheckList";
import { CodeDiff } from "./blocks/CodeDiff";
import { CommitList } from "./blocks/CommitList";
import { DecisionRecord } from "./blocks/DecisionRecord";
import { DeliveryProgress } from "./blocks/DeliveryProgress";
import { DeliveryReadiness } from "./blocks/DeliveryReadiness";
import { DependencyRiskRegister } from "./blocks/DependencyRiskRegister";
import { DependencyGraph } from "./blocks/DependencyGraph";
import { EvidenceTable } from "./blocks/EvidenceTable";
import { GitGraph } from "./blocks/GitGraph";
import { Flowchart } from "./blocks/Flowchart";
import { Glue } from "./blocks/Glue";
import { HandoffBrief } from "./blocks/HandoffBrief";
import { IncidentTimeline } from "./blocks/IncidentTimeline";
import { MetricRow } from "./blocks/MetricRow";
import { NextSteps } from "./blocks/NextSteps";
import { Prose } from "./blocks/Prose";
import { ReleaseTimeline } from "./blocks/ReleaseTimeline";
import { ReviewComments } from "./blocks/ReviewComments";
import { ServiceOwnership } from "./blocks/ServiceOwnership";
import { SoftwareDiagram } from "./blocks/SoftwareDiagram";
import { SprintTimeline } from "./blocks/SprintTimeline";
import { TaskList } from "./blocks/TaskList";
import { TwoColumn } from "./blocks/TwoColumn";
import { WorkItemBoard } from "./blocks/WorkItemBoard";
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
	flowchart: definition(Flowchart),
	"dependency-graph": definition(DependencyGraph),
	glue: definition(Glue),
	"task-list": definition(TaskList),
	"next-steps": definition(NextSteps),
	prose: definition(Prose),
	"code-diff": definition(CodeDiff),
	"review-comments": definition(ReviewComments),
	"commit-list": definition(CommitList),
	"check-list": definition(CheckList),
	"sprint-timeline": definition(SprintTimeline),
	"delivery-progress": definition(DeliveryProgress),
	"work-item-board": definition(WorkItemBoard),
	"git-graph": definition(GitGraph),
	"change-impact-map": definition(ChangeImpactMap),
	"release-timeline": definition(ReleaseTimeline),
	"incident-timeline": definition(IncidentTimeline),
	"delivery-readiness": definition(DeliveryReadiness),
	"dependency-risk-register": definition(DependencyRiskRegister),
	"service-ownership": definition(ServiceOwnership),
	"decision-record": definition(DecisionRecord),
	"evidence-table": definition(EvidenceTable),
	"activity-trend": definition(ActivityTrend),
	"handoff-brief": definition(HandoffBrief),
	"two-column": definition(TwoColumn),
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
