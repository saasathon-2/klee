import {
	Background,
	BaseEdge,
	ConnectionMode,
	Controls,
	EdgeLabelRenderer,
	getSmoothStepPath,
	Handle,
	MarkerType,
	NodeResizer,
	Panel,
	Position,
	ReactFlow,
	reconnectEdge,
	useEdgesState,
	useNodesState,
	useReactFlow,
	useStore,
} from "@xyflow/react";
import type {
	Connection,
	Edge as XYFlowEdge,
	EdgeProps,
	Node as XYFlowNode,
	NodeProps,
} from "@xyflow/react";
import dagre from "dagre";
import { AppWindow, Database, Globe, Layers, Plus, Server, Trash2, Workflow } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { SoftwareDiagramEdge, SoftwareDiagramNode } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { DiagramDetails } from "../page/DiagramCanvas";
import { SourceLink } from "../page/SourceLink";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeWidth = 256;
const nodeHeight = 176;
const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left];
type NodeField = "label" | "detail";
const componentKinds = {
	client: { label: "Client", icon: AppWindow, color: "var(--chart-1)" },
	service: { label: "Service", icon: Server, color: "var(--chart-2)" },
	database: { label: "Database", icon: Database, color: "var(--chart-3)" },
	cache: { label: "Cache", icon: Layers, color: "var(--chart-4)" },
	queue: { label: "Queue", icon: Workflow, color: "var(--chart-1)" },
	external: { label: "External", icon: Globe, color: "var(--chart-2)" },
	component: { label: "Component", icon: Layers, color: "var(--brand)" },
} as const;
const editableKinds: NonNullable<SoftwareDiagramNode["kind"]>[] = [
	"client",
	"service",
	"database",
	"cache",
	"queue",
	"external",
];
type FlowNodeData = SoftwareDiagramNode & {
	isEditing: boolean;
	editingField?: NodeField;
	onStartEdit?: (field: NodeField) => void;
	onCommit?: (field: NodeField, value: string) => void;
	onKindChange?: (kind: NonNullable<SoftwareDiagramNode["kind"]>) => void;
	onUrlCommit?: (url: string | null) => void;
	onStopEdit?: () => void;
	onRemove?: () => void;
	onResizeEnd?: (position: { x: number; y: number }, width: number, height: number) => void;
};
type FlowNode = XYFlowNode<FlowNodeData, "component">;
type FlowEdgeData = {
	index: number;
	label: string;
	url: string;
	isEditing: boolean;
	editing: boolean;
	onStartEdit?: () => void;
	onCommit?: (value: string) => void;
	onUrlCommit?: (url: string | null) => void;
	onStopEdit?: () => void;
	onRemove?: () => void;
};
type FlowEdge = XYFlowEdge<FlowEdgeData, "relationship">;

function EditableNodeText({
	field,
	value,
	editing,
	onStartEdit,
	onCommit,
	onStopEdit,
}: {
	field: NodeField;
	value: string;
	editing: boolean;
	onStartEdit?: () => void;
	onCommit?: (value: string) => void;
	onStopEdit?: () => void;
}) {
	const [draft, setDraft] = useState(value);
	const cancelled = useRef(false);
	useEffect(() => {
		if (!editing) {
			setDraft(value);
			cancelled.current = false;
		}
	}, [editing, value]);

	if (!editing)
		return (
			<button
				type="button"
				className={`artefact-editable nodrag nowheel w-full rounded border border-dashed px-1 py-0.5 text-left transition-colors ${
					field === "label"
						? "text-base font-semibold leading-6"
						: "text-sm leading-5 text-muted"
				}`}
				onClick={(event) => {
					event.stopPropagation();
					onStartEdit?.();
				}}
			>
				<span className="line-clamp-2">{value}</span>
			</button>
		);

	const stopEditing = () => onStopEdit?.();
	const cancel = () => {
		cancelled.current = true;
		stopEditing();
	};
	const commit = () => {
		if (!cancelled.current) onCommit?.(draft);
		stopEditing();
	};
	if (field === "detail")
		return (
			<textarea
				autoFocus
				aria-label="Component detail"
			className="nodrag nowheel size-full min-h-12 resize-none rounded border border-[color:var(--chart-1)] bg-surface px-1 py-0.5 text-sm leading-5 text-muted outline-none"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => {
					if (event.key === "Escape") cancel();
				}}
			/>
		);
	return (
		<input
			autoFocus
			aria-label="Component name"
			className="nodrag nowheel w-full rounded border border-[color:var(--chart-1)] bg-surface px-1 py-0.5 text-base font-semibold leading-6 outline-none"
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
			onBlur={commit}
			onClick={(event) => event.stopPropagation()}
			onKeyDown={(event) => {
				if (event.key === "Enter") event.currentTarget.blur();
				if (event.key === "Escape") cancel();
			}}
		/>
	);
}

