import {
    Background,
    Controls,
    MarkerType,
	Panel,
    ReactFlow,
} from "@xyflow/react";
import type {
    Edge as XYFlowEdge,
    Node as XYFlowNode,
    NodeTypes,
} from "@xyflow/react";
import dagre from "dagre";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { SoftwareDiagramEdge } from "../../model";
import { SourceLink } from "./SourceLink";

type DiagramNode = {
    id: string;
    label: string;
    detail?: string | null;
    url?: string | null;
};

/** Left-to-right suits dependency graphs; top-to-bottom suits flowcharts. */
export type DiagramDirection = "LR" | "TB";

/** A readable fallback for every interactive graph, including shared previews. */
export function DiagramDetails<T extends DiagramNode>({
    nodes,
    edges,
	focusedId,
	onFocus,
}: {
    nodes: T[];
    edges: SoftwareDiagramEdge[];
	focusedId?: string;
	onFocus?: (id: string) => void;
}) {
    const labels = new Map(nodes.map((item) => [item.id, item.label]));
    return (
        <details className="mt-3 rounded-xl border border-divider bg-surface px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">
                {nodes.length} {nodes.length === 1 ? "component" : "components"} · {edges.length}{" "}
                {edges.length === 1 ? "relationship" : "relationships"}
            </summary>
            <div className="mt-3 grid gap-3 text-muted sm:grid-cols-2">
                <ul aria-label="Components" className="space-y-1.5">
                    {nodes.map((node) => (
                        <li key={node.id}>
							{onFocus ? (
								<button
									type="button"
									aria-pressed={focusedId === node.id}
									className="font-medium text-foreground underline-offset-2 hover:underline"
									onClick={() => onFocus(node.id)}
								>
									{node.label}
								</button>
							) : (
								<SourceLink href={node.url} className="relative inline font-medium text-foreground underline-offset-2 hover:underline">
									{node.label}
								</SourceLink>
							)}
							{onFocus && node.url && (
								<SourceLink href={node.url} className="relative ml-1 text-xs underline-offset-2 hover:underline">
									Source
								</SourceLink>
							)}
                            {node.detail ? ` · ${node.detail}` : ""}
                        </li>
                    ))}
                </ul>
                <ul aria-label="Relationships" className="space-y-1.5">
                    {edges.map((edge, index) => (
                        <li key={`${edge.source}-${edge.target}-${index}`}>
                            <SourceLink href={edge.url} className="relative inline text-muted underline-offset-2 hover:text-foreground hover:underline">
                                {labels.get(edge.source)} {edge.label || "depends on"} {labels.get(edge.target)}
                            </SourceLink>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}

function layoutDiagram<T extends DiagramNode>(
    nodes: T[],
    edges: SoftwareDiagramEdge[],
    type: string,
    size: { width: number; height: number },
    direction: DiagramDirection,
) {
    const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: direction,
        nodesep: direction === "LR" ? 96 : 64,
        ranksep: direction === "LR" ? 200 : 80,
        marginx: 48,
        marginy: 48,
    });
    // dagre writes each node's position onto its label, so each needs its own.
    for (const node of nodes) graph.setNode(node.id, { ...size });
    for (const edge of edges) graph.setEdge(edge.source, edge.target);
    dagre.layout(graph);

    const flowNodes: XYFlowNode<T>[] = nodes.map((node) => {
        const position = graph.node(node.id);
        return {
            id: node.id,
            type,
            position: {
                x: position.x - size.width / 2,
                y: position.y - size.height / 2,
            },
            data: node,
            width: size.width,
            height: size.height,
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
    return {
        nodes: flowNodes,
        edges: flowEdges,
        height: graph.graph().height ?? 0,
    };
}

/**
 * Laid-out, pannable dependency graph shared by the software diagram and the
 * change impact map. `nodeTypes` must hold `type` and be defined at module
 * scope so React Flow doesn't remount nodes on every render.
 */
export function DiagramCanvas<T extends DiagramNode>({
    title,
    nodes,
    edges,
    type,
    nodeTypes,
    nodeSize,
    direction = "LR",
    minHeight = 480,
}: {
    title: string;
    nodes: T[];
    edges: SoftwareDiagramEdge[];
    type: string;
    nodeTypes: NodeTypes;
    nodeSize: { width: number; height: number };
    direction?: DiagramDirection;
    minHeight?: number;
}) {
	const [focusedId, setFocusedId] = useState<string>();
    const diagram = useMemo(
        () => layoutDiagram(nodes, edges, type, nodeSize, direction),
        [nodes, edges, type, nodeSize, direction],
    );
	const renderedEdges = diagram.edges.map((edge, index) => {
		const relationship = edges[index];
		const connected = Boolean(
			focusedId &&
				(relationship?.source === focusedId || relationship?.target === focusedId),
		);
		return connected
			? {
					...edge,
					animated: true,
					style: { ...edge.style, stroke: "var(--brand)", strokeWidth: 2.5 },
				}
			: edge;
	});
    return (
        <>
            <div
                role="group"
                className="software-diagram-canvas overflow-hidden rounded-2xl border border-divider bg-background"
                style={{ height: Math.max(minHeight, diagram.height + 80) }}
                aria-label={`${title} diagram`}
            >
                <ReactFlow
                    nodes={diagram.nodes}
                    edges={renderedEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.24, maxZoom: 1 }}
					minZoom={0.75}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
					onNodeClick={(_, item) => setFocusedId((current) => current === item.id ? undefined : item.id)}
					onPaneClick={() => setFocusedId(undefined)}
                    zoomOnScroll
                    panOnDrag
                    proOptions={{ hideAttribution: false }}
                >
                    <Background
                        color="color-mix(in oklab, var(--border) 55%, transparent)"
                        gap={24}
                        size={1}
                    />
                    <Controls
                        showInteractive={false}
                        className="klee-diagram-controls"
                    />
					{focusedId && (
						<Panel position="top-right" className="rounded-lg border border-divider bg-surface px-2 py-1 text-xs text-foreground shadow-sm">
							Tracing {nodes.find((node) => node.id === focusedId)?.label}
						</Panel>
					)}
                </ReactFlow>
            </div>
            <DiagramDetails nodes={nodes} edges={edges} focusedId={focusedId} onFocus={setFocusedId} />
        </>
    );
}
