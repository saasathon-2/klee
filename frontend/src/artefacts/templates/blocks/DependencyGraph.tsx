import { Chip } from "@heroui/react";
import { Handle, Position } from "@xyflow/react";
import type { Node as XYFlowNode, NodeProps } from "@xyflow/react";
import { Boxes, Database, Globe, Package, Server } from "lucide-react";
import type { DependencyNode, DependencyHealth, SoftwareDiagramEdge } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { DiagramCanvas } from "../page/DiagramCanvas";
import { SourceLink } from "../page/SourceLink";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const nodeSize = { width: 232, height: 104 };

const kinds = {
	package: Package,
	module: Boxes,
	service: Server,
	database: Database,
	external: Globe,
} as const satisfies Record<DependencyNode["kind"], typeof Package>;

const healthStates = {
	current: { label: "Current", color: "success" },
	outdated: { label: "Outdated", color: "warning" },
	vulnerable: { label: "Vulnerable", color: "danger" },
} as const satisfies Record<
	DependencyHealth,
	{ label: string; color: "success" | "warning" | "danger" }
>;

const handleClass = "!border-0 !bg-transparent";

function DependencyNodeCard({ data }: NodeProps<XYFlowNode<DependencyNode, "dependency">>) {
	const Icon = kinds[data.kind] ?? Package;
	const health = data.health ? healthStates[data.health] : undefined;
	return (
		<div
			role="group"
			aria-label={`${data.label}${data.version ? ` ${data.version}` : ""}: ${data.detail}`}
			className="software-diagram-node relative h-[104px] w-[232px] rounded-xl border border-divider bg-surface text-surface-foreground shadow-sm"
		>
			<Handle type="target" position={Position.Left} className={handleClass} />
			<SourceLink href={data.url} className="flex size-full flex-col rounded-xl p-3">
				<span className="flex items-center gap-2 pr-4">
					<Icon aria-hidden size={15} className="shrink-0 text-muted" />
					<span className="truncate text-sm font-semibold">{data.label}</span>
				</span>
				<span className="mt-1 line-clamp-2 text-xs leading-4 text-muted">{data.detail}</span>
				<span className="mt-auto flex items-center gap-1.5">
					{data.version && (
						<code className="truncate rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[11px]">
							{data.version}
						</code>
					)}
					{health && (
						<Chip size="sm" color={health.color} className="ml-auto">
							{health.label}
						</Chip>
					)}
				</span>
			</SourceLink>
			<Handle type="source" position={Position.Right} className={handleClass} />
		</div>
	);
}

const nodeTypes = { dependency: DependencyNodeCard };

export function DependencyGraph({ node, context }: TemplateProps) {
	const { title, description, nodes, edges } = node.data as {
		title: string;
		description: string;
		nodes: DependencyNode[];
		edges: SoftwareDiagramEdge[];
	};
	const flagged = nodes.filter((item) => item.health && item.health !== "current");
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			{flagged.length > 0 && (
				<ul className="mb-3 flex flex-wrap gap-2" aria-label="Dependencies needing attention">
					{flagged.map((item) => (
						<li key={item.id}>
							<Chip size="sm" color={healthStates[item.health!].color}>
								{item.label} · {healthStates[item.health!].label.toLowerCase()}
							</Chip>
						</li>
					))}
				</ul>
			)}
			<DiagramCanvas
				title={title}
				nodes={nodes}
				edges={edges}
				type="dependency"
				nodeTypes={nodeTypes}
				nodeSize={nodeSize}
				minHeight={360}
			/>
		</BlockSection>
	);
}

DependencyGraph.template = "dependency-graph" as const;
DependencyGraph.info =
	"Directed graph of packages, modules, services, databases, or external APIs, with edges from dependant to dependency, optional versions, and health (current, outdated, vulnerable). Pick it for package upgrades, lockfile or manifest changes, dependency audits, or build order questions.";
DependencyGraph.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
