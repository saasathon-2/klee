import type { ArtefactDocument, ArtefactNode } from "../model";
import { templateDefinitions } from "./catalogue";
import type { RenderContext } from "./types";

function RenderNode({
	node,
	context,
}: {
	node: ArtefactNode;
	context: RenderContext;
}) {
	const TemplateComponent = templateDefinitions[node.template].component;
	return (
		<TemplateComponent node={node} context={context}>
			{node.children?.map((child) => (
				<RenderNode key={child.id} node={child} context={context} />
			))}
		</TemplateComponent>
	);
}

export function ArtefactRenderer({
	document,
	createdAt,
	canInteract,
	edgeToEdge = false,
	showFooter = true,
	onAction,
}: {
	document: ArtefactDocument;
	createdAt: string;
	canInteract: boolean;
	edgeToEdge?: boolean;
	/** Draws the scalloped band at the bottom of the artefact. */
	showFooter?: boolean;
	onAction?: (label: string) => void;
}) {
	return (
		<RenderNode
			node={document.root}
			context={{ createdAt, canInteract, edgeToEdge, showFooter, onAction }}
		/>
	);
}