function ComponentNode({ data }: NodeProps<FlowNode>) {
	const kind = componentKinds[data.kind ?? "component"];
	const Icon = kind.icon;
	return (
		<div
			role="group"
			aria-label={`${data.label}: ${data.detail}`}
			className={`software-diagram-node group relative flex size-full flex-col rounded-xl border border-l-4 bg-surface p-4 text-surface-foreground shadow-sm ${data.isEditing ? "border-[color:var(--chart-1)]" : "border-divider"}`}
			style={{
				borderLeftColor: kind.color,
			}}
		>
			<NodeResizer
				isVisible={data.isEditing}
				minWidth={160}
				minHeight={176}
				handleClassName="!size-2.5 !rounded-sm !border-brand !bg-surface"
				lineClassName="!border-brand"
				onResizeEnd={(_, { x, y, width, height }) =>
					data.onResizeEnd?.({ x, y }, Math.round(width), Math.round(height))
				}
			/>
			{handlePositions.map((position) => (
				<Handle
					key={position}
					id={position}
					type="source"
					position={position}
					isConnectable={data.isEditing}
					className={
						data.isEditing
							? "!size-3 !border-2 !border-brand !bg-surface"
							: "!border-0 !bg-transparent"
					}
				/>
			))}
			{data.isEditing && (
				<button
					type="button"
					aria-label={`Remove ${data.label}`}
					className="nodrag nowheel absolute right-2 top-2 rounded p-1 text-muted opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"
					onClick={(event) => {
						event.stopPropagation();
						data.onRemove?.();
					}}
				>
					<Trash2 size={14} aria-hidden />
				</button>
			)}
			{data.isEditing ? (
				<>
					<div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
						<Icon size={14} aria-hidden />
						<select
							aria-label="Component type"
							className="nodrag nowheel rounded border border-divider bg-surface px-1 py-0.5 text-xs text-foreground outline-none"
							value={data.kind ?? "service"}
							onChange={(event) =>
								data.onKindChange?.(
									event.target.value as NonNullable<SoftwareDiagramNode["kind"]>,
								)
							}
						>
							{editableKinds.map((value) => (
								<option key={value} value={value}>
									{componentKinds[value].label}
								</option>
							))}
						</select>
					</div>
					<div className="pr-5">
						<EditableNodeText
							field="label"
							value={data.label}
							editing={data.editingField === "label"}
							onStartEdit={() => data.onStartEdit?.("label")}
							onCommit={(value) => data.onCommit?.("label", value)}
							onStopEdit={data.onStopEdit}
						/>
					</div>
					<div className="mt-2 min-h-0 flex-1">
						<EditableNodeText
							field="detail"
							value={data.detail}
							editing={data.editingField === "detail"}
							onStartEdit={() => data.onStartEdit?.("detail")}
							onCommit={(value) => data.onCommit?.("detail", value)}
							onStopEdit={data.onStopEdit}
						/>
					</div>
					<input
						key={data.url ?? ""}
						type="url"
						aria-label="Component source link"
						defaultValue={data.url ?? ""}
						placeholder="Source link (optional)"
						className="nodrag nowheel mt-2 w-full rounded border border-divider bg-surface px-1 py-0.5 text-xs text-muted outline-none"
						onBlur={(event) => data.onUrlCommit?.(event.currentTarget.value.trim() || null)}
						onClick={(event) => event.stopPropagation()}
					/>
				</>
			) : (
				// Fills the card so a linked component opens its source from anywhere on it.
				<SourceLink href={data.url} className="-m-4 flex min-h-0 flex-1 flex-col rounded-xl p-4">
					<div className="flex items-center gap-1.5 text-xs font-medium text-muted">
						<Icon size={14} aria-hidden />
						{kind.label}
					</div>
					<div className="mt-1 line-clamp-2 pr-5 text-base font-semibold leading-6">
						{data.label}
					</div>
					<div className="mt-1 line-clamp-3 text-sm leading-5 text-muted">
						{data.detail}
					</div>
				</SourceLink>
			)}
		</div>
	);
}

