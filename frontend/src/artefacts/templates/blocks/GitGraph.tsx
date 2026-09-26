import { Card, Chip, Code } from "@heroui/react";
import { GitBranch, GitMerge } from "lucide-react";
import { useContext, useState } from "react";
import type { GraphBranch, GraphCommit } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { SelectedCommitContext } from "../page/commitSelection";
import { ExternalLink } from "../page/ExternalLink";
import { formatDateTime } from "../page/dates";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const rowHeight = 52;
const laneWidth = 20;
const padding = 14;
/** Branches past the four chart colours share the muted ink rather than cycling. */
const laneColour = (lane: number) =>
	lane < 4 ? `var(--chart-${lane + 1})` : "var(--muted)";

export function GitGraph({ node, context }: TemplateProps) {
	const { title, description, branches, commits } = node.data as {
		title: string;
		description: string;
		branches: GraphBranch[];
		commits: GraphCommit[];
	};
	const text = editableFor(node, context);
	const [selectedSha, setSelectedSha] = useState(commits[0]?.sha);
	// A surrounding story can pick the commit instead of the reader.
	const storySha = useContext(SelectedCommitContext);
	const selected = commits.find((commit) => commit.sha === (storySha ?? selectedSha)) ?? commits[0];

	const laneOf = new Map(branches.map((branch, index) => [branch.id, index]));
	const row = new Map(commits.map((commit, index) => [commit.sha, index]));
	const lane = (commit: GraphCommit) => laneOf.get(commit.branchIds[0]) ?? 0;
	const x = (value: number) => padding + value * laneWidth;
	const y = (value: number) => value * rowHeight + rowHeight / 2;
	const width = x(Math.max(0, branches.length - 1)) + padding;
	const heads = new Map<string, GraphBranch[]>();
	for (const branch of branches) {
		const head = commits.find((commit) => commit.branchIds.includes(branch.id));
		if (head) heads.set(head.sha, [...(heads.get(head.sha) ?? []), branch]);
	}
	const branchName = new Map(branches.map((branch) => [branch.id, branch.name]));

	const edges = commits.flatMap((commit, index) =>
		commit.parents.map((sha, parentIndex) => {
			const from = { x: x(lane(commit)), y: y(index) };
			const parentRow = row.get(sha);
			if (parentRow === undefined)
				// The parent is outside this slice of history: trail off below.
				return { key: `${commit.sha}-${sha}`, colour: laneColour(lane(commit)), faded: true, d: `M${from.x} ${from.y} V${from.y + rowHeight / 2}` };
			const parent = commits[parentRow];
			const to = { x: x(lane(parent)), y: y(parentRow) };
			const bend = rowHeight / 2;
			// A first parent continues the child's lane and joins at the bottom;
			// a merged parent leaves the merge commit at the top.
			const d =
				from.x === to.x
					? `M${from.x} ${from.y} V${to.y}`
					: parentIndex === 0
						? `M${from.x} ${from.y} V${to.y - rowHeight} C${from.x} ${to.y - bend} ${to.x} ${to.y - bend} ${to.x} ${to.y}`
						: `M${from.x} ${from.y} C${from.x} ${from.y + bend} ${to.x} ${from.y + bend} ${to.x} ${from.y + rowHeight} V${to.y}`;
			return {
				key: `${commit.sha}-${sha}`,
				colour: laneColour(parentIndex === 0 ? lane(commit) : lane(parent)),
				faded: false,
				d,
			};
		}),
	);

	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1" aria-label="Branches">
				{branches.map((branch, index) => (
					<li key={branch.id} className="flex items-center gap-2 text-xs">
						<span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: laneColour(index) }} />
						<span className="font-mono">
							<ExternalLink href={branch.url}>{branch.name}</ExternalLink>
						</span>
					</li>
				))}
			</ul>
			<Card className="gap-0 overflow-hidden p-0">
				<div className="grid grid-cols-[auto_minmax(0,1fr)]">
					<svg
						aria-hidden
						width={width}
						height={commits.length * rowHeight}
						className="block"
					>
						{selected && (
							<rect y={commits.indexOf(selected) * rowHeight} width={width} height={rowHeight} fill="var(--surface-secondary)" />
						)}
						{edges.map((edge) => (
							<path
								key={edge.key}
								d={edge.d}
								fill="none"
								stroke={edge.colour}
								strokeWidth={2}
								strokeLinecap="round"
								opacity={edge.faded ? 0.35 : 1}
							/>
						))}
						{commits.map((commit, index) => (
							<g key={commit.sha}>
								{commit.sha === selected?.sha && (
									<circle cx={x(lane(commit))} cy={y(index)} r={9} fill="none" stroke={laneColour(lane(commit))} strokeWidth={2} />
								)}
								<circle
									cx={x(lane(commit))}
									cy={y(index)}
									r={5}
									fill={laneColour(lane(commit))}
									stroke="var(--surface)"
									strokeWidth={2}
								/>
							</g>
						))}
					</svg>
					<ul aria-label="Commits">
						{commits.map((commit) => {
							const isSelected = commit.sha === selected?.sha;
							return (
								<li key={commit.sha} style={{ height: rowHeight }}>
									<button
										type="button"
										aria-pressed={isSelected}
										onClick={() => setSelectedSha(commit.sha)}
										className={`flex h-full w-full min-w-0 items-center gap-3 pr-4 pl-2 text-left outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset ${isSelected ? "bg-surface-secondary" : ""}`}
									>
										<span className="min-w-0 flex-1">
											<span className="flex min-w-0 items-center gap-2">
												{commit.parents.length > 1 && (
													<GitMerge aria-label="Merge commit" size={14} className="shrink-0 text-muted" />
												)}
												<span className="truncate text-sm font-medium">
													{commit.message.split("\n")[0]}
												</span>
												{heads.get(commit.sha)?.map((branch) => (
													<Chip key={branch.id} size="sm" variant="secondary" className="hidden shrink-0 font-mono sm:inline-flex">
														<GitBranch size={12} />
														{branch.name}
													</Chip>
												))}
											</span>
											<span className="block truncate text-xs text-muted">
												{commit.author} · {formatDateTime(commit.date)}
											</span>
										</span>
										<Code className="hidden shrink-0 text-xs sm:inline">
											{commit.sha.slice(0, 7)}
										</Code>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			</Card>
			{selected && (
				<Card variant="secondary" className="mt-3" aria-live="polite">
					<Card.Header>
						<div className="flex flex-wrap items-center gap-2">
							<Code className="text-xs">
								<ExternalLink href={selected.url}>{selected.sha.slice(0, 12)}</ExternalLink>
							</Code>
							{selected.branchIds.map((id) => (
								<Chip key={id} size="sm" className="font-mono">
									{branchName.get(id) ?? id}
								</Chip>
							))}
						</div>
						<Card.Title className="mt-2">
							{text(
								["commits", commits.indexOf(selected), "message"],
								selected.message,
								"Commit message",
								true,
							)}
						</Card.Title>
						<Card.Description>
							{selected.author} · {formatDateTime(selected.date)}
							{selected.parents.length > 1 &&
								` · merges ${selected.parents.map((sha) => sha.slice(0, 7)).join(" and ")}`}
						</Card.Description>
					</Card.Header>
				</Card>
			)}
		</BlockSection>
	);
}

GitGraph.template = "git-graph" as const;
GitGraph.info =
	"Compact lane graph of commits across branches, with merge points and branch labels; each commit is selectable for details. Pick it when branch ancestry, merges, release branches, or relationships between commits matter; use commit-list for a plain chronological list.";
GitGraph.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
