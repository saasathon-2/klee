import { Handle, Position } from "@xyflow/react";
import type { Node as XYFlowNode, NodeProps } from "@xyflow/react";
import type { SoftwareDiagramEdge, SoftwareDiagramNode } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { DiagramCanvas } from "../page/DiagramCanvas";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeSize = { width: 256, height: 120 };

function ComponentNode({
    data,
}: NodeProps<XYFlowNode<SoftwareDiagramNode, "component">>) {
    return (
        <div
            role="group"
            aria-label={`${data.label}: ${data.detail}`}
            className="software-diagram-node relative h-[120px] w-64 rounded-xl border border-divider border-l-4 bg-surface p-4 text-surface-foreground shadow-sm"
            style={{
                borderLeftColor:
                    "color-mix(in oklab, var(--brand) 35%, var(--brand-foreground))",
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!border-0 !bg-transparent"
            />
            <div className="line-clamp-2 text-base font-semibold leading-6">
                {data.label}
            </div>
            <div className="mt-2 line-clamp-2 text-sm leading-5 text-muted">
                {data.detail}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                className="!border-0 !bg-transparent"
            />
        </div>
    );
}

const nodeTypes = { component: ComponentNode };

export function SoftwareDiagram({ node }: TemplateProps) {
    const { title, description, nodes, edges } = node.data as {
        title: string;
        description: string;
        nodes: SoftwareDiagramNode[];
        edges: SoftwareDiagramEdge[];
    };
    return (
        <BlockSection title={title} description={description}>
            <DiagramCanvas
                title={title}
                nodes={nodes}
                edges={edges}
                type="component"
                nodeTypes={nodeTypes}
                nodeSize={nodeSize}
            />
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