function EditableRelationshipLabel({ data }: { data: FlowEdgeData }) {
	const [draft, setDraft] = useState(data.label);
	const [sourceDraft, setSourceDraft] = useState(data.url);
	useEffect(() => {
		if (!data.editing) {
			setDraft(data.label);
			setSourceDraft(data.url);
		}
	}, [data.editing, data.label, data.url]);

	if (!data.isEditing)
		return data.label ? (
			<span className="rounded bg-surface-tertiary px-1 py-0.5 text-xs text-foreground shadow-sm">
				{data.label}
			</span>
		) : null;
	if (data.editing)
		return (
			<form
				className="nodrag nowheel flex w-48 flex-col gap-1 rounded border border-[color:var(--chart-1)] bg-surface p-1 shadow-sm"
				onSubmit={(event) => {
					event.preventDefault();
					data.onCommit?.(draft);
					data.onUrlCommit?.(sourceDraft.trim() || null);
					data.onStopEdit?.();
				}}
			>
				<input
					autoFocus
					aria-label="Relationship label"
					className="w-full rounded bg-surface px-1 py-0.5 text-xs text-foreground outline-none"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							data.onStopEdit?.();
						}
					}}
				/>
				<input
					type="url"
					aria-label="Relationship source link"
					className="w-full rounded bg-surface px-1 py-0.5 text-xs text-muted outline-none"
					value={sourceDraft}
					placeholder="Source link (optional)"
					onChange={(event) => setSourceDraft(event.target.value)}
				/>
				<button type="submit" className="rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-brand-foreground">
					Save
				</button>
			</form>
		);
	return (
		<div className="artefact-editable group flex items-center gap-0.5 rounded border border-dashed px-1 py-0.5 text-xs text-foreground shadow-sm">
			<button
				type="button"
				className="nodrag nowheel"
				onClick={(event) => {
					event.stopPropagation();
					data.onStartEdit?.();
				}}
			>
				{data.label || "Add label"}
			</button>
			<button
				type="button"
				aria-label="Remove relationship"
				className="nodrag nowheel rounded p-0.5 text-muted opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100 focus:opacity-100"
				onClick={(event) => {
					event.stopPropagation();
					data.onRemove?.();
				}}
			>
				<Trash2 size={11} aria-hidden />
			</button>
		</div>
	);
}

function RelationshipEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	markerEnd,
	style,
	data,
}: EdgeProps<FlowEdge>) {
	const [path, labelX, labelY] = getSmoothStepPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
	});
	return (
		<>
			<BaseEdge
				id={id}
				path={path}
				markerEnd={markerEnd}
				style={style}
				interactionWidth={20}
			/>
			{data && (
				<EdgeLabelRenderer>
					<div
						className="nodrag nopan absolute pointer-events-auto"
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							color: "var(--foreground)",
						}}
					>
						<EditableRelationshipLabel data={data} />
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}

function AddComponentButton({
	onAdd,
}: {
	onAdd: (position: { x: number; y: number }) => void;
}) {
	const { screenToFlowPosition } = useReactFlow();
	const width = useStore((state) => state.width);
	const height = useStore((state) => state.height);
	return (
		<Panel position="top-left">
			<button
				type="button"
				className="nodrag nopan flex items-center gap-1 rounded-lg border border-divider bg-surface px-2 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-surface-secondary"
				onClick={() =>
					onAdd(screenToFlowPosition({ x: width / 2, y: height / 2 }))
				}
			>
				<Plus size={15} aria-hidden />
				Add component
			</button>
		</Panel>
	);
}

const nodeTypes = { component: ComponentNode };
const edgeTypes = { relationship: RelationshipEdge };

