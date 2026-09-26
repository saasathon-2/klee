import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
} from "@xyflow/react";
import type {
    Edge as XYFlowEdge,
    Node as XYFlowNode,
    NodeTypes,
} from "@xyflow/react";
import dagre from "dagre";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";
import type { SoftwareDiagramEdge, SoftwareDiagramNode } from "../../model";

function layoutDiagram<T extends SoftwareDiagramNode>(
    nodes: T[],
    edges: SoftwareDiagramEdge[],
    type: string,
    size: { width: number; height: number },
) {
    const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: "LR",
        nodesep: 96,
        ranksep: 200,
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
export function DiagramCanvas<T extends SoftwareDiagramNode>({
    title,
    nodes,
    edges,
    type,
    nodeTypes,
    nodeSize,
}: {
    title: string;
    nodes: T[];
    edges: SoftwareDiagramEdge[];
    type: string;
    nodeTypes: NodeTypes;
    nodeSize: { width: number; height: number };
}) {
    const diagram = useMemo(
        () => layoutDiagram(nodes, edges, type, nodeSize),
        [nodes, edges, type, nodeSize],
    );
    const labels = new Map(nodes.map((item) => [item.id, item.label]));
    return (
        <>
            <div
                role="group"
                className="software-diagram-canvas min-h-[480px] overflow-hidden rounded-2xl border border-divider bg-background"
                style={{ height: Math.max(480, diagram.height + 80) }}
                aria-label={`${title} component diagram`}
            >
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
                    <Background
                        color="color-mix(in oklab, var(--border) 55%, transparent)"
                        gap={24}
                        size={1}
                    />
                    <Controls
                        showInteractive={false}
                        className="klee-diagram-controls"
                    />
                </ReactFlow>
            </div>
            <ul className="sr-only" aria-label="Component relationships">
                {edges.map((edge, index) => (
                    <li key={`${edge.source}-${edge.target}-${index}`}>
                        {labels.get(edge.source)}{" "}
                        {edge.label ? `${edge.label} ` : "depends on "}
                        {labels.get(edge.target)}
                    </li>
                ))}
            </ul>
        </>
    );
}
