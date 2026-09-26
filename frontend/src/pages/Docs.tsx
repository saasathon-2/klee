import { Heading, Link, Paragraph, Separator } from "@heroui/react";
import { ExternalLink, LibraryBig } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useDocumentTitle } from "../useDocumentTitle";

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
					Klee docs HELLO WORLD
				</Heading>
				<Paragraph className="mt-4 text-lg text-muted">
					How to create artefacts, share them, and connect GitHub,
					Slack, and Jira.
				</Paragraph>

				<DocsSection id="overview" title="Overview">
					<Paragraph>
						An artefact is a page built from blocks: code diffs, git
						graphs, flowcharts, checklists, timelines, and more.
						Klee picks and fills the blocks from your prompt, the
						links you paste, and your connected apps.
					</Paragraph>
					<DocsList
						title="Terms"
						items={[
							"Artefact: a generated page you can edit, version, share, and comment on.",
							"Block: one section of an artefact, such as a code diff or a check list.",
							"Organisation: a group of Klee accounts you can share with at once.",
							"Project: the GitHub org an artefact belongs to. Its members can edit it.",
						]}
					/>
				</DocsSection>

				<DocsSection id="start" title="Create and edit">
					<ol className="list-decimal space-y-2 pl-5">
						<li>
							Write what you need in the prompt. Paste links to
							pull requests, issues, or pages; they show as chips
							and are sent with the prompt.
						</li>
						<li>
							Klee streams the artefact in. Its reasoning shows
							under the loading bar.
						</li>
						<li>
							Ask for changes in the bar at the bottom of the
							artefact. Changed blocks are highlighted when the
							update lands.
						</li>
						<li>
							Press Edit to change any text by hand, then Save.
						</li>
						<li>
							History shows every version. Pick one to view it.
						</li>
					</ol>
				</DocsSection>

				<DocsSection id="blocks" title="Blocks">
					<DocsList
						title="For engineering work"
						items={[
							"Code diff: changed lines for one file.",
							"Git graph: branches, merges, and commits. Used when commits have parent SHAs; otherwise a commit list.",
							"Check list: CI checks. Checks linked to GitHub runs update live while you have the page open.",
							"Flowchart: steps and decisions, top to bottom.",
							"Dependency graph: packages, modules, and services, with versions and health.",
							"Software diagram and change impact map: components and what depends on what.",
							"Release timeline, incident timeline, sprint timeline, and work item board.",
						]}
					/>
					<DocsList
						title="For anything"
						items={[
							"Prose, metric row, decision record, evidence table, activity trend, and handoff brief.",
							"Next steps: buttons. Link buttons open the linked page for everyone; prompt buttons are only shown to the owner.",
						]}
					/>
					<Paragraph>
						Diagram nodes with a link open their source, such as a
						repository or service page, when clicked.
					</Paragraph>
				</DocsSection>

				<DocsSection id="sharing" title="Sharing and comments">
					<Paragraph>
						Artefacts are private until you share them. Press Share
						on an artefact you own.
					</Paragraph>
					<DocsList
						title="Share options"
						items={[
							"Invite people: enter the email of a Klee account and pick view, comment, or edit.",
							"Organisation: share with every member at the level you pick.",
							"Anyone with the link: turns on public, view-only access.",
							"Stop sharing: removes every invite and organisation and turns the link off.",
						]}
					/>
					<Paragraph>
						To comment, press Comments to turn on comment mode and
						drag across part of the page. Press Esc or Comments
						again to leave comment mode and select text normally.
					</Paragraph>
				</DocsSection>

				<DocsSection id="github" title="GitHub">
					<Paragraph>
						Connect GitHub from Integrations in your workspace. This
						installs the Klee GitHub App on the repositories you
						choose.
					</Paragraph>
					<Paragraph className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
						Comments on a pull-request artefact can be relayed back to
						the pull request by Klee.
					</Paragraph>
					<DocsList
						title="App permissions"
						items={[
							"Pull requests (read): metadata, files, reviews, and commits.",
							"Checks (read): CI status, including the live status shown on artefacts.",
							"Issues (read and write): Klee posts and updates the artefact comment.",
						]}
					/>
					<Paragraph>
						Add this workflow to build a page for every pull
						request:
					</Paragraph>
					<pre className="overflow-x-auto rounded-xl border border-border bg-surface-secondary p-4 font-mono text-sm leading-6 text-foreground">
						<code>{`on: pull_request

permissions:
  id-token: write

jobs:
  klee:
    runs-on: ubuntu-latest
    steps:
      - uses: saasathon-2/integrations/github@main
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
						title="Slack"
						items={[
							"Install the Klee app from Integrations.",
							"Paste a shared artefact link in a channel to unfurl a preview.",
							"Use /klee followed by an artefact link or id to post a preview.",
						]}
					/>
					<DocsList
						title="Jira"
						items={[
							"Install the Klee app from the Atlassian Marketplace.",
							"Paste a shared artefact link into an issue description or comment.",
							"Open the Klee panel on the issue to see the artefact.",
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
							"Check the workflow has id-token: write permission.",
							"Check the GitHub App is installed on the repository and subscribed to check run events.",
							"Check api-url matches the API's address exactly, without a trailing slash.",
						]}
					/>
					<DocsList
						title="A check isn't showing live status"
						items={[
							"Live status needs the check to link to a GitHub run or Actions job.",
							"The artefact owner must have the GitHub App installed on that repository's account.",
						]}
					/>
					<Paragraph>
						Anyone with a public link can view the artefact. Turn
						link sharing off when it's no longer needed.
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

function DocsList({ title, items }: { title: string; items: string[] }) {
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