function layoutDiagram(nodes: SoftwareDiagramNode[], edges: SoftwareDiagramEdge[]) {
	const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	graph.setGraph({
		rankdir: "LR",
		nodesep: 96,
		ranksep: 200,
		marginx: 48,
		marginy: 48,
	});
	for (const node of nodes)
		graph.setNode(node.id, {
			width: node.width ?? nodeWidth,
			height: node.height ?? nodeHeight,
		});
	for (const edge of edges) graph.setEdge(edge.source, edge.target);
	dagre.layout(graph);

	const flowNodes: FlowNode[] = nodes.map((node) => {
		const position = graph.node(node.id);
		const width = node.width ?? nodeWidth;
		const height = node.height ?? nodeHeight;
		return {
			id: node.id,
			type: "component",
			position: node.position ?? {
				x: position.x - width / 2,
				y: position.y - height / 2,
			},
			data: { ...node, isEditing: false },
			width,
			height,
		};
	});
	const flowEdges: FlowEdge[] = edges.map((edge, index) => ({
		id: `${edge.source}-${edge.target}-${index}`,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle ?? Position.Right,
		targetHandle: edge.targetHandle ?? Position.Left,
		type: "relationship",
		data: {
			index,
			label: edge.label ?? "",
			url: edge.url ?? "",
			isEditing: false,
			editing: false,
		},
		markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
		style: { stroke: "var(--border)", strokeWidth: 1.5 },
	}));
	const top = Math.min(0, ...flowNodes.map((item) => item.position.y));
	const bottom = Math.max(
		0,
		...flowNodes.map((item) => item.position.y + (item.height ?? nodeHeight)),
	);
	return { nodes: flowNodes, edges: flowEdges, height: bottom - top };
}

