import { Chip } from "@heroui/react";
import { Handle, Position } from "@xyflow/react";
import type { Node as XYFlowNode, NodeProps } from "@xyflow/react";
import { AppWindow, Database, Globe, Layers, Server, Workflow } from "lucide-react";
import type { ChangeState, ImpactNode, SoftwareDiagramEdge } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { DiagramCanvas } from "../page/DiagramCanvas";
import { SourceLink } from "../page/SourceLink";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeSize = { width: 256, height: 148 };

const changeStates = {
	added: { label: "Added", color: "success", edge: "var(--success)" },
	modified: { label: "Modified", color: "accent", edge: "var(--accent-text)" },
	"at-risk": { label: "At risk", color: "danger", edge: "var(--danger)" },
	unchanged: { label: "Unchanged", color: "default", edge: "var(--border)" },
} as const satisfies Record<
	ChangeState,
	{ label: string; color: "success" | "accent" | "danger" | "default"; edge: string }
>;

const changeState = (state: string) =>
	changeStates[state as ChangeState] ?? changeStates.unchanged;
const componentKinds = {
	client: { label: "Client", icon: AppWindow },
	service: { label: "Service", icon: Server },
	database: { label: "Database", icon: Database },
	cache: { label: "Cache", icon: Layers },
	queue: { label: "Queue", icon: Workflow },
	external: { label: "External", icon: Globe },
	component: { label: "Component", icon: Layers },
} as const;

function ImpactNodeCard({ data }: NodeProps<XYFlowNode<ImpactNode, "impact">>) {
	const state = changeState(data.change);
	const kind = componentKinds[data.kind ?? "component"];
	const Icon = kind.icon;
	return (
		<div
			role="group"
			aria-label={`${data.label}, ${state.label}: ${data.detail}`}
			className={`software-diagram-node relative flex h-[148px] w-64 flex-col rounded-xl border border-divider border-l-4 bg-surface p-4 text-surface-foreground shadow-sm ${data.change === "unchanged" ? "opacity-70" : ""}`}
			style={{ borderLeftColor: state.edge }}
		>
			<Handle type="target" position={Position.Left} className="!border-0 !bg-transparent" />
			<SourceLink href={data.url} className="-m-4 flex min-h-0 flex-1 flex-col rounded-xl p-4">
				<div className="flex items-start justify-between gap-2 pr-4">
					<div className="flex min-w-0 flex-col">
						<span className="flex items-center gap-1.5 text-xs font-medium text-muted">
							<Icon size={13} aria-hidden />
							{kind.label}
						</span>
						<span className="line-clamp-1 text-base font-semibold leading-6">{data.label}</span>
					</div>
					<Chip size="sm" color={state.color} className="shrink-0">
						{state.label}
					</Chip>
				</div>
				<div className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{data.detail}</div>
				{data.owner && (
					<div className="mt-auto truncate text-xs text-muted">Owner · {data.owner}</div>
				)}
			</SourceLink>
			<Handle type="source" position={Position.Right} className="!border-0 !bg-transparent" />
		</div>
	);
}

const nodeTypes = { impact: ImpactNodeCard };

export function ChangeImpactMap({ node, context }: TemplateProps) {
	const { title, description, nodes, edges } = node.data as {
		title: string;
		description: string;
		nodes: ImpactNode[];
		edges: SoftwareDiagramEdge[];
	};
	const counts = (Object.keys(changeStates) as ChangeState[])
		.map((state) => ({ state, count: nodes.filter((item) => item.change === state).length }))
		.filter(({ count }) => count > 0);
	const atRisk = nodes.filter((item) => item.change === "at-risk");
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<ul className="mb-3 flex flex-wrap gap-2" aria-label="Change summary">
				{counts.map(({ state, count }) => (
					<li key={state}>
						<Chip size="sm" color={changeStates[state].color}>
							{count} {changeStates[state].label.toLowerCase()}
						</Chip>
					</li>
				))}
			</ul>
			{atRisk.length > 0 && (
				<p className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-foreground">
					Watch: {atRisk.map((item) => item.label).join(", ")}.
				</p>
			)}
			<DiagramCanvas
				title={title}
				nodes={nodes}
				edges={edges}
				type="impact"
				nodeTypes={nodeTypes}
				nodeSize={nodeSize}
			/>
		</BlockSection>
	);
}

ChangeImpactMap.template = "change-impact-map" as const;
ChangeImpactMap.info =
	"Dependency diagram in the software-diagram style whose nodes carry change state (added, modified, at-risk, unchanged), owner, and link, with edges pointing from dependant to dependency. Pick it for a PR, incident, migration, or release when supplied evidence establishes which services, packages, APIs, data stores, or teams are affected; never infer relationships from filenames.";
ChangeImpactMap.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
