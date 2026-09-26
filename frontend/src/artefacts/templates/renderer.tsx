import type { ReactNode } from "react";
import type { ArtefactDocument, ArtefactNode } from "../model";
import { templateDefinitions } from "./catalogue";
import type { EditPath, RenderContext } from "./types";

function RenderNode({
	node,
	context,
	renderNode,
}: {
	node: ArtefactNode;
	context: RenderContext;
	renderNode?: (node: ArtefactNode, rendered: ReactNode) => ReactNode;
}) {
	const TemplateComponent = templateDefinitions[node.template].component;
	const rendered = (
		<TemplateComponent node={node} context={context}>
			{node.children?.map((child) => (
				<RenderNode key={child.id} node={child} context={context} renderNode={renderNode} />
			))}
		</TemplateComponent>
	);
	return renderNode?.(node, rendered) ?? rendered;
}

export function ArtefactRenderer({
	document,
	createdAt,
	canInteract,
	edgeToEdge = false,
	showFooter = true,
	fillViewport = false,
	compactHeader = false,
	isEditing = false,
	onAction,
	onEdit,
	liveStatus,
	renderNode,
}: {
	document: ArtefactDocument;
	createdAt: string;
	canInteract: boolean;
	edgeToEdge?: boolean;
	/** Draws the scalloped band at the bottom of the artefact. */
	showFooter?: boolean;
	/** Keeps the footer at the bottom of the visible artefact page. */
	fillViewport?: boolean;
	/** Hides nonessential header metadata for social-image snapshots. */
	compactHeader?: boolean;
	isEditing?: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: unknown) => void;
	liveStatus?: RenderContext["liveStatus"];
	renderNode?: (node: ArtefactNode, rendered: ReactNode) => ReactNode;
}) {
	return (
		<RenderNode
			node={document.root}
			context={{
				createdAt,
				canInteract,
				edgeToEdge,
				showFooter,
				fillViewport,
				compactHeader,
				isEditing,
				onAction,
				onEdit,
				liveStatus,
			}}
			renderNode={renderNode}
		/>
	);
}
