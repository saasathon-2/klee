import { Disclosure } from "@heroui/react";
import type { TreeNode } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

function Label({ node, count }: { node: TreeNode; count?: number }) {
	return (
		<span className="min-w-0 flex-1 text-left">
			<span className="font-medium">{node.label}</span>
			{count !== undefined && <span className="ml-2 text-xs text-muted tabular-nums">{count}</span>}
			{node.detail && <span className="block text-sm text-muted">{node.detail}</span>}
		</span>
	);
}

function Branch({
	node,
	childrenOf,
	depth,
}: {
	node: TreeNode;
	childrenOf: Map<string | null, TreeNode[]>;
	depth: number;
}) {
	const children = childrenOf.get(node.id) ?? [];
	if (!children.length)
		return (
			<li className="flex gap-2 py-1.5 pl-7">
				<Label node={node} />
			</li>
		);
	return (
		<li>
			<Disclosure defaultExpanded={depth < 2}>
				<Disclosure.Heading>
					<Disclosure.Trigger className="flex w-full items-start gap-2 rounded-md px-1 py-1.5 hover:bg-default">
						<Disclosure.Indicator className="mt-0.5" />
						<Label node={node} count={children.length} />
					</Disclosure.Trigger>
				</Disclosure.Heading>
				<Disclosure.Content>
					<Disclosure.Body className="p-0">
						<ul className="ml-3 border-l border-border pl-3">
							{children.map((child) => (
								<Branch key={child.id} node={child} childrenOf={childrenOf} depth={depth + 1} />
							))}
						</ul>
					</Disclosure.Body>
				</Disclosure.Content>
			</Disclosure>
		</li>
	);
}

export function HierarchyTree({ node, context }: TemplateProps) {
	const data = node.data as { title: string; description: string; nodes: TreeNode[] };
	const childrenOf = new Map<string | null, TreeNode[]>();
	for (const item of data.nodes)
		childrenOf.set(item.parentId, [...(childrenOf.get(item.parentId) ?? []), item]);
	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<ul aria-label={data.title} className="rounded-md border border-border bg-surface p-3">
				{(childrenOf.get(null) ?? []).map((root) => (
					<Branch key={root.id} node={root} childrenOf={childrenOf} depth={0} />
				))}
			</ul>
		</BlockSection>
	);
}

HierarchyTree.template = "hierarchy-tree" as const;
HierarchyTree.info =
	"Collapsible outline of a hierarchy, such as system to sub-system to hazard, an org chart, or a work breakdown.";
HierarchyTree.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
