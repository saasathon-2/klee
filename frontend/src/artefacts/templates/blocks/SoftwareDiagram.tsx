import {
	Background,
	Controls,
	Handle,
	MarkerType,
	Position,
	ReactFlow,
} from "@xyflow/react";
import type {
	Edge as XYFlowEdge,
	Node as XYFlowNode,
	NodeProps,
} from "@xyflow/react";
import dagre from "dagre";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import type { SoftwareDiagramEdge, SoftwareDiagramNode } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeWidth = 256;
const nodeHeight = 120;

function ComponentNode({ data }: NodeProps<XYFlowNode<SoftwareDiagramNode, "component">>) {
	return (
		<div role="group" aria-label={`${data.label}: ${data.detail}`} className="software-diagram-node relative h-[120px] w-64 rounded-xl border border-divider border-l-4 bg-surface p-4 text-surface-foreground shadow-sm" style={{ borderLeftColor: "color-mix(in oklab, var(--brand) 35%, var(--brand-foreground))" }}>
			<Handle type="target" position={Position.Left} className="!border-0 !bg-transparent" />
			<div className="line-clamp-2 text-base font-semibold leading-6">{data.label}</div>
			<div className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{data.detail}</div>
			<Handle type="source" position={Position.Right} className="!border-0 !bg-transparent" />
		</div>
	);
}

const nodeTypes = { component: ComponentNode };

function layoutDiagram(nodes: SoftwareDiagramNode[], edges: SoftwareDiagramEdge[]) {
	const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	graph.setGraph({ rankdir: "LR", nodesep: 96, ranksep: 200, marginx: 48, marginy: 48 });
	for (const node of nodes) graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	for (const edge of edges) graph.setEdge(edge.source, edge.target);
	dagre.layout(graph);

	const flowNodes: XYFlowNode<SoftwareDiagramNode, "component">[] = nodes.map((node) => {
		const position = graph.node(node.id);
		return {
			id: node.id,
			type: "component",
			position: { x: position.x - nodeWidth / 2, y: position.y - nodeHeight / 2 },
			data: node,
			width: nodeWidth,
			height: nodeHeight,
		};
	});
	const flowEdges: XYFlowEdge[] = edges.map((edge, index) => ({
		id: `${edge.source}-${edge.target}-${index}`,
		source: edge.source,
		target: edge.target,
		type: "smoothstep",
		label: edge.label || undefined,
		markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
		style: { stroke: "var(--border)", strokeWidth: 1.5 },
		labelStyle: { fill: "var(--foreground)", fontSize: 11 },
		labelBgStyle: { fill: "var(--surface-tertiary)", fillOpacity: 0.98 },
	}));
	return { nodes: flowNodes, edges: flowEdges, height: graph.graph().height };
}

export function SoftwareDiagram({ node }: TemplateProps) {
	const { title, description, nodes, edges } = node.data as {
		title: string;
		description: string;
		nodes: SoftwareDiagramNode[];
		edges: SoftwareDiagramEdge[];
	};
	const diagram = useMemo(() => layoutDiagram(nodes, edges), [nodes, edges]);
	const labels = new Map(nodes.map((item) => [item.id, item.label]));
	return (
		<BlockSection title={title} description={description}>
			<div role="group" className="software-diagram-canvas min-h-[480px] overflow-hidden rounded-2xl border border-divider bg-background" style={{ height: Math.max(480, diagram.height + 80) }} aria-label={`${title} component diagram`}>
				<ReactFlow
					nodes={diagram.nodes}
					edges={diagram.edges}
					nodeTypes={nodeTypes}
					fitView
					fitViewOptions={{ padding: 0.24, maxZoom: 1 }}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable={false}
					zoomOnScroll
					panOnDrag
					proOptions={{ hideAttribution: false }}
				>
					<Background color="color-mix(in oklab, var(--border) 55%, transparent)" gap={24} size={1} />
					<Controls showInteractive={false} className="klee-diagram-controls" />
				</ReactFlow>
			</div>
			<ul className="sr-only" aria-label="Component relationships">
				{edges.map((edge, index) => (
					<li key={`${edge.source}-${edge.target}-${index}`}>
						{labels.get(edge.source)} {edge.label ? `${edge.label} ` : "depends on "}{labels.get(edge.target)}
					</li>
				))}
			</ul>
		</BlockSection>
	);
}

SoftwareDiagram.template = "software-diagram" as const;
SoftwareDiagram.info =
	"Component and dependency diagram for software changes. Include only components and relationships supported by the supplied code or description; omit it when the source does not establish a useful graph.";
SoftwareDiagram.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
