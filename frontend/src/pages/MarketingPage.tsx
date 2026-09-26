import {
	Button,
	Card,
	Chip,
	Heading,
	Paragraph,
	Separator,
	Tabs,
} from "@heroui/react";
import {
	ArrowRight,
	ArrowUpRight,
	Blocks,
	Building2,
	Check,
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
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { ArtefactDocument } from "../artefacts/model";
import { ArtefactRenderer } from "../artefacts/templates/renderer";
import { GitHubIcon, JiraIcon, SlackIcon } from "../components/BrandIcons";
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
	);
}

const artefactExamples = [
	{
		id: "pull-request",
		label: "Pull request",
		description: "Changes, checks, and review notes in one brief.",
		icon: GitPullRequest,
	},
	{
		id: "daci",
		label: "DACI decision",
		description: "Make ownership and the decision path explicit.",
		icon: UsersRound,
	},
	{
		id: "todo-list",
		label: "To-do list",
		description: "Turn the next steps into work the team can act on.",
		icon: ListTodo,
	},
] as const;

type ArtefactExample = (typeof artefactExamples)[number]["id"];

const artefactDocuments: Record<ArtefactExample, ArtefactDocument> = {
	"pull-request": {
		version: 1,
		root: {
			id: "pull-request-artefact",
			template: "artefact-page",
			data: { title: "Add workspace templates" },
			children: [
				{
					id: "pull-request-page",
					template: "developer-page",
					data: {
						eyebrow: "Pull request #482",
						title: "Add workspace templates",
						summary: "A focused delivery record connecting the change, its checks, and the decision needed to merge.",
						tags: ["Ready to merge", "5 commits", "Reviewed"],
					},
					children: [
						{
							id: "pull-request-metrics",
							template: "metric-row",
							data: {
								items: [
									{ label: "Changes", value: "+12 / -4", detail: "Template catalogue and prompts" },
									{ label: "Checks", value: "4 passed", detail: "Build, lint, tests, migrations" },
									{ label: "Review", value: "Approved", detail: "Ready for the release train" },
								],
							},
						},
						{
							id: "pull-request-checks",
							template: "check-list",
							data: {
								title: "Merge checks",
								checks: [
									{ name: "Frontend build", status: "passed", detail: "Typecheck and production bundle" },
									{ name: "Template review", status: "passed", detail: "Examples verified with the team" },
								],
							},
						},
					],
				},
			],
		},
	},
	daci: {
		version: 1,
		root: {
			id: "daci-artefact",
			template: "artefact-page",
			data: { title: "Choose workspace permissions" },
			children: [
				{
					id: "daci-page",
					template: "developer-page",
					data: {
						eyebrow: "Decision record",
						title: "Choose workspace permissions",
						summary: "A DACI record makes the owner, final call, and next steps clear before the implementation starts.",
						tags: ["DACI", "Access", "Decision needed"],
					},
					children: [
						{
							id: "daci-decision",
							template: "prose",
							data: {
								title: "Decision",
								body: "Adopt workspace-level roles with explicit, auditable access for admins, members, and guests. The choice protects sensitive work while keeping everyday collaboration friction-free.",
							},
						},
						{
							id: "daci-roles",
							template: "metric-row",
							data: {
								items: [
									{ label: "Driver", value: "Nia", detail: "Frames the options and proposal" },
									{ label: "Approver", value: "Morgan", detail: "Owns the final call" },
									{ label: "Contributors", value: "Security + Design", detail: "Stress-test the experience" },
								],
							},
						},
						{
							id: "daci-informed",
							template: "prose",
							data: {
								title: "Informed",
								body: "Workspace members receive the decision record and its release timeline once the approver confirms the direction.",
							},
						},
						{
							id: "daci-follow-up",
							template: "task-list",
							data: {
								title: "Decision follow-up",
								description: "The work that turns the decision into a safe release.",
								tasks: [
									{ id: "access-review", key: "ACCESS-42", title: "Review the role matrix", detail: "Confirm least-privilege defaults.", meta: "Today", status: "In review" },
									{ id: "share-decision", key: "ACCESS-43", title: "Share the decision record", detail: "Notify the teams affected by the change.", meta: "Next", status: "Planned" },
								],
							},
						},
					],
				},
			],
		},
	},
	"todo-list": {
		version: 1,
		root: {
			id: "todo-artefact",
			template: "artefact-page",
			data: { title: "Release checklist" },
			children: [
				{
					id: "todo-page",
					template: "developer-page",
					data: {
						eyebrow: "Launch plan",
						title: "Release checklist",
						summary: "A practical sequence for taking a reviewed change through a confident release.",
						tags: ["v1.2", "Release plan", "5 actions"],
					},
					children: [
						{
							id: "release-tasks",
							template: "task-list",
							data: {
								title: "Launch tasks",
								description: "Keep the final checks and hand-offs visible to the whole team before launch.",
								tasks: [
									{ id: "migration-guard", key: "REL-18", title: "Confirm migration guard", detail: "Check production schema safety.", meta: "Before launch", status: "Queued" },
									{ id: "access-policy", key: "REL-19", title: "Review access policy", detail: "Validate the release against the new roles.", meta: "Before launch", status: "Queued" },
									{ id: "share-artefact", key: "REL-20", title: "Share release artefact", detail: "Give support and customers the same context.", meta: "Before launch", status: "Queued" },
									{ id: "smoke-test", key: "REL-21", title: "Run final smoke test", detail: "Verify the release candidate end to end.", meta: "Today", status: "In review" },
									{ id: "release-notes", key: "REL-22", title: "Publish release notes", detail: "Close the loop with a clear customer update.", meta: "Next", status: "Planned" },
								],
							},
						},
					],
				},
			],
		},
	},
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
	return (
		<main>
			<PageHero
				eyebrow="Developer templates"
				title="Useful artefacts start with real work."
				description="Explore examples of the artefacts Klee can create from a pull request, a team decision, or a practical list of next steps."
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
							{artefactExamples.map(({ icon: Icon, label, description }) => (
								<div
									key={label}
									className="flex items-center gap-3 rounded-lg bg-surface-secondary p-3"
								>
									<Icon aria-hidden size={18} />
									<div className="min-w-0"><p className="font-medium">{label}</p><p className="truncate text-xs text-muted">{description}</p></div>
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
				<Tabs className="mt-10" defaultSelectedKey="pull-request">
					<Tabs.ListContainer>
						<Tabs.List
							aria-label="Developer templates"
							className="w-full justify-start sm:w-auto"
						>
							{artefactExamples.map(({ id, label }) => (
								<Tabs.Tab key={id} id={id}>
									{label}
									<Tabs.Indicator />
								</Tabs.Tab>
							))}
						</Tabs.List>
					</Tabs.ListContainer>
					{artefactExamples.map(({ id, label, description }) => (
						<Tabs.Panel key={id} id={id} className="pt-6">
							<div>
								<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
									<div><Paragraph size="sm" weight="medium" className="text-accent-text">{label} artefact</Paragraph><Paragraph className="mt-1 text-muted">{description}</Paragraph></div>
									<StartButton>Create an artefact</StartButton>
								</div>
								<ArtefactPreview type={id} />
							</div>
						</Tabs.Panel>
					))}
				</Tabs>
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
