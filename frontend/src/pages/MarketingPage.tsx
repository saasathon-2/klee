import {
	Button,
	Card,
	Chip,
	Heading,
	Paragraph,
	Separator,
} from "@heroui/react";
import {
	ArrowRight,
	ArrowUpRight,
	Blocks,
	Building2,
	Check,
	ChevronLeft,
	ChevronRight,
	CircleCheck,
	FileText,
	GitBranch,
	GitPullRequest,
	KeyRound,
	Layers3,
	LockKeyhole,
	ListTodo,
	MessageSquareText,
	Network,
	PlugZap,
	ShieldCheck,
	Sparkles,
	UsersRound,
	Workflow,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ArtefactDocument, ArtefactNode } from "../artefacts/model";
import { ArtefactRenderer } from "../artefacts/templates/renderer";
import { GitHubIcon, JiraIcon, SlackIcon } from "../components/BrandIcons";
import { Footer } from "./landing/Footer";
import { GitHubPullRequestStory } from "./landing/GitHubPullRequestStory";
import { SlackChannelStory } from "./landing/SlackChannelStory";

export type MarketingPageName =
	| "developers"
	| "developer-templates"
	| "developer-integrations"
	| "business"
	| "access-control"
	| "team-integrations"
	| "pricing";

function StartButton({ children = "Get started" }: { children?: string }) {
	const navigate = useNavigate();
	return (
		<Button size="lg" onPress={() => navigate("/?auth=signup")}>
			{children}
			<ArrowRight aria-hidden size={18} />
		</Button>
	);
}

function PageHero({
	eyebrow,
	title,
	description,
	children,
}: {
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center">
			<div>
				<Chip color="accent" size="sm" variant="soft">
					{eyebrow}
				</Chip>
				<Heading
					level={1}
					className="mt-5 max-w-3xl text-5xl tracking-tight text-balance sm:text-6xl"
				>
					{title}
				</Heading>
				<Paragraph className="mt-6 max-w-xl text-lg text-muted">
					{description}
				</Paragraph>
				<div className="mt-8 flex flex-wrap gap-3">
					<StartButton />
					<Button
						variant="secondary"
						size="lg"
						onPress={() =>
							window.scrollTo({
								top: document.body.scrollHeight,
								behavior: "smooth",
							})
						}
					>
						Explore the details
					</Button>
				</div>
			</div>
			<div className="min-w-0">{children}</div>
		</section>
	);
}

function SectionLead({
	eyebrow,
	title,
	description,
}: {
	eyebrow: string;
	title: string;
	description: string;
}) {
	return (
		<div className="mx-auto max-w-3xl px-6 text-center">
			<Paragraph
				size="sm"
				weight="medium"
				className="uppercase tracking-wider text-accent-text"
			>
				{eyebrow}
			</Paragraph>
			<Heading
				level={2}
				className="mt-3 text-3xl tracking-tight text-balance sm:text-4xl"
			>
				{title}
			</Heading>
			<Paragraph className="mx-auto mt-4 max-w-2xl text-muted">
				{description}
			</Paragraph>
		</div>
	);
}

function FeatureCard({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof Blocks;
	title: string;
	description: string;
}) {
	return (
		<Card variant="secondary" className="h-full">
			<Card.Header>
				<div className="grid size-10 place-items-center rounded-lg bg-brand text-brand-foreground">
					<Icon aria-hidden size={19} />
				</div>
				<Card.Title className="mt-5">{title}</Card.Title>
				<Card.Description>{description}</Card.Description>
			</Card.Header>
		</Card>
	);
}

function DevelopersPage() {
	return (
		<>
		<main>
			<PageHero
				eyebrow="Klee for developers"
				title="The why stays with the code."
				description="Turn pull requests, decisions, and architecture into clear artefacts that make technical work easy to understand and act on."
			>
				<Card className="overflow-hidden border border-border p-0">
					<Card.Header className="flex-row items-center gap-3 border-b border-border bg-surface-secondary px-5 py-4">
						<div className="grid size-9 place-items-center rounded-md bg-github-canvas text-github-foreground">
							<GitPullRequest aria-hidden size={18} />
						</div>
						<div>
							<Card.Title>Make every change reviewable</Card.Title>
							<Card.Description>
								From commit to shared context
							</Card.Description>
						</div>
					</Card.Header>
					<Card.Content className="gap-5 p-5">
						<div className="rounded-lg border border-border bg-surface p-4">
							<div className="flex items-center justify-between gap-3">
								<code className="font-mono text-sm">
									feat/share-context
								</code>
								<Chip color="success" size="sm" variant="soft">
									Ready to review
								</Chip>
							</div>
							<Paragraph className="mt-3 text-sm text-muted">
								A concise brief connects the code diff, review feedback,
								checks, and next decision.
							</Paragraph>
						</div>
						<div className="grid gap-3 sm:grid-cols-3">
							{[
								["5", "commits"],
								["4", "checks passed"],
								["2", "decisions"],
							].map(([value, label]) => (
								<div key={label} className="rounded-lg bg-surface-secondary p-3">
									<strong className="text-xl">{value}</strong>
									<p className="mt-1 text-xs text-muted">{label}</p>
								</div>
							))}
						</div>
					</Card.Content>
				</Card>
			</PageHero>
			<div className="border-y border-border bg-surface-secondary py-20">
				<SectionLead
					eyebrow="In the flow of work"
					title="Context arrives where your team already collaborates."
					description="Klee turns the work happening in GitHub and Slack into a shared view—without asking anyone to translate it twice."
				/>
			</div>
			<SlackChannelStory />
			<GitHubPullRequestStory />
			<section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
				<FeatureCard
					icon={GitBranch}
					title="Trace the change"
					description="Keep commits, checks, and review notes in one visual record."
				/>
				<FeatureCard
					icon={MessageSquareText}
					title="Discuss the decision"
					description="Share the context that makes a useful conversation possible."
				/>
				<FeatureCard
					icon={Network}
					title="See the system"
					description="Make architecture and dependencies legible before they surprise you."
				/>
			</section>
		</main>
		<Footer />
		</>
	);
}

