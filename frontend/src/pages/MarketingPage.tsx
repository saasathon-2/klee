import {
	Button,
	Card,
	Heading,
	Link,
	Paragraph,
	Separator,
	Table,
	Tabs,
} from "@heroui/react";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../useDocumentTitle";
import type { ArtefactDocument } from "../artefacts/model";
import { ArtefactRenderer } from "../artefacts/templates/renderer";
import { GitHubIcon, JiraIcon, SlackIcon } from "../components/BrandIcons";
import { Footer } from "./landing/Footer";
import { landingSamples } from "./landing/samples";
import { artefactDocuments, artefactExamples } from "./marketing/examples";

export type MarketingPageName =
	| "create"
	| "review"
	| "share"
	| "developers"
	| "developer-templates"
	| "developer-integrations"
	| "business"
	| "access-control"
	| "team-integrations"
	| "pricing";

const integrationsSource = "https://github.com/saasathon-2/integrations/tree/main";

/** A plain page: a title, one sentence saying what it covers, then sections. */
function Page({
	title,
	intro,
	wide = false,
	children,
}: {
	title: string;
	intro: string;
	wide?: boolean;
	children: ReactNode;
}) {
	return (
		<>
			<main className={`mx-auto px-6 py-16 sm:py-20 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
				<Heading level={1} className="text-4xl tracking-tight">
					{title}
				</Heading>
				<Paragraph className="mt-4 max-w-2xl text-lg text-muted">{intro}</Paragraph>
				<div className="mt-12 space-y-12">{children}</div>
			</main>
			<Footer />
		</>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section>
			<Heading level={2} className="text-xl">
				{title}
			</Heading>
			<div className="mt-3 space-y-3 leading-7 text-muted">{children}</div>
		</section>
	);
}

function Steps({ items }: { items: ReactNode[] }) {
	return (
		<ol className="list-decimal space-y-2 pl-5">
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ol>
	);
}

function Points({ items }: { items: [string, string][] }) {
	return (
		<dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
			{items.map(([term, detail]) => (
				<div key={term}>
					<dt className="font-medium text-foreground">{term}</dt>
					<dd className="mt-0.5 text-sm">{detail}</dd>
				</div>
			))}
		</dl>
	);
}

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto rounded-xl border border-border bg-surface-secondary p-4 font-mono text-sm leading-6 text-foreground">
			<code>{children}</code>
		</pre>
	);
}

function Example({ document }: { document: ArtefactDocument }) {
	return (
		<Card className="overflow-hidden border border-border p-0">
			<ArtefactRenderer
				document={document}
				createdAt="2026-09-26T00:00:00.000Z"
				canInteract={false}
				showFooter={false}
			/>
		</Card>
	);
}

function NextLinks({ docs, start = true }: { docs?: string; start?: boolean }) {
	const navigate = useNavigate();
	return (
		<div className="flex flex-wrap items-center gap-4">
			{start && (
				<Button onPress={() => navigate("/?auth=signup")}>
					Open Klee
					<ArrowRight aria-hidden size={16} />
				</Button>
			)}
			{docs && <Link href={`/docs#${docs}`}>Read the docs</Link>}
		</div>
	);
}

function CreatePage() {
	return (
		<Page
			title="Create an artefact"
			intro="Describe what you need. Klee picks the blocks that fit and fills them from your prompt, the links you paste, and your connected apps."
		>
			<Section title="How it works">
				<Steps
					items={[
						"Write a prompt. Paste links to pull requests, issues, or docs and they appear as chips.",
						"Klee chooses blocks such as code diffs, git graphs, flowcharts, timelines, and checklists, and fills them in.",
						"Ask for changes in the bar at the bottom, or press Edit to change the text yourself.",
						"Each change is saved as a version you can go back to from History.",
					]}
				/>
			</Section>
			<Section title="Example">
				<Example document={landingSamples.create} />
			</Section>
			<NextLinks docs="start" />
		</Page>
	);
}

function ReviewPage() {
	return (
		<Page
			title="Pull request reviews"
			intro="With the GitHub Action installed, Klee builds a page for each pull request and links it in a comment."
		>
			<Section title="What the page shows">
				<Points
					items={[
						["Code changes", "The one to three diffs that matter most."],
						["Review feedback", "What each reviewer said and where they landed."],
						["History", "Commits, drawn as a git graph when branches merge."],
						["Checks", "CI results, with live status while jobs run."],
					]}
				/>
			</Section>
			<Section title="Set up">
				<Steps
					items={[
						"Connect GitHub from Integrations in your workspace.",
						"Add the workflow below to a repository where the Klee app is installed.",
						"Open a pull request. The page updates when CI finishes.",
					]}
				/>
				<CodeBlock>{`on: pull_request

permissions:
  id-token: write

jobs:
  klee:
    runs-on: ubuntu-latest
    steps:
      - uses: saasathon-2/integrations/github@main
        with:
          api-url: https://<api-domain>
          pull-request: \${{ github.event.pull_request.number }}`}</CodeBlock>
			</Section>
			<Section title="Example">
				<Example document={landingSamples.review} />
			</Section>
			<NextLinks docs="github" />
		</Page>
	);
}

function SharePage() {
	return (
		<Page title="Sharing" intro="Artefacts are private until you share them.">
			<Section title="Ways to share">
				<Points
					items={[
						["Invite people", "Add a Klee account by email and choose whether they can view, comment, or edit."],
						["Share with an organisation", "Everyone in the organisation gets the access you pick."],
						["Link sharing", "Turn it on and anyone with the link can view. Only invited people can comment or edit."],
						["GitHub projects", "Artefacts in a GitHub project are editable by members of that GitHub org."],
					]}
				/>
			</Section>
			<Section title="Comments">
				<Paragraph>
					Press Comments to turn on comment mode, then drag across part of the page to leave a comment on it. Outside comment mode you can select and copy text as usual.
				</Paragraph>
			</Section>
			<Section title="Stopping">
				<Paragraph>
					Stop sharing in the share dialog removes every invite and organisation and turns the link off.
				</Paragraph>
			</Section>
			<NextLinks docs="start" />
		</Page>
	);
}

function DevelopersPage() {
	return (
		<Page
			title="Klee for developers"
			intro="Klee turns engineering context, like pull requests, branches, CI runs, architecture, and sprint work, into pages your team can read and share."
		>
			<Section title="Blocks for engineering work">
				<Points
					items={[
						["Code diff", "Changed lines with context, per file."],
						["Git graph", "Branches, merges, and commits in order."],
						["Check list", "CI results that update live from GitHub."],
						["Flowchart", "Processes with decisions, like release or on-call steps."],
						["Dependency graph", "Packages and services, with versions and health."],
						["Change impact map", "Which services a change touches, and who owns them."],
						["Release and incident timelines", "Events in order, with status and evidence."],
						["Sprint timeline and board", "Work items by date or by state."],
					]}
				/>
			</Section>
			<Section title="Where it connects">
				<Paragraph>
					GitHub builds a page for each pull request. Slack previews artefact links in channels. Jira shows linked artefacts on issues.{" "}
					<Link href="/developer-integrations">See integrations</Link>.
				</Paragraph>
			</Section>
			<NextLinks docs="overview" />
		</Page>
	);
}

function TemplatesPage() {
	return (
		<Page
			title="Templates"
			intro="Examples of artefacts built from Klee's blocks. Each one started as a prompt."
			wide
		>
			<Tabs defaultSelectedKey={artefactExamples[0].id}>
				<Tabs.ListContainer className="overflow-x-auto">
					<Tabs.List aria-label="Examples">
						{artefactExamples.map((example) => (
							<Tabs.Tab key={example.id} id={example.id}>
								{example.label}
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs.ListContainer>
				{artefactExamples.map((example) => (
					<Tabs.Panel key={example.id} id={example.id} className="mt-6 space-y-4">
						<Paragraph color="muted">{example.description}</Paragraph>
						<Example document={artefactDocuments[example.id]} />
					</Tabs.Panel>
				))}
			</Tabs>
		</Page>
	);
}

const integrations = [
	{
		name: "GitHub",
		Icon: GitHubIcon,
		summary: "Builds a page for each pull request, comments the link, and refreshes it when CI finishes. Check statuses stay live.",
		setup: "Install the GitHub App, then add the Klee Action to a workflow.",
		source: `${integrationsSource}/github`,
		docs: "github",
	},
	{
		name: "Slack",
		Icon: SlackIcon,
		summary: "Unfurls shared artefact links in channels and threads. /klee posts a preview of any artefact.",
		setup: "Install the Klee app to your workspace.",
		source: `${integrationsSource}/slack`,
	},
	{
		name: "Jira",
		Icon: JiraIcon,
		summary: "Shows artefacts linked from an issue's description or comments in a Klee panel.",
		setup: "Install the Klee app from the Atlassian Marketplace.",
		source: `${integrationsSource}/jira`,
	},
] as const;

function DeveloperIntegrationsPage() {
	return (
		<Page
			title="Integrations"
			intro="Connect these from Integrations in your workspace. Each one's source is public."
		>
			<div className="space-y-4">
				{integrations.map(({ name, Icon, summary, setup, source, ...rest }) => (
					<Card key={name} variant="secondary">
						<Card.Header className="flex-row items-center gap-3">
							<Icon aria-hidden className="size-6" />
							<Card.Title className="flex-1">{name}</Card.Title>
							<Link href={source} target="_blank" className="inline-flex items-center gap-1 text-sm">
								Source <ExternalLink aria-hidden size={14} />
							</Link>
						</Card.Header>
						<Card.Content className="space-y-1 text-sm">
							<p>{summary}</p>
							<p className="text-muted">
								{setup}
								{"docs" in rest && (
									<>
										{" "}
										<Link href={`/docs#${rest.docs}`}>Setup guide</Link>
									</>
								)}
							</p>
						</Card.Content>
					</Card>
				))}
			</div>
		</Page>
	);
}

function BusinessPage() {
	return (
		<Page
			title="Klee for teams"
			intro="The same pages work for people outside engineering: what shipped, what's at risk, and what needs a decision."
		>
			<Section title="Useful for">
				<Points
					items={[
						["Sprint status", "Progress, forecast, and what's blocked."],
						["Release decisions", "Required gates and a ready, waiting, or blocked verdict."],
						["Handoffs", "What's done, in flight, and next when work changes hands."],
						["Decisions", "Options, trade-offs, and what was chosen."],
					]}
				/>
			</Section>
			<Section title="Keeping it current">
				<Paragraph>
					Ask for changes in plain language, edit text directly, or let the GitHub Action refresh pull request pages. Comments stay attached to the part of the page they're about.
				</Paragraph>
			</Section>
			<NextLinks docs="overview" />
		</Page>
	);
}

const permissionRows: [string, boolean, boolean, boolean][] = [
	["Read the artefact", true, true, true],
	["Comment and react", false, true, true],
	["Ask for changes or edit text", false, false, true],
	["Change who has access", false, false, false],
];

function AccessControlPage() {
	return (
		<Page
			title="Access control"
			intro="Each artefact has one owner. Only the owner decides who else can see it."
		>
			<Section title="Permission levels">
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label="Permission levels">
							<Table.Header>
								<Table.Column isRowHeader>Action</Table.Column>
								<Table.Column>View</Table.Column>
								<Table.Column>Comment</Table.Column>
								<Table.Column>Edit</Table.Column>
							</Table.Header>
							<Table.Body>
								{permissionRows.map(([action, ...levels]) => (
									<Table.Row key={action} id={action}>
										<Table.Cell>{action}</Table.Cell>
										{levels.map((allowed, index) => (
											<Table.Cell key={index}>
												{allowed ? (
													<Check aria-label="Yes" size={16} className="text-success" />
												) : (
													<span aria-label="No" className="text-muted">
														–
													</span>
												)}
											</Table.Cell>
										))}
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
				<Paragraph size="sm">Changing access is owner-only at every level.</Paragraph>
			</Section>
			<Section title="Where access comes from">
				<Points
					items={[
						["Direct invites", "A Klee account, at the level the owner picks."],
						["Organisations", "Every member, at the level granted to the organisation."],
						["GitHub projects", "Members of the GitHub org get edit access to its artefacts."],
						["Public link", "Anyone with the link can view, and nothing more."],
					]}
				/>
				<Paragraph>When more than one applies, the highest level wins.</Paragraph>
			</Section>
			<NextLinks docs="sharing" />
		</Page>
	);
}

function TeamIntegrationsPage() {
	return (
		<Page title="Team setup" intro="Set Klee up once for the team rather than person by person.">
			<Section title="Steps">
				<Steps
					items={[
						"Create an organisation from Organisations in your workspace and add teammates by email.",
						"Install the GitHub App on your GitHub org. Members of that org can then edit its artefacts.",
						"Install the Slack and Jira apps so links preview where the team already talks.",
						"Share artefacts with the organisation from the share dialog.",
					]}
				/>
			</Section>
			<Section title="Roles">
				<Points
					items={[
						["Owner", "Manages members and roles, and can delete the organisation."],
						["Admin", "Adds members and shares artefacts with the organisation."],
						["Member", "Sees what's shared with the organisation."],
					]}
				/>
			</Section>
			<NextLinks docs="sharing" />
		</Page>
	);
}

const plans = [
	["Individual", "Free", ["Create and edit artefacts", "Share links and invite people", "GitHub pull request pages"]],
	["Team", "Contact us", ["Organisations and roles", "Slack and Jira apps", "Comments on artefacts"]],
	["Enterprise", "Contact us", ["Access reviews", "Rollout support", "Custom integrations"]],
] as const;

function PricingPage() {
	const navigate = useNavigate();
	return (
		<Page title="Pricing" intro="Free for individual use. Teams and larger organisations, get in touch." wide>
			<div className="grid gap-4 lg:grid-cols-3">
				{plans.map(([name, price, features], index) => (
					<Card key={name} variant="secondary">
						<Card.Header>
							<Card.Title>{name}</Card.Title>
							<p className="mt-2 text-2xl font-semibold">{price}</p>
						</Card.Header>
						<Card.Content className="flex-1">
							<Separator />
							<ul className="mt-4 space-y-2 text-sm">
								{features.map((feature) => (
									<li className="flex gap-2" key={feature}>
										<Check aria-hidden className="mt-0.5 shrink-0 text-success" size={16} />
										{feature}
									</li>
								))}
							</ul>
						</Card.Content>
						{index === 0 && (
							<Card.Footer>
								<Button onPress={() => navigate("/?auth=signup")}>Start</Button>
							</Card.Footer>
						)}
					</Card>
				))}
			</div>
		</Page>
	);
}

const pageTitles: Record<MarketingPageName, string> = {
	create: "Create",
	review: "Review",
	share: "Sharing",
	developers: "Developers",
	"developer-templates": "Templates",
	"developer-integrations": "Integrations",
	business: "Teams",
	"access-control": "Access control",
	"team-integrations": "Team setup",
	pricing: "Pricing",
};

export function MarketingPage({ page }: { page: MarketingPageName }) {
	useDocumentTitle(`${pageTitles[page]} - Klee`);
	const pages: Record<MarketingPageName, ReactNode> = {
		create: <CreatePage />,
		review: <ReviewPage />,
		share: <SharePage />,
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
