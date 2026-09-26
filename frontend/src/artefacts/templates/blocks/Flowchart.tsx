import { Chip } from "@heroui/react";
import { Handle, Position } from "@xyflow/react";
import type { Node as XYFlowNode, NodeProps } from "@xyflow/react";
import type { FlowchartStep, SoftwareDiagramEdge } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { useMemo } from "react";
import { DiagramCanvas, type DiagramDirection } from "../page/DiagramCanvas";
import { SourceLink } from "../page/SourceLink";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeSize = { width: 216, height: 96 };

const handleClass = "!border-0 !bg-transparent";

function StepShape({ kind }: { kind: FlowchartStep["kind"] }) {
	if (kind === "decision")
		return (
			<svg
				aria-hidden
				className="absolute inset-0 size-full overflow-visible"
				viewBox="0 0 216 96"
				preserveAspectRatio="none"
			>
				<polygon
					points="108,1 215,48 108,95 1,48"
					className="flowchart-shape fill-surface stroke-divider"
					strokeWidth={1}
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		);
	return (
		<span
			aria-hidden
			className={`flowchart-shape absolute inset-0 border border-divider bg-surface shadow-sm ${
				kind === "step" ? "rounded-xl" : "rounded-full border-2 border-brand"
			}`}
		/>
	);
}

type FlowchartNodeData = FlowchartStep & { direction: DiagramDirection };

function FlowchartNode({ data }: NodeProps<XYFlowNode<FlowchartNodeData, "step">>) {
	const across = data.direction === "LR";
	const content = (
		<>
			<StepShape kind={data.kind} />
			<span
				className={`relative line-clamp-2 font-semibold leading-5 ${
					data.kind === "decision" ? "max-w-32 text-sm" : "text-sm"
				}`}
			>
				{data.label}
			</span>
			{data.detail && data.kind !== "decision" && (
				<span className="relative mt-0.5 line-clamp-2 text-xs leading-4 text-muted">
					{data.detail}
				</span>
			)}
		</>
	);
	return (
		<div
			role="group"
			aria-label={`${data.label}${data.detail ? `: ${data.detail}` : ""}`}
			title={data.detail ?? undefined}
			className="relative flex h-24 w-[216px] text-surface-foreground"
		>
			<Handle type="target" position={across ? Position.Left : Position.Top} className={handleClass} />
			<SourceLink
				href={data.url}
				className="relative flex size-full flex-col items-center justify-center px-5 text-center"
			>
				{content}
			</SourceLink>
			<Handle type="source" position={across ? Position.Right : Position.Bottom} className={handleClass} />
		</div>
	);
}

const nodeTypes = { step: FlowchartNode };

export function Flowchart({ node, context }: TemplateProps) {
	const { title, description, steps, edges, direction = "TB" } = node.data as {
		title: string;
		description: string;
		steps: FlowchartStep[];
		edges: SoftwareDiagramEdge[];
		/** Left to right suits short, architecture-style flows. */
		direction?: DiagramDirection;
	};
	const nodes = useMemo(() => steps.map((step) => ({ ...step, direction })), [steps, direction]);
	const decisions = steps.filter((step) => step.kind === "decision").length;
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			{decisions > 0 && (
				<Chip size="sm" className="mb-3">
					{decisions} {decisions === 1 ? "decision" : "decisions"}
				</Chip>
			)}
			<DiagramCanvas
				title={title}
				nodes={nodes}
				edges={edges}
				type="step"
				nodeTypes={nodeTypes}
				nodeSize={nodeSize}
				direction={direction}
				minHeight={direction === "LR" ? 240 : 360}
			/>
		</BlockSection>
	);
}

Flowchart.template = "flowchart" as const;
Flowchart.info =
	"Top-to-bottom flowchart of a process with start, end, step, and decision nodes, and edges labelled with the decision outcome. Pick it for release processes, request handling, on-call runbooks, CI pipelines, or any procedure with branches.";
Flowchart.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
