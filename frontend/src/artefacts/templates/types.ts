import type { ReactNode } from "react";
import type { ArtefactNode, FigureCrop } from "../model";

export type TemplateName = ArtefactNode["template"];

export type RenderContext = {
	createdAt: string;
	canInteract: boolean;
	edgeToEdge: boolean;
	showFooter: boolean;
	compactHeader: boolean;
	/** Editable content reports changes through `onEdit`. */
	isEditing: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: unknown) => void;
	/** URL of a figure cropped from one of the artefact's source PDFs. */
	figureSrc?: (figure: FigureRequest) => string;
};

export type FigureRequest = {
	attachmentId: string;
	page: number;
	crop: FigureCrop | null;
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
