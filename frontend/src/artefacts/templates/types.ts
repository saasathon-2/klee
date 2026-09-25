import type { ReactNode } from "react";
import type { ArtefactNode } from "../model";

export type TemplateName = ArtefactNode["template"];

export type RenderContext = {
	createdAt: string;
	canInteract: boolean;
	edgeToEdge: boolean;
	showFooter: boolean;
	/** Text fields render as inputs and report changes through `onEdit`. */
	isEditing: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: string) => void;
};

/** Path to a text field inside a node's `data`, e.g. ["tasks", 0, "title"]. */
export type EditPath = (string | number)[];

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