const artefactExamples = [
	{
		id: "scrum-board",
		label: "Scrum board",
		description: "Sprint progress, task overview, and team velocity at a glance.",
		icon: ListTodo,
	},
	{
		id: "todo-list",
		label: "Enriched to-do list",
		description: "Turn a set of tasks into a clear, actionable work plan.",
		icon: ListTodo,
	},
	{
		id: "pull-request",
		label: "GitHub pull request",
		description: "Merge history, code changes, checks, and review feedback.",
		icon: GitPullRequest,
	},
	{
		id: "release-readiness",
		label: "Release readiness",
		description: "See the rollout stages and whether it is safe to proceed.",
		icon: CircleCheck,
	},
	{
		id: "change-impact",
		label: "Change impact map",
		description: "Trace an engineering change through affected services and owners.",
		icon: Network,
	},
	{
		id: "incident-review",
		label: "Incident review",
		description: "Connect the incident timeline, error-rate trend, and follow-up risks.",
		icon: GitBranch,
	},
] as const;

type ArtefactExample = (typeof artefactExamples)[number]["id"];

const artefactExampleBlocks: Record<ArtefactExample, ArtefactNode[]> = {
	"scrum-board": [
		{
			id: "sprint-velocity-summary",
			template: "metric-row",
			data: {
				items: [
					{
						label: "4-sprint average",
						value: "30.25 pts",
						detail: "Historical team velocity",
					},
					{ label: "Sprint scope", value: "40 pts", detail: "After scope changes" },
					{
						label: "Over average",
						value: "9.75 pts",
						detail: "Current scope exceeds the recent average",
					},
				],
			},
		},
		{
			id: "sprint-progress",
			template: "delivery-progress",
			data: {
				title: "Sprint 42 progress",
				completed: 18,
				inProgress: 8,
				blocked: 3,
				notStarted: 11,
				unit: "points",
				forecast: "2026-10-03",
				scopeChange: {
					added: 6,
					removed: 2,
					detail: "One load-test ticket was added and two polish tickets were removed.",
				},
				summary:
					"Delivery is slightly behind the sprint's calendar pace. The blocked badge work and newly added load test are the main risks to the one-day-late forecast.",
			},
		},
		{
			id: "sprint-board",
			template: "work-item-board",
			data: {
				title: "Sprint task overview",
				description: "Triage the work by status and spot the item that needs help.",
				columns: [
					{
						id: "planned",
						label: "To do",
						total: 4,
						items: [
							{ key: "AUTH-51", title: "Rename registered state", owner: "Sam Lee", priority: "medium", meta: "2 pts" },
							{ key: "AUTH-58", title: "Load test key store", priority: "low", meta: "6 pts" },
						],
					},
					{
						id: "active",
						label: "In progress",
						total: 4,
						items: [{ key: "AUTH-44", title: "Gateway auth middleware", owner: "Jane Doe", priority: "high", meta: "5 pts" }],
					},
					{
						id: "blocked",
						label: "Blocked",
						total: 1,
						items: [{ key: "AUTH-49", title: "Fix profile badge colour", owner: "Priya K", priority: "urgent", meta: "Waiting on design" }],
					},
					{
						id: "done",
						label: "Done",
						total: 5,
						items: [
							{ key: "AUTH-40", title: "Rotate session keys", owner: "Jane Doe", meta: "3 pts" },
							{ key: "AUTH-37", title: "Add session audit log", owner: "Tom W", meta: "3 pts" },
						],
					},
				],
			},
		},
		{
			id: "sprint-velocity",
			template: "activity-trend",
			data: {
				title: "Sprint velocity",
				description: "Completed points from the last four sprints help calibrate the next commitment.",
				unit: "points",
				chart: "bar",
				series: [{
					label: "Delivered",
					points: [
						{ at: "2026-08-14", value: 27 },
						{ at: "2026-08-28", value: 31 },
						{ at: "2026-09-11", value: 29 },
						{ at: "2026-09-25", value: 34 },
					],
				}],
				annotation: { at: "2026-09-25", label: "Sprint 41: 34 points delivered" },
			},
		},
	],
	"todo-list": [
		{
			id: "todo-tasks",
			template: "task-list",
			data: {
				title: "Launch checklist",
				description: "Each task includes why it matters, its timing, and current status.",
				tasks: [
					{
						id: "migration-guard",
						key: "REL-18",
						title: "Confirm migration guard",
						detail: "Check production schema safety and rollback behavior.",
						meta: "Before launch",
						status: "Queued",
					},
					{
						id: "access-policy",
						key: "REL-19",
						title: "Review access policy",
						detail: "Validate least-privilege roles against the release changes.",
						meta: "Before launch",
						status: "Queued",
					},
					{
						id: "smoke-test",
						key: "REL-20",
						title: "Run final smoke test",
						detail: "Verify sign-in and workspace sharing end to end.",
						meta: "Today",
						status: "In review",
					},
					{
						id: "release-notes",
						key: "REL-21",
						title: "Publish release notes",
						detail: "Explain the changes and any action customers need to take.",
						meta: "Next",
						status: "Planned",
					},
				],
			},
		},
		{
			id: "todo-acceptance",
			template: "check-list",
			data: {
				title: "Definition of done",
				checks: [
					{ name: "Owner assigned", status: "passed", detail: "Every launch task has a clear owner." },
					{ name: "Rollback documented", status: "pending", detail: "Add the rollback steps to the release record." },
					{ name: "Support briefed", status: "pending", detail: "Share the customer impact with support." },
				],
			},
		},
	],
	"pull-request": [
		{
			id: "pr-history",
			template: "git-graph",
			data: {
				title: "Merge history",
				description: "Follow the feature branch from its first commit through review and merge.",
				branches: [
					{ id: "main", name: "main" },
					{ id: "feature", name: "feat/workspace-templates" },
					{ id: "fix", name: "fix/template-order" },
				],
				commits: [
					{
						sha: "f00dbabe",
						message: "Merge fix/template-order",
						author: "Priya K",
						date: "2026-09-26T10:00:00Z",
						parents: ["e11c0de1", "c0ffee22"],
						branchIds: ["main"],
					},
					{
						sha: "e11c0de1",
						message: "Merge feat/workspace-templates",
						author: "Jane Doe",
						date: "2026-09-25T16:00:00Z",
						parents: ["a1b2c3d4", "d3a4b5c6"],
						branchIds: ["main", "feature"],
					},
					{
						sha: "c0ffee22",
						message: "Fix template ordering",
						author: "Priya K",
						date: "2026-09-25T12:00:00Z",
						parents: ["a1b2c3d4"],
						branchIds: ["fix"],
					},
					{
						sha: "d3a4b5c6",
						message: "Add sprint and release templates",
						author: "Jane Doe",
						date: "2026-09-24T12:00:00Z",
						parents: ["b5e6f7a8"],
						branchIds: ["feature"],
					},
					{
						sha: "b5e6f7a8",
						message: "Add artefact template catalogue",
						author: "Jane Doe",
						date: "2026-09-23T12:00:00Z",
						parents: ["a1b2c3d4"],
						branchIds: ["feature"],
					},
					{
						sha: "a1b2c3d4",
						message: "Release 1.8.0",
						author: "Tom W",
						date: "2026-09-22T09:00:00Z",
						parents: ["9f8e7d6c"],
						branchIds: ["main"],
					},
				],
			},
		},
		{
			id: "pr-diff",
			template: "code-diff",
			data: {
				title: "Template registry change",
				description: "The new blocks become available to developer artefacts.",
				file: "src/artefacts/templates/catalogue.ts",
				hunks: [{
					header: "@@ -18,6 +18,9 @@ import templates",
					oldStart: 18,
					newStart: 18,
					lines: [
						{ kind: "context", content: 'import { CheckList } from "./blocks/CheckList";' },
						{ kind: "add", content: 'import { WorkItemBoard } from "./blocks/WorkItemBoard";' },
						{ kind: "add", content: 'import { DeliveryReadiness } from "./blocks/DeliveryReadiness";' },
						{ kind: "context", content: "export const templateDefinitions = {" },
						{ kind: "add", content: '  "work-item-board": definition(WorkItemBoard),' },
						{ kind: "add", content: '  "delivery-readiness": definition(DeliveryReadiness),' },
					],
				}],
			},
		},
		{
			id: "pr-review",
			template: "review-comments",
			data: {
				title: "Review feedback",
				summary: "The examples cover the new blocks and keep the catalogue focused on supplied evidence.",
				comments: [
					{
						author: "Morgan Lee",
						verdict: "approved",
						body: "The sprint board and progress view make the delivery state easy to scan.",
					},
					{
						author: "Priya K",
						verdict: "commented",
						body: "Keep the merge graph newest-first so the final merge is immediately visible.",
					},
				],
			},
		},
		{
			id: "pr-checks",
			template: "check-list",
			data: {
				title: "Merge checks",
				checks: [
					{ name: "Frontend build", status: "passed", detail: "Type check and production bundle completed." },
					{ name: "Review", status: "passed", detail: "Two approvals recorded." },
					{ name: "Preview deploy", status: "pending", detail: "Queued for the preview environment." },
				],
			},
		},
	],
	"release-readiness": [
		{
			id: "release-timeline",
			template: "release-timeline",
			data: {
				title: "v1.9 rollout",
				release: "v1.9.0",
				currentStage: "Production canary · 10% traffic",
				nextGate: "Error budget review",
				events: [
					{
						time: "2026-09-26T09:10:00Z",
						label: "Build and sign",
						kind: "build",
						status: "succeeded",
						detail: "412 tests passed.",
					},
					{
						time: "2026-09-26T09:40:00Z",
						label: "Deploy to staging",
						kind: "deploy",
						environment: "Staging",
						status: "succeeded",
						detail: "Smoke tests green.",
					},
					{
						time: "2026-09-26T11:00:00Z",
						label: "Production canary",
						kind: "rollout",
						environment: "Production",
						status: "in-progress",
						detail: "10% of traffic for two hours.",
					},
					{
						time: "2026-09-26T14:00:00Z",
						label: "Error budget gate",
						kind: "gate",
						environment: "Production",
						status: "pending",
						detail: "Awaiting the canary window.",
					},
				],
			},
		},
		{
			id: "release-decision",
			template: "delivery-readiness",
			data: {
				title: "Full rollout decision",
				subject: "Promote v1.9.0 beyond the canary",
				summary: "Wait for the error budget check and product approval before increasing traffic.",
				gates: [
					{ name: "Unit tests", status: "passed", detail: "412 tests passed." },
					{ name: "Integration tests", status: "passed", detail: "36 staging checks passed." },
					{ name: "Error budget", status: "pending", detail: "Check after the canary window." },
					{ name: "Release notes", status: "pending", detail: "Product approval required." },
				],
				signals: [
					{ label: "Security scan", detail: "No new vulnerabilities.", tone: "positive" },
					{ label: "Key store latency", detail: "Write latency is up 18% on the canary.", tone: "caution" },
				],
				blockers: [],
			},
		},
	],
	"change-impact": [
		{
			id: "impact-map",
			template: "change-impact-map",
			data: {
				title: "Session-key rotation impact",
				description: "The release path and the components affected by the key-store change.",
				nodes: [
					{
						id: "auth-client",
						label: "Auth client",
						detail: "Calls the API gateway as before.",
						change: "unchanged",
						owner: "Identity",
					},
					{
						id: "gateway",
						label: "API gateway",
						detail: "Validates sessions against the key store.",
						change: "modified",
						owner: "Platform",
					},
					{
						id: "key-store",
						label: "Encrypted key store",
						detail: "Stores rotated keys with a 24-hour expiry.",
						change: "at-risk",
						owner: "Data",
					},
					{
						id: "login",
						label: "Login handler",
						detail: "Writes new session keys after sign-in.",
						change: "added",
						owner: "Identity",
					},
				],
				edges: [
					{ source: "auth-client", target: "gateway", label: "requests" },
					{ source: "gateway", target: "key-store", label: "validates" },
					{ source: "login", target: "key-store", label: "writes" },
				],
			},
		},
		{
			id: "impact-owners",
			template: "service-ownership",
			data: {
				title: "Service owners",
				description: "Who to contact for each affected production service.",
				services: [
					{
						name: "auth-gateway",
						owner: "Platform",
						onCall: "Tom W",
						environment: "Production",
						health: "degraded",
						repository: "acme/auth-gateway",
					},
					{
						name: "key-store",
						owner: "Data",
						onCall: "Ana R",
						environment: "Production",
						health: "healthy",
						repository: "acme/key-store",
					},
					{
						name: "login-service",
						owner: "Identity",
						onCall: "Sam Lee",
						environment: "Production",
						health: "healthy",
						repository: "acme/login-service",
					},
				],
			},
		},
	],
	"incident-review": [
		{
			id: "incident-events",
			template: "incident-timeline",
			data: {
				title: "INC-311 · Sign-in failures",
				startedAt: "2026-09-24T13:02:00Z",
				resolvedAt: "2026-09-24T14:47:00Z",
				impact: "12% of sign-ins failed in eu-west for 1 hour 45 minutes.",
				events: [
					{
						time: "2026-09-24T12:55:00Z",
						type: "deploy",
						severity: "info",
						status: "suspected",
						summary: "Gateway 1.8.3 deployed to eu-west.",
						evidence: "The timing matches the start of elevated failures, but the deployment is not yet confirmed as the cause.",
					},
					{
						time: "2026-09-24T13:02:00Z",
						type: "alert",
						severity: "critical",
						status: null,
						summary: "Sign-in error rate crossed the alert threshold.",
					},
					{
						time: "2026-09-24T13:31:00Z",
						type: "mitigation",
						severity: "major",
						status: "confirmed",
						summary: "Traffic shifted to the previous gateway pool.",
					},
					{
						time: "2026-09-24T14:47:00Z",
						type: "resolution",
						severity: "info",
						status: "confirmed",
						summary: "Error rate returned to baseline.",
					},
				],
				rootCause: {
					summary: "A connection pool limit is the leading hypothesis; confirm with gateway metrics before treating it as causal.",
					status: "suspected",
				},
				followUps: [
					{
						title: "Compare gateway pool metrics",
						detail: "Confirm the suspected saturation against request traces.",
						owner: "Platform",
					},
					{
						title: "Add a pool saturation alert",
						detail: "Page before the failure rate affects sign-in.",
						owner: "SRE",
					},
				],
			},
		},
		{
			id: "incident-trend",
			template: "activity-trend",
			data: {
				title: "Sign-in error rate",
				description: "Errors per minute during the incident and recovery.",
				unit: "errors/min",
				chart: "line",
				series: [{
					label: "eu-west",
					points: [
						{ at: "2026-09-24T13:00:00Z", value: 4 },
						{ at: "2026-09-24T13:15:00Z", value: 38 },
						{ at: "2026-09-24T13:30:00Z", value: 31 },
						{ at: "2026-09-24T14:00:00Z", value: 16 },
						{ at: "2026-09-24T14:45:00Z", value: 3 },
					],
				}],
				annotation: { at: "2026-09-24T13:30:00Z", label: "Traffic shifted to the previous gateway pool" },
			},
		},
		{
			id: "incident-risks",
			template: "dependency-risk-register",
			data: {
				title: "Follow-up risks",
				description: "Keep the working theory and its mitigation visible until verified.",
				items: [{
					title: "Gateway connection pool saturation",
					type: "risk",
					impact: "high",
					likelihood: "medium",
					owner: "Platform",
					mitigation: "Compare request traces and pool metrics, then add an early saturation alert.",
					status: "mitigating",
				}],
			},
		},
	],
};

