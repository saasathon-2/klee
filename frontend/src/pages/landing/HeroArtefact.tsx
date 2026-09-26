import { Card, Paragraph, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { ArtefactDocument, ArtefactNode } from "../../artefacts/model";
import { ArtefactRenderer } from "../../artefacts/templates/renderer";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../lib/auth-client";
import { LandingCodeDiffStory } from "./LandingCodeDiffStory";
import { LandingGitGraphStory } from "./LandingGitGraphStory";
import { landingSamples } from "./samples";

const blocksOf = (document: ArtefactDocument) =>
	document.root.children?.[0]?.children ?? [];
const [codeDiff] = blocksOf(landingSamples.review);

const prompt =
	"Show the team what Klee does with our PRs, this sprint, branch history and the board";

const block = (id: string, template: ArtefactNode["template"], data: Record<string, unknown>): ArtefactNode => ({
	id,
	template,
	data,
});

/** A tour of Klee, built from the same blocks real artefacts use. */
const demo: ArtefactDocument = {
	version: 1,
	root: {
		id: "root",
		template: "artefact-page",
		data: { title: "What Klee does" },
		children: [
			{
				id: "category",
				template: "developer-page",
				data: {
					eyebrow: "",
					icon: "lightbulb",
					title: "What Klee does",
					summary:
						"You give Klee a pull request, a sprint or a PDF. It builds a page like this one that you can share with a link.",
					tags: ["GitHub", "Jira", "Slack", "PDFs"],
				},
				children: [
					block("tour-metrics", "metric-row", {
						items: [
							{ label: "Blocks", value: "40+", detail: "Code diffs, timelines, charts and pinouts" },
							{ label: "Sources", value: "GitHub, Jira, Slack", detail: "You can also paste text or attach PDFs" },
							{ label: "Sharing", value: "Links", detail: "Pages stay private until you share them" },
						],
					}),
					{
						...codeDiff,
						data: {
							...codeDiff.data,
							title: "Pull request reviews",
							description:
								"With the GitHub Action installed, Klee comments on each pull request with a page like this. It shows what changed, what reviewers said and whether the checks passed.",
						},
					},
					block("tour-flow", "flowchart", {
						title: "How a pull request ships",
						description: "Processes with branches become flowcharts.",
						steps: [
							{ id: "open", label: "PR opened", kind: "start", detail: null, url: null },
							{ id: "checks", label: "Checks pass?", kind: "decision", detail: null, url: null },
							{ id: "fix", label: "Fix and push", kind: "step", detail: "Klee refreshes the page", url: null },
							{ id: "review", label: "Approved?", kind: "decision", detail: null, url: null },
							{ id: "changes", label: "Address feedback", kind: "step", detail: "Comments stay on the page", url: null },
							{ id: "merge", label: "Merged to main", kind: "end", detail: null, url: null },
						],
						edges: [
							{ source: "open", target: "checks", label: null },
							{ source: "checks", target: "fix", label: "No" },
							{ source: "fix", target: "checks", label: null },
							{ source: "checks", target: "review", label: "Yes" },
							{ source: "review", target: "changes", label: "No" },
							{ source: "changes", target: "review", label: null },
							{ source: "review", target: "merge", label: "Yes" },
						],
					}),
					block("tour-sprint", "sprint-timeline", {
						title: "Sprint progress",
						start: "2026-09-21",
						end: "2026-10-02",
						today: "2026-09-26",
						milestones: [
							{ label: "Code freeze", date: "2026-09-30" },
							{ label: "Demo", date: "2026-10-02" },
						],
						items: [
							{ id: "1", title: "Session key rotation", status: "done", start: "2026-09-21", end: "2026-09-23", estimate: "3 pts", url: null },
							{ id: "2", title: "Gateway auth middleware", status: "active", start: "2026-09-23", end: "2026-09-29", estimate: "5 pts", url: null },
							{ id: "3", title: "Profile badge colour", status: "blocked", start: "2026-09-25", end: "2026-09-27", estimate: "1 pt", url: null },
							{ id: "4", title: "Rename registered state", status: "planned", start: "2026-09-29", end: "2026-10-01", estimate: "2 pts", url: null },
						],
					}),
					block("tour-graph", "git-graph", {
						title: "Branch history",
						description: "Keep scrolling to step through each commit.",
						branches: [
							{ id: "main", name: "main", url: null },
							{ id: "auth", name: "feat/auth-api", url: null },
							{ id: "badge", name: "fix/badge", url: null },
						],
						commits: [
							{ sha: "f00dbabe11", message: "Merge fix/badge", author: "priya_k", date: "2026-09-26T10:00:00Z", parents: ["e11c0de1", "c0ffee22"], branchIds: ["main"], url: null },
							{ sha: "e11c0de1", message: "Merge feat/auth-api", author: "jane_doe", date: "2026-09-25T16:00:00Z", parents: ["a1b2c3d4", "d3a4b5c6"], branchIds: ["main"], url: null },
							{ sha: "c0ffee22", message: "Fix profile badge colour", author: "priya_k", date: "2026-09-25T12:00:00Z", parents: ["a1b2c3d4"], branchIds: ["badge"], url: null },
							{ sha: "d3a4b5c6", message: "Add session rotation on login", author: "jane_doe", date: "2026-09-24T12:00:00Z", parents: ["b5e6f7a8"], branchIds: ["auth"], url: null },
							{ sha: "b5e6f7a8", message: "Store session keys in the key store", author: "jane_doe", date: "2026-09-23T12:00:00Z", parents: ["a1b2c3d4"], branchIds: ["auth"], url: null },
							{ sha: "a1b2c3d4", message: "Release 1.8.0", author: "tom_w", date: "2026-09-22T09:00:00Z", parents: [], branchIds: ["main"], url: null },
						],
					}),
					block("tour-glue", "glue", { label: "It keeps track of the tickets too" }),
					block("tour-board", "work-item-board", {
						title: "Team board",
						description: "Klee groups tickets from Jira or Linear by where they're up to.",
						columns: [
							{
								id: "planned",
								label: "To do",
								total: 6,
								items: [
									{ key: "KL-51", title: "Rename registered state to verified", owner: "Sam Lee", priority: "medium", meta: "2 pts", url: null },
									{ key: "KL-58", title: "Load test the key store", owner: null, priority: "low", meta: "6 pts", url: null },
								],
							},
							{
								id: "active",
								label: "In progress",
								total: null,
								items: [
									{ key: "KL-44", title: "Gateway auth middleware", owner: "Jane Doe", priority: "high", meta: "5 pts", url: null },
								],
							},
							{
								id: "blocked",
								label: "Blocked",
								total: null,
								items: [
									{ key: "KL-49", title: "Profile badge shows the old colour", owner: "Priya K", priority: "urgent", meta: "Waiting on design", url: null },
								],
							},
							{
								id: "done",
								label: "Done",
								total: 4,
								items: [
									{ key: "KL-40", title: "Session key rotation", owner: "Jane Doe", priority: null, meta: "3 pts", url: null },
									{ key: "KL-37", title: "Audit log for session events", owner: "Tom W", priority: null, meta: "3 pts", url: null },
								],
							},
						],
					}),
					block("tour-readiness", "delivery-readiness", {
						title: "Can it merge?",
						subject: "PR #482 → main",
						summary: "Tests and approvals have passed, but the preview deploy hasn't finished, so this one is waiting.",
						gates: [
							{ name: "Unit tests", status: "passed", detail: "412 tests in 1m 48s", url: null },
							{ name: "Approvals", status: "passed", detail: "3 of 2 required", url: null },
							{ name: "Preview deploy", status: "pending", detail: "Queued behind 2 builds", url: null },
						],
						signals: [
							{ label: "Security scan clean", detail: "No new vulnerabilities", tone: "positive" },
						],
						blockers: [],
					}),
					block("tour-next", "next-steps", {
						title: "Try it yourself",
						actions: [
							{ label: "Start for free", description: "Sign up and paste your first prompt", action: "sign-up" },
							{ label: "Set up GitHub", description: "Add the Action to a repository", action: "github" },
							{ label: "Browse templates", description: "See the blocks Klee can use", action: "templates" },
						],
					}),
				],
			},
		],
	},
};

/** The commits the branch history story stops on, top to bottom: a merge, a fix, a feature. */
const graphShas = ["f00dbabe11", "c0ffee22", "b5e6f7a8"];

const typingDelay = 50;

/**
 * Types the prompt once, then reveals each artefact block the first time it
 * scrolls into view.
 */
export function HeroArtefact() {
	const [typed, setTyped] = useState(0);
	const navigate = useNavigate();
	const { data: session } = useSession();
	// Where each "Try it yourself" action goes, by its label.
	const actionPaths: Record<string, string> = {
		"Start for free": session?.user ? "/" : "?auth=signup",
		"Set up GitHub": "/developer-integrations",
		"Browse templates": "/developer-templates",
	};
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typed >= prompt.length) return;
		const timer = window.setTimeout(() => setTyped(typed + 1), typingDelay);
		return () => window.clearTimeout(timer);
	}, [typed]);

	useEffect(() => {
		const blocks = container.current?.querySelectorAll<HTMLElement>(
			'[data-slot="artefact-blocks"] > *',
		);
		if (!blocks?.length) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					(entry.target as HTMLElement).dataset.revealed = "true";
					observer.unobserve(entry.target);
				}
			},
			{ rootMargin: "0px 0px -15% 0px", threshold: 0.15 },
		);
		blocks.forEach((block) => observer.observe(block));
		return () => observer.disconnect();
	}, []);

	return (
		<Card className="w-full gap-0 overflow-x-visible overflow-y-clip p-0">
			<Surface className="flex items-center gap-3 border-b border-border px-5 py-4">
				<Paragraph size="sm" truncate className="min-w-0 flex-1">
					{prompt.slice(0, typed)}
					{typed < prompt.length && (
						<span className="animate-pulse text-muted">|</span>
					)}
				</Paragraph>
			</Surface>
			<div
				ref={container}
				// Extra air between blocks, for the landing page only.
				className="hero-demo pb-12 [&_[data-slot=artefact-blocks]>*+*]:mt-10 sm:[&_[data-slot=artefact-blocks]>*+*]:mt-16"
			>
				<ArtefactRenderer
					document={demo}
					createdAt="2026-09-26T00:00:00.000Z"
					canInteract
					onAction={(label) => {
						const path = actionPaths[label];
						if (path) navigate(path);
					}}
					edgeToEdge
					showFooter={false}
					renderNode={(node, rendered) =>
						// The demo copies the diff to retitle it, so match by id, not identity.
						node.id === codeDiff.id ? (
							<LandingCodeDiffStory>{rendered}</LandingCodeDiffStory>
						) : node.id === "tour-graph" ? (
							<LandingGitGraphStory shas={graphShas}>{rendered}</LandingGitGraphStory>
						) : rendered
					}
				/>
			</div>
		</Card>
	);
}
