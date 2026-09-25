import type { ReactNode } from "react";
import type { ArtefactNode } from "../model";

export type TemplateName = ArtefactNode["template"];

export type RenderContext = {
	createdAt: string;
	canInteract: boolean;
	edgeToEdge: boolean;
	showFooter: boolean;
	onAction?: (label: string) => void;
};

export type TemplateProps = {
	node: ArtefactNode;
	children: ReactNode;
	context: RenderContext;
};

export type Template = (props: TemplateProps) => ReactNode;

export type TemplateDefinition = {
	template: TemplateName;
	info: string;
	children: {
		min: number;
		max: number;
		allowed: TemplateName[];
	};
	component: Template;
};

export type TemplateSelectionInfo = Omit<TemplateDefinition, "component">;