function exampleDocument(
	id: string,
	eyebrow: string,
	title: string,
	summary: string,
	tags: string[],
	blocks: ArtefactNode[],
): ArtefactDocument {
	return {
		version: 1,
		root: {
			id: `${id}-artefact`,
			template: "artefact-page",
			data: { title },
			children: [{
				id: `${id}-page`,
				template: "developer-page",
				data: { eyebrow, title, summary, tags },
				children: blocks,
			}],
		},
	};
}

const artefactDocuments: Record<ArtefactExample, ArtefactDocument> = {
	"scrum-board": exampleDocument(
		"scrum",
		"Sprint 42 · 21 Sep – 2 Oct",
		"Are we on track?",
		"A sprint snapshot combines the work board with delivery progress and recent team velocity.",
		["Sprint 42", "14 work items", "Forecast 3 Oct"],
		artefactExampleBlocks["scrum-board"],
	),
	"todo-list": exampleDocument(
		"todo",
		"Release plan",
		"A checklist with enough context to act",
		"Tasks carry their rationale and timing, while a definition of done keeps the hand-off clear.",
		["Launch plan", "4 actions"],
		artefactExampleBlocks["todo-list"],
	),
	"pull-request": exampleDocument(
		"pull-request",
		"Pull request #482",
		"Add workspace templates",
		"Trace the commits and merge history, inspect the diff, and read the review before deciding to ship.",
		["Ready to merge", "5 commits", "Reviewed"],
		artefactExampleBlocks["pull-request"],
	),
	"release-readiness": exampleDocument(
		"release",
		"Release v1.9.0",
		"Should the canary go to 100%?",
		"A live rollout timeline paired with a go/no-go decision grounded in the required gates.",
		["Production canary", "10% traffic", "Waiting on gate"],
		artefactExampleBlocks["release-readiness"],
	),
	"change-impact": exampleDocument(
		"impact",
		"Change impact",
		"What does key rotation touch?",
		"Map the affected components and make the service owners easy to find.",
		["Session keys", "3 services", "1 at risk"],
		artefactExampleBlocks["change-impact"],
	),
	"incident-review": exampleDocument(
		"incident",
		"Incident review · INC-311",
		"Sign-in failures in eu-west",
		"Read the incident chronologically, see how the error rate recovered, and keep the cause labelled as a hypothesis.",
		["Resolved", "1h 45m", "Cause under review"],
		artefactExampleBlocks["incident-review"],
	),
};

