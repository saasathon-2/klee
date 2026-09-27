import { Heading, Link, Paragraph, Separator } from "@heroui/react";
import { ExternalLink, LibraryBig } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useDocumentTitle } from "../useDocumentTitle";
import { JiraIcon, SlackIcon } from "../components/BrandIcons";

const sections = [
	{ id: "overview", label: "Overview" },
	{ id: "start", label: "Create and edit" },
	{ id: "blocks", label: "Blocks" },
	{ id: "sharing", label: "Sharing and comments" },
	{ id: "github", label: "GitHub" },
	{ id: "slack-jira", label: "Slack and Jira" },
	{ id: "help", label: "Troubleshooting" },
];

const integrationsSource =
	"https://github.com/saasathon-2/integrations/tree/main";

function scrollToSection(
	root: HTMLElement | null,
	id: string,
	behavior: ScrollBehavior = "smooth",
) {
	root?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({
		behavior,
		block: "start",
	});
}

export function Docs() {
	useDocumentTitle("Docs - Klee");
	const { hash } = useLocation();
	const content = useRef<HTMLElement>(null);
	const [activeSection, setActiveSection] = useState(sections[0].id);
	const scrollTo = (id: string) => scrollToSection(content.current, id);

	// Links such as /docs#github land on their section.
	useEffect(() => {
		if (hash) scrollToSection(content.current, hash.slice(1), "auto");
	}, [hash]);

	useEffect(() => {
		const scroller = content.current;
		if (!scroller) return;
		const targets = sections
			.map(({ id }) => document.getElementById(id))
			.filter(Boolean) as HTMLElement[];
		const onScroll = () => {
			if (
				scroller.scrollTop + scroller.clientHeight >=
				scroller.scrollHeight - 1
			) {
				setActiveSection(sections.at(-1)!.id);
				return;
			}
			const marker = scroller.scrollTop + 64;
			const active = targets
				.filter(
					(target) =>
						target.getBoundingClientRect().top -
							scroller.getBoundingClientRect().top +
							scroller.scrollTop <=
						marker,
				)
				.at(-1);
			setActiveSection(active?.id ?? sections[0].id);
		};
		scroller.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => {
			scroller.removeEventListener("scroll", onScroll);
		};
	}, []);
	return (
		<main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:h-[calc(100vh-4rem)] lg:grid-cols-[15rem_minmax(0,1fr)] lg:overflow-hidden">
			<aside className="border-b border-border px-6 py-8 lg:overflow-hidden lg:border-r lg:border-b-0">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<LibraryBig size={16} />
					Klee Docs
				</div>
				<nav aria-label="Documentation" className="mt-6 grid gap-1">
					{sections.map((section) => (
						<a
							key={section.id}
							href={`#${section.id}`}
							onClick={(event) => {
								event.preventDefault();
								window.history.replaceState(
									null,
									"",
									`#${section.id}`,
								);
								scrollTo(section.id);
							}}
							className={`-ml-3 border-l-2 px-3 py-1 text-sm transition-colors ${activeSection === section.id ? "border-brand text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
						>
							{section.label}
						</a>
					))}
				</nav>
			</aside>
			<article
				ref={content}
				className="max-w-3xl px-6 py-10 sm:px-12 sm:py-16 lg:overflow-y-auto"
			>
				<Heading level={1} className="text-4xl tracking-tight">
					Klee docs
				</Heading>
				<Paragraph className="mt-4 text-lg text-muted">
					Create artefacts, share them with your team, and connect
					GitHub, Slack, and Jira.
				</Paragraph>

				<DocsSection id="overview" title="Overview">
					<Paragraph>
						Klee builds an artefact from your prompt, links, and
						connected apps. An artefact combines blocks such as code
						diffs, Git graphs, flowcharts, checklists, and
						timelines.
					</Paragraph>
					<DocsList
						title="Terms"
						items={[
							"Artefact: a page you can edit, version, share, and comment on.",
							"Block: one section of an artefact, such as a code diff or checklist.",
							"Organisation: a group of Klee accounts that share access.",
							"Project: a GitHub organisation. Its members can edit the artefacts it owns.",
						]}
					/>
				</DocsSection>

				<DocsSection id="start" title="Create and edit">
					<ol className="list-decimal space-y-2 pl-5">
						<li>
							Describe the page you need. Paste pull request,
							issue, or web links for source context.
						</li>
						<li>
							Review the generated blocks as Klee builds the
							artefact.
						</li>
						<li>
							Enter a follow-up prompt in the bar at the bottom of
							the artefact. Klee highlights each changed block.
						</li>
						<li>
							Press Edit to change text by hand, then press Save.
						</li>
						<li>Open History and select a version to review it.</li>
					</ol>
				</DocsSection>

				<DocsSection id="blocks" title="Blocks">
					<DocsList
						title="For engineering work"
						items={[
							"Code diff: changed lines for one file.",
							"Git graph: branches, merges, and commits. Klee uses a commit list when source commits lack parent SHAs.",
							"Checklist: CI checks. Klee refreshes checks linked to GitHub runs while you keep the page open.",
							"Flowchart: steps and decisions from top to bottom.",
							"Dependency graph: packages, modules, services, versions, and health.",
							"Software diagram and change-impact map: components and their dependencies.",
							"Release timeline, incident timeline, sprint timeline, and work item board.",
						]}
					/>
					<DocsList
						title="For anything"
						items={[
							"Prose, metric row, decision record, evidence table, activity trend, and handoff brief.",
							"Next steps: link buttons open a linked page; prompt buttons remain with the artefact owner.",
						]}
					/>
					<Paragraph>
						Click a linked diagram node to open its source, such as
						a repository or service page.
					</Paragraph>
				</DocsSection>

				<DocsSection id="sharing" title="Sharing and comments">
					<Paragraph>
						Press Share on an artefact you own to grant access.
					</Paragraph>
					<DocsList
						title="Share options"
						items={[
							"Invite people: enter a Klee account email and choose view, comment, or edit.",
							"Organisation: grant each organisation member the access level you choose.",
							"Anyone with the link: grant public, view-only access.",
							"Stop sharing: remove invitations and organisation access, then turn off the link.",
						]}
					/>
					<Paragraph>
						Press Comments, then drag across text to add a comment.
						Press Comments again to leave comment mode.
					</Paragraph>
				</DocsSection>

				<DocsSection id="github" title="GitHub">
					<Paragraph>
						Open Integrations in your workspace and connect GitHub.
						Install the Klee GitHub App on the repositories you
						choose.
					</Paragraph>
					<DocsList
						title="App permissions"
						items={[
							"Pull requests, read: metadata, files, reviews, and commits.",
							"Checks, read: CI status for live check blocks.",
							"Issues, read and write: the artefact link and its updates.",
						]}
					/>
					<Paragraph>
						Add this job to your existing pull-request workflow.
						Replace the names in <code>needs</code> with every test,
						lint, and build job that should finish before Klee runs.
					</Paragraph>
					<pre className="overflow-x-auto rounded-xl border border-border bg-surface-secondary p-4 font-mono text-sm leading-6 text-foreground">
						<code>{`name: Klee

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  id-token: write

jobs:
  klee:
    # Replace these with the CI jobs in this workflow.
    needs: [test, lint, build]
    if: always()
    uses: saasathon-2/integrations/.github/workflows/klee.yml@main
    with:
      api-url: https://<api-domain>
      pull-request: \${{ github.event.pull_request.number }}`}</code>
					</pre>
					<Link
						href={`${integrationsSource}/github`}
						target="_blank"
						className="inline-flex items-center gap-1 text-sm"
					>
						GitHub Action source <ExternalLink size={14} />
					</Link>
				</DocsSection>

				<DocsSection id="slack-jira" title="Slack and Jira">
					<DocsList
						title={
							<div className="flex flex-row items-center gap-2">
								<SlackIcon size={16} />
								Slack
							</div>
						}
						items={[
							"Install the Klee app from Integrations.",
							"Paste a shared artefact link in a channel to show a preview.",
							"Run /klee with an artefact link or ID to post a preview.",
						]}
					/>
					<DocsList
						title={
							<div className="flex flex-row items-center gap-2">
								<JiraIcon size={16} />
								Jira
							</div>
						}
						items={[
							"Install the Klee app from the Atlassian Marketplace.",
							"Paste a shared artefact link in an issue description or comment.",
							"Open the Klee panel in the issue to view the artefact.",
						]}
					/>
					<div className="flex gap-4 text-sm">
						<Link
							href={`${integrationsSource}/slack`}
							target="_blank"
							className="inline-flex items-center gap-1"
						>
							Slack app source <ExternalLink size={14} />
						</Link>
						<Link
							href={`${integrationsSource}/jira`}
							target="_blank"
							className="inline-flex items-center gap-1"
						>
							Jira app source <ExternalLink size={14} />
						</Link>
					</div>
				</DocsSection>

				<DocsSection id="help" title="Troubleshooting">
					<DocsList
						title="A pull request page didn't update"
						items={[
							"Add id-token: write to the workflow permissions.",
							"Install the GitHub App on the repository and subscribe it to check run events.",
							"Set api-url to the API address without a trailing slash.",
						]}
					/>
					<DocsList
						title="A check isn't showing live status"
						items={[
							"Link the check to a GitHub run or Actions job.",
							"Install the GitHub App on the artefact owner's repository account.",
						]}
					/>
					<Paragraph>
						Anyone with a public link can view the artefact. Turn
						off link sharing after you finish.
					</Paragraph>
				</DocsSection>
			</article>
		</main>
	);
}

function DocsSection({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			className="mt-12 scroll-mt-24 border-t border-border pt-10"
		>
			<Heading level={2} className="text-2xl">
				{title}
			</Heading>
			<div className="mt-5 space-y-4 leading-7 text-muted">
				{children}
			</div>
		</section>
	);
}

function DocsList({ title, items }: { title: ReactNode; items: string[] }) {
	return (
		<div className="rounded-lg border border-border bg-surface p-5">
			<p className="font-semibold text-foreground">{title}</p>
			<Separator className="my-3" />
			<ul className="space-y-2 text-sm">
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}
