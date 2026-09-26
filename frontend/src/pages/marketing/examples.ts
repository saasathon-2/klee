import type { ArtefactDocument, ArtefactNode } from "../../artefacts/model";

/** Example artefacts for the templates page, built from the same blocks real artefacts use. */
export const artefactExamples = [
	{
		id: "scrum-board",
		label: "Scrum board",
		description: "Sprint progress, task overview, and team velocity at a glance.",
	},
	{
		id: "todo-list",
		label: "Enriched to-do list",
		description: "Turn a set of tasks into a clear, actionable work plan.",
	},
	{
		id: "pull-request",
		label: "GitHub pull request",
		description: "Merge history, code changes, checks, and review feedback.",
	},
	{
		id: "release-readiness",
		label: "Release readiness",
		description: "See the rollout stages and whether it is safe to proceed.",
	},
	{
		id: "change-impact",
		label: "Change impact map",
		description: "Trace an engineering change through affected services and owners.",
	},
	{
		id: "incident-review",
		label: "Incident review",
		description: "Connect the incident timeline, error-rate trend, and follow-up risks.",
	},
	{
		id: "dependency-upgrade",
		label: "Dependency upgrade",
		description: "What an upgrade touches, and the order to roll it out.",
	},
] as const;

export type ArtefactExample = (typeof artefactExamples)[number]["id"];

const artefactExampleBlocks: Record<ArtefactExample, ArtefactNode[]> = {
	"dependency-upgrade": [
		{
			id: "upgrade-graph",
			template: "dependency-graph",
			data: {
				title: "What depends on the auth SDK",
				description: "Edges point from each package to what it depends on.",
				nodes: [
					{ id: "web", label: "apps/web", kind: "module", detail: "Customer dashboard", version: null, health: null, url: null },
					{ id: "api", label: "apps/api", kind: "service", detail: "Public REST API", version: null, health: null, url: null },
					{ id: "sdk", label: "@acme/auth-sdk", kind: "package", detail: "Session and token helpers", version: "3.2.0 → 4.0.0", health: "outdated", url: null },
					{ id: "jose", label: "jose", kind: "package", detail: "JWT signing", version: "4.15.4", health: "vulnerable", url: null },
					{ id: "db", label: "sessions", kind: "database", detail: "Postgres table", version: null, health: null, url: null },
				],
				edges: [
					{ source: "web", target: "sdk", label: null },
					{ source: "api", target: "sdk", label: null },
					{ source: "sdk", target: "jose", label: null },
					{ source: "api", target: "db", label: null },
				],
			},
		},
		{
			id: "upgrade-flow",
			template: "flowchart",
			data: {
				title: "Rollout",
				description: "Upgrade the API first; the dashboard follows once sessions are stable.",
				steps: [
					{ id: "bump", label: "Bump auth-sdk to 4.0", kind: "start", detail: null, url: null },
					{ id: "api", label: "Deploy API canary", kind: "step", detail: "10% of traffic", url: null },
					{ id: "stable", label: "Sessions stable for 1h?", kind: "decision", detail: null, url: null },
					{ id: "rollback", label: "Roll back API", kind: "step", detail: "Pin 3.2.0", url: null },
					{ id: "web", label: "Deploy dashboard", kind: "step", detail: null, url: null },
					{ id: "done", label: "Remove 3.x shims", kind: "end", detail: null, url: null },
				],
				edges: [
					{ source: "bump", target: "api", label: null },
					{ source: "api", target: "stable", label: null },
					{ source: "stable", target: "rollback", label: "No" },
					{ source: "stable", target: "web", label: "Yes" },
					{ source: "web", target: "done", label: null },
				],
			},
		},
	],
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

export const artefactDocuments: Record<ArtefactExample, ArtefactDocument> = {
	"dependency-upgrade": exampleDocument(
		"upgrade",
		"Dependency upgrade",
		"Upgrading auth-sdk to 4.0",
		"Two apps use the SDK, and its jose dependency has a known advisory, so the upgrade goes API first.",
		["auth-sdk", "2 apps", "1 advisory"],
		artefactExampleBlocks["dependency-upgrade"],
	),
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
