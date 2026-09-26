import type { ReactNode } from "react";
import type { ArtefactNode } from "../model";
import type { LiveStatus } from "./page/liveStatus";

export type TemplateName = ArtefactNode["template"];

export type RenderContext = {
	createdAt: string;
	canInteract: boolean;
	edgeToEdge: boolean;
	showFooter: boolean;
	/** Makes the artefact shell fill the viewport so its footer reaches the bottom. */
	fillViewport: boolean;
	compactHeader: boolean;
	/** Editable content reports changes through `onEdit`. */
	isEditing: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: unknown) => void;
	/** Current statuses from connected sources, keyed by the item's url. */
	liveStatus?: Record<string, LiveStatus>;
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