export function SoftwareDiagram({ node, context }: TemplateProps) {
	const { title, description, nodes, edges } = node.data as {
		title: string;
		description: string;
		nodes: SoftwareDiagramNode[];
		edges: SoftwareDiagramEdge[];
	};
	const diagram = useMemo(() => layoutDiagram(nodes, edges), [nodes, edges]);
	const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(diagram.nodes);
	const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(diagram.edges);
	const [editingNode, setEditingNode] = useState<{
		id: string;
		field: NodeField;
	}>();
	const [editingEdge, setEditingEdge] = useState<string>();
	useEffect(() => setFlowNodes(diagram.nodes), [diagram.nodes, setFlowNodes]);
	useEffect(() => setFlowEdges(diagram.edges), [diagram.edges, setFlowEdges]);
	useEffect(() => {
		if (!context.isEditing) {
			setEditingNode(undefined);
			setEditingEdge(undefined);
		}
	}, [context.isEditing]);

	const nodeById = new Map(nodes.map((item) => [item.id, item]));
	const update = (key: "nodes" | "edges", value: unknown) =>
		context.onEdit?.(node.id, [key], value);
	const updateNodes = (next: SoftwareDiagramNode[]) => update("nodes", next);
	const updateEdges = (next: SoftwareDiagramEdge[]) => update("edges", next);

	function removeNode(id: string) {
		updateNodes(nodes.filter((item) => item.id !== id));
		updateEdges(edges.filter((edge) => edge.source !== id && edge.target !== id));
		setEditingNode(undefined);
	}

	function connect(connection: Connection) {
		if (
			!connection.source ||
			!connection.target ||
			connection.source === connection.target ||
			edges.some(
				(edge) =>
					edge.source === connection.source &&
					edge.target === connection.target,
			)
		)
			return;
		const next = [
			...edges,
			{
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
				label: "",
				url: null,
			},
		];
		setFlowEdges((current) => [
			...current,
			{
				id: `${connection.source}-${connection.target}-${edges.length}`,
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle,
				type: "relationship",
				data: {
					index: edges.length,
					label: "",
					url: "",
					isEditing: context.isEditing,
					editing: false,
				},
				markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
				style: { stroke: "var(--border)", strokeWidth: 1.5 },
			},
		]);
		updateEdges(next);
	}

	function reconnect(oldEdge: FlowEdge, connection: Connection) {
		const index = flowEdges.findIndex((edge) => edge.id === oldEdge.id);
		if (
			index < 0 ||
			!connection.source ||
			!connection.target ||
			connection.source === connection.target ||
			edges.some(
				(edge, edgeIndex) =>
					edgeIndex !== index &&
					edge.source === connection.source &&
					edge.target === connection.target,
			)
		)
			return;
		const next = edges.map((edge, edgeIndex) =>
			edgeIndex === index
				? {
						...edge,
						source: connection.source!,
						target: connection.target!,
						sourceHandle: connection.sourceHandle ?? edge.sourceHandle,
						targetHandle: connection.targetHandle ?? edge.targetHandle,
					}
				: edge,
		);
		setFlowEdges((current) => reconnectEdge(oldEdge, connection, current));
		updateEdges(next);
	}

	function addComponent(position: { x: number; y: number }) {
		const id = crypto.randomUUID();
		updateNodes([
			...nodes,
			{
				id,
				label: "New component",
				kind: "service",
				detail: "Describe this component",
				position: {
					x: position.x - nodeWidth / 2,
					y: position.y - nodeHeight / 2,
				},
			},
		]);
		setEditingNode({ id, field: "label" });
		setEditingEdge(undefined);
	}

	const renderedNodes = flowNodes.map((flowNode) => {
		const current = nodeById.get(flowNode.id) ?? flowNode.data;
		return {
			...flowNode,
			data: {
				...current,
				isEditing: context.isEditing,
				editingField:
					editingNode?.id === flowNode.id ? editingNode.field : undefined,
				onStartEdit: (field: NodeField) => {
					setEditingNode({ id: flowNode.id, field });
					setEditingEdge(undefined);
				},
				onCommit: (field: NodeField, value: string) =>
					updateNodes(
						nodes.map((item) =>
							item.id === flowNode.id ? { ...item, [field]: value } : item,
						),
					),
				onKindChange: (kind: NonNullable<SoftwareDiagramNode["kind"]>) =>
					updateNodes(
						nodes.map((item) =>
							item.id === flowNode.id ? { ...item, kind } : item,
						),
					),
				onUrlCommit: (url: string | null) =>
					updateNodes(
						nodes.map((item) =>
							item.id === flowNode.id ? { ...item, url } : item,
						),
					),
			onStopEdit: () => setEditingNode(undefined),
			onRemove: () => removeNode(flowNode.id),
			onResizeEnd: (
				position: { x: number; y: number },
				width: number,
				height: number,
			) =>
				updateNodes(
					nodes.map((item) =>
						item.id === flowNode.id
							? { ...item, position, width, height }
							: item,
					),
				),
		},
		};
	});
	const renderedEdges = flowEdges.map((flowEdge, index) => {
		const current = edges[index];
		return {
			...flowEdge,
			type: "relationship" as const,
			data: {
				index,
				label: current?.label ?? "",
				url: current?.url ?? "",
				isEditing: context.isEditing,
				editing: editingEdge === flowEdge.id,
				onStartEdit: () => {
					setEditingEdge(flowEdge.id);
					setEditingNode(undefined);
				},
				onCommit: (value: string) =>
					updateEdges(
						edges.map((edge, edgeIndex) =>
							edgeIndex === index ? { ...edge, label: value } : edge,
						),
					),
				onUrlCommit: (url: string | null) =>
					updateEdges(
						edges.map((edge, edgeIndex) =>
							edgeIndex === index ? { ...edge, url } : edge,
						),
					),
				onStopEdit: () => setEditingEdge(undefined),
				onRemove: () =>
					updateEdges(edges.filter((_, edgeIndex) => edgeIndex !== index)),
			},
		};
	});

	return (
		<BlockSection
			title={title}
			description={description}
			edit={{ node, context }}
		>
			<div
				role="group"
				className="software-diagram-canvas min-h-[480px] overflow-hidden rounded-2xl border border-divider bg-background"
				style={{ height: Math.max(480, diagram.height + 80) }}
				aria-label={`${title} component diagram`}
			>
				<ReactFlow
					nodes={renderedNodes}
					edges={renderedEdges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					fitViewOptions={{ padding: 0.24, maxZoom: 1 }}
					minZoom={0.75}
					nodesDraggable={context.isEditing}
					nodesConnectable={context.isEditing}
					edgesReconnectable={context.isEditing}
					elementsSelectable={context.isEditing}
					connectionMode={ConnectionMode.Loose}
					deleteKeyCode={null}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={connect}
					onReconnect={reconnect}
					onNodeDragStop={(_, movedNode) =>
						updateNodes(
							nodes.map((item) =>
								item.id === movedNode.id
									? { ...item, position: movedNode.position }
									: item,
							),
						)
					}
					onPaneClick={() => {
						setEditingNode(undefined);
						setEditingEdge(undefined);
					}}
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
					{context.isEditing && <AddComponentButton onAdd={addComponent} />}
				</ReactFlow>
			</div>
			<DiagramDetails nodes={nodes} edges={edges} />
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