function ArtefactPreview({ type }: { type: ArtefactExample }) {
	return (
		<ArtefactRenderer
			document={artefactDocuments[type]}
			createdAt="2026-09-26T00:00:00.000Z"
			canInteract={false}
			showFooter={false}
		/>
	);
}

function TemplatesPage() {
	const [activeIndex, setActiveIndex] = useState(0);
	const activeExample = artefactExamples[activeIndex];
	const showExample = (index: number) =>
		setActiveIndex((index + artefactExamples.length) % artefactExamples.length);

	return (
		<main>
			<PageHero
				eyebrow="Developer templates"
				title="Useful artefacts start with real work."
				description="Explore focused examples for sprint planning, pull requests, release decisions, and the work around them."
			>
				<Card className="border border-border">
					<Card.Header>
						<div className="grid size-11 place-items-center rounded-lg bg-brand text-brand-foreground">
							<FileText aria-hidden size={21} />
						</div>
						<Card.Title className="mt-5">Artefact examples</Card.Title>
						<Card.Description>
							Concrete examples, ready to adapt to the work in front of you.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div className="space-y-3">
							{artefactExamples.slice(0, 3).map(({ icon: Icon, label, description }) => (
								<div
									key={label}
									className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3"
								>
									<Icon aria-hidden size={18} />
									<div className="min-w-0">
										<p className="font-medium">{label}</p>
										<p className="truncate text-xs text-muted">{description}</p>
									</div>
								</div>
							))}
						</div>
					</Card.Content>
				</Card>
			</PageHero>
			<section className="mx-auto max-w-5xl px-6 pb-24">
				<SectionLead
					eyebrow="Examples to build from"
					title="See the artefact before you make it yours."
					description="Each example shows how Klee gives the important context a clear, shareable form."
				/>
				<Card className="mt-10 border border-border p-0">
					<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
						<div aria-live="polite" aria-atomic="true">
							<Paragraph size="sm" weight="medium" className="text-accent-text">
								{activeExample.label} · {String(activeIndex + 1).padStart(2, "0")} / {String(artefactExamples.length).padStart(2, "0")}
							</Paragraph>
							<Paragraph className="mt-1 text-muted">{activeExample.description}</Paragraph>
						</div>
						<div className="flex gap-2">
							<Button
								aria-label="Previous example"
								isIconOnly
								variant="secondary"
								onPress={() => showExample(activeIndex - 1)}
							>
								<ChevronLeft aria-hidden size={18} />
							</Button>
							<Button
								aria-label="Next example"
								isIconOnly
								variant="secondary"
								onPress={() => showExample(activeIndex + 1)}
							>
								<ChevronRight aria-hidden size={18} />
							</Button>
						</div>
					</div>
				<div
					className="flex flex-wrap gap-2 px-5 pt-4 sm:px-6"
					aria-label="Choose an example"
				>
						{artefactExamples.map(({ id, label }, index) => (
							<button
								key={id}
								type="button"
								aria-label={`Show ${label} example`}
								aria-pressed={activeIndex === index}
								onClick={() => showExample(index)}
								className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
									activeIndex === index
										? "bg-brand text-brand-foreground"
										: "bg-surface-secondary text-muted hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>
					<div className="px-3 pb-5 pt-4 sm:px-6 sm:pb-6">
						<ArtefactPreview key={activeExample.id} type={activeExample.id} />
					</div>
				</Card>
			</section>
		</main>
	);
}

const integrations = [
	[GitHubIcon, "GitHub", "Pull requests and commits become shared context."],
	[SlackIcon, "Slack", "Send a visual update to the discussion already happening."],
	[JiraIcon, "Jira", "Keep the delivery record close to the work item."],
] as const;

function DeveloperIntegrationsPage() {
	return (
		<main>
			<PageHero
				eyebrow="Developer integrations"
				title="The work is distributed. The context should not be."
				description="Connect the delivery tools your team depends on and let Klee carry the important thread from one place to the next."
			>
				<Card className="border border-border">
					<Card.Header>
						<Chip color="success" size="sm" variant="soft">
							Connected workspace
						</Chip>
						<Card.Title className="mt-4">
							One artefact, three touchpoints
						</Card.Title>
					</Card.Header>
					<Card.Content className="space-y-3">
						{integrations.map(([Icon, name], index) => (
							<div className="flex items-center gap-3" key={name}>
								<div className="grid size-9 place-items-center rounded-lg bg-surface-secondary">
									<Icon aria-hidden className="size-5" />
								</div>
								<span className="flex-1 font-medium">{name}</span>
								{index < integrations.length - 1 && (
									<ArrowRight aria-hidden size={16} className="text-muted" />
								)}
								<CircleCheck
									aria-label="Connected"
									size={18}
									className="text-success"
								/>
							</div>
						))}
					</Card.Content>
				</Card>
			</PageHero>
			<section className="mx-auto max-w-6xl px-6 pb-24">
				<SectionLead
					eyebrow="Connect the loop"
					title="Context moves forward, not sideways."
					description="Each integration keeps its own job—Klee connects the decision-making that would otherwise be scattered between them."
				/>
				<div className="mt-12 grid gap-4 md:grid-cols-3">
					{integrations.map(([Icon, name, description], index) => (
						<Card key={name} variant={index === 1 ? "tertiary" : "secondary"}>
							<Card.Header>
								<Icon aria-hidden className="size-7" />
								<Card.Title className="mt-6">{name}</Card.Title>
								<Card.Description>{description}</Card.Description>
							</Card.Header>
							<Card.Footer>
								<Button
									variant="ghost"
									size="sm"
									onPress={() =>
										document
											.getElementById("integration-flow")
											?.scrollIntoView({ behavior: "smooth" })
									}
								>
									See how it connects <ArrowUpRight aria-hidden size={15} />
								</Button>
							</Card.Footer>
						</Card>
					))}
				</div>
				<Card id="integration-flow" className="mt-10 border border-border">
					<Card.Header>
						<Card.Title>From a change to a shared decision</Card.Title>
						<Card.Description>
							A lightweight flow that leaves every system doing what it does best.
						</Card.Description>
					</Card.Header>
					<Card.Content className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
						{[
							["1", "A pull request opens"],
							["2", "Klee creates context"],
							["3", "The team sees it where they work"],
						].map(([number, label], index) => (
							<FragmentFlow key={label} index={index} number={number} label={label} />
						))}
					</Card.Content>
				</Card>
			</section>
		</main>
	);
}

function FragmentFlow({ index, number, label }: { index: number; number: string; label: string }) {
	return (
		<>
			<div className="rounded-lg bg-surface-secondary p-4">
				<span className="text-sm font-medium text-accent-text">Step {number}</span>
				<p className="mt-2 font-semibold">{label}</p>
			</div>
			{index < 2 && <ArrowRight aria-hidden className="mx-auto text-muted" />}
		</>
	);
}

function BusinessPage() {
	return (
		<>
		<main>
			<PageHero
				eyebrow="Klee for business"
				title="A shared view of work in motion."
				description="Give teams and stakeholders a clear way to understand progress, choices, and delivery risk—without flattening the technical detail that matters."
			>
				<Card className="border border-border p-0">
					<Card.Header className="border-b border-border bg-surface-secondary px-6 py-5">
						<div className="flex items-center gap-3">
							<div className="grid size-10 place-items-center rounded-lg bg-brand text-brand-foreground">
								<Building2 aria-hidden size={20} />
							</div>
							<div>
								<Card.Title>Launch readiness</Card.Title>
								<Card.Description>
									Identity platform · September release
								</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content className="gap-5 p-6">
						<div className="grid grid-cols-3 gap-3">
							{[
								["On track", "Status"],
								["3", "Open decisions"],
								["4", "Teams aligned"],
							].map(([value, label]) => (
								<div key={label} className="rounded-lg bg-surface-secondary p-3">
									<p className="text-lg font-semibold">{value}</p>
									<p className="text-xs text-muted">{label}</p>
								</div>
							))}
						</div>
						<div className="rounded-lg border border-border p-4">
							<div className="flex items-center justify-between gap-3">
								<span className="font-medium">Next decision</span>
								<Chip color="warning" size="sm" variant="soft">
									Needs input
								</Chip>
							</div>
							<p className="mt-2 text-sm text-muted">
								Confirm rollout ownership before the final release review.
							</p>
						</div>
					</Card.Content>
				</Card>
			</PageHero>
			<section className="border-y border-border bg-surface-secondary py-20">
				<SectionLead
					eyebrow="Less status theatre"
					title="Give updates a decision to carry."
					description="Klee helps teams move from a stream of activity to a durable, understandable account of what matters next."
				/>
				<div className="mx-auto mt-12 grid max-w-6xl gap-4 px-6 md:grid-cols-3">
					<FeatureCard icon={Layers3} title="One clear narrative" description="Bring the change, the impact, and the next choice into the same view." />
					<FeatureCard icon={UsersRound} title="Aligned collaborators" description="Share an update that technical and business teams can both use." />
					<FeatureCard icon={Workflow} title="Progress with purpose" description="Track the open decisions that determine whether work can move." />
				</div>
			</section>
		</main>
		<Footer />
		</>
	);
}

function AccessControlPage() {
	const people = [
		["Workspace owner", "Full workspace control", "Admin"],
		["Delivery team", "Create and review artefacts", "Member"],
		["Release partner", "Review selected share links", "Guest"],
	] as const;
	return (
		<main>
			<PageHero
				eyebrow="Access control"
				title="Context belongs with the people who need it."
				description="Keep every artefact private by default, make sharing intentional, and give teams confidence that the right work is visible to the right people."
			>
				<Card className="border border-border">
					<Card.Header>
						<div className="flex items-center justify-between gap-3">
							<div className="grid size-10 place-items-center rounded-lg bg-brand text-brand-foreground">
								<ShieldCheck aria-hidden size={20} />
							</div>
							<Chip color="success" size="sm" variant="soft">
								Private workspace
							</Chip>
						</div>
						<Card.Title className="mt-5">Release workspace access</Card.Title>
						<Card.Description>Three roles, clear responsibilities.</Card.Description>
					</Card.Header>
					<Card.Content className="gap-0">
						{people.map(([role, detail, permission], index) => (
							<div key={role}>
								<div className="flex items-center gap-3 py-3">
									<div className="grid size-8 place-items-center rounded-full bg-surface-secondary">
										<UsersRound aria-hidden size={15} />
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-medium">{role}</p>
										<p className="truncate text-xs text-muted">{detail}</p>
									</div>
									<Chip size="sm" variant="soft">{permission}</Chip>
								</div>
								{index < people.length - 1 && <Separator />}
							</div>
						))}
					</Card.Content>
				</Card>
			</PageHero>
			<section className="mx-auto max-w-6xl px-6 pb-24">
				<SectionLead
					eyebrow="Intentional by design"
					title="Control how context travels."
					description="A few simple controls make sensitive delivery information easier to share thoughtfully."
				/>
				<div className="mt-12 grid gap-4 md:grid-cols-3">
					<FeatureCard icon={LockKeyhole} title="Private by default" description="Creating an artefact never makes it public." />
					<FeatureCard icon={KeyRound} title="Share when ready" description="Generate a read-only link for the people invited to review." />
					<FeatureCard icon={UsersRound} title="Workspace roles" description="Make responsibilities clear across owners, members, and guests." />
				</div>
				<Card className="mt-10 border border-border">
					<Card.Header>
						<Card.Title>Designed for practical access</Card.Title>
						<Card.Description>
							Keep collaborative work moving without turning every update into a broad permission request.
						</Card.Description>
					</Card.Header>
					<Card.Footer className="justify-between">
						<Paragraph size="sm" color="muted">
							Give context where it is useful—and nowhere else.
						</Paragraph>
						<StartButton>Set up your workspace</StartButton>
					</Card.Footer>
				</Card>
			</section>
		</main>
	);
}

function TeamIntegrationsPage() {
	const steps = [
		[PlugZap, "Connect once", "Set up the delivery tools your workspace already uses."],
		[UsersRound, "Make it available", "Give every project the same considered way to share context."],
		[Sparkles, "Keep the signal", "Let artefacts follow the work without adding another status ritual."],
	] as const;
	return (
		<main>
			<PageHero
				eyebrow="Team integrations"
				title="Set up the workspace, not every person."
				description="Give the whole team a connected way to share technical work—consistent enough to scale, flexible enough to fit the project."
			>
				<Card className="border border-border">
					<Card.Header>
						<Chip color="accent" size="sm" variant="soft">
							Workspace rollout
						</Chip>
						<Card.Title className="mt-4">Integration setup</Card.Title>
						<Card.Description>Ready for every team that works here.</Card.Description>
					</Card.Header>
					<Card.Content className="space-y-3">
						{[
							"GitHub connected",
							"Slack available",
							"Jira project links enabled",
						].map((item) => (
							<div key={item} className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3">
								<CircleCheck aria-hidden className="text-success" size={18} />
								<span className="font-medium">{item}</span>
							</div>
						))}
					</Card.Content>
				</Card>
			</PageHero>
			<section className="border-y border-border bg-surface-secondary py-20">
				<SectionLead
					eyebrow="A better default"
					title="The team gets clarity without a rollout project."
					description="Start small, then use the same connected workflow wherever a project needs it."
				/>
				<div className="mx-auto mt-12 grid max-w-6xl gap-4 px-6 md:grid-cols-3">
					{steps.map(([Icon, title, description], index) => (
						<Card key={title} variant={index === 1 ? "tertiary" : "secondary"}>
							<Card.Header>
								<span className="text-sm font-medium text-accent-text">0{index + 1}</span>
								<Icon aria-hidden className="mt-5 size-7" />
								<Card.Title className="mt-5">{title}</Card.Title>
								<Card.Description>{description}</Card.Description>
							</Card.Header>
						</Card>
					))}
				</div>
			</section>
			<section className="mx-auto max-w-6xl px-6 py-24">
				<Card className="items-start border border-border p-8 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Card.Title>Make better updates the default.</Card.Title>
						<Card.Description className="mt-2 max-w-xl">
							A connected workspace helps every project begin with the same clear path from change to shared understanding.
						</Card.Description>
					</div>
					<StartButton>Bring in your team</StartButton>
				</Card>
			</section>
		</main>
	);
}

const plans = [
	[
		"Individual",
		"$0",
		"For personal projects and a first shared artefact.",
		["Create and edit artefacts", "Share read-only links", "Use developer templates"],
	],
	[
		"Team",
		"Talk to us",
		"For a connected team workflow across projects.",
		["Shared workspace setup", "Team integrations", "Collaborative review"],
	],
	[
		"Enterprise",
		"Talk to us",
		"For organisations that need deliberate access and rollout.",
		["Access controls", "Organisation support", "Rollout planning"],
	],
] as const;

function PricingPage() {
	return (
		<>
		<main>
			<section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
				<Chip color="accent" size="sm" variant="soft">Pricing</Chip>
				<Heading level={1} className="mt-5 text-5xl tracking-tight text-balance sm:text-6xl">
					A clearer way to move work forward.
				</Heading>
				<Paragraph className="mx-auto mt-6 max-w-2xl text-lg text-muted">
					Start with your own work, then choose the support your team needs as Klee becomes part of how you share context.
				</Paragraph>
			</section>
			<section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 lg:grid-cols-3">
				{plans.map(([name, price, description, features], index) => (
					<Card
						key={name}
						variant={index === 1 ? "tertiary" : "default"}
						className={index === 1 ? "border border-brand" : "border border-border"}
					>
						<Card.Header>
							<div className="flex items-center justify-between">
								<Card.Title>{name}</Card.Title>
								{index === 1 && (
									<Chip color="accent" size="sm" variant="soft">
										Most collaborative
									</Chip>
								)}
							</div>
							<p className="mt-6 text-3xl font-semibold tracking-tight">{price}</p>
							<Card.Description className="mt-3 min-h-12">
								{description}
							</Card.Description>
						</Card.Header>
						<Card.Content className="flex-1">
							<Separator />
							<ul className="mt-5 space-y-3">
								{features.map((feature) => (
									<li className="flex gap-3 text-sm" key={feature}>
										<Check aria-hidden className="mt-0.5 shrink-0 text-success" size={16} />
										{feature}
									</li>
								))}
							</ul>
						</Card.Content>
						<Card.Footer>
							<StartButton>{index === 0 ? "Start creating" : "Contact us"}</StartButton>
						</Card.Footer>
					</Card>
				))}
			</section>
			<section className="border-t border-border bg-surface-secondary py-16 text-center">
				<Heading level={2} className="text-3xl tracking-tight">
					Start with one useful artefact.
				</Heading>
				<Paragraph className="mx-auto mt-3 max-w-xl text-muted">
					The clearest next step is the one that helps your team understand the work already in front of it.
				</Paragraph>
			</section>
		</main>
		<Footer />
		</>
	);
}

export function MarketingPage({ page }: { page: MarketingPageName }) {
	const pages = {
		developers: <DevelopersPage />,
		"developer-templates": <TemplatesPage />,
		"developer-integrations": <DeveloperIntegrationsPage />,
		business: <BusinessPage />,
		"access-control": <AccessControlPage />,
		"team-integrations": <TeamIntegrationsPage />,
		pricing: <PricingPage />,
	};
	return pages[page];
}
