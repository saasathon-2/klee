import { Button, Chip, Heading, Link, Paragraph, Separator } from "@heroui/react";
import { BookOpen, ChevronRight, ExternalLink, GitPullRequest, Plug, Share2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
	{ id: "overview", label: "Overview", items: ["What is Klee?", "Core concepts"] },
	{ id: "start", label: "Get started", items: ["Create an artefact", "Share an artefact"] },
	{ id: "github", label: "GitHub", items: ["Connect GitHub", "Pull request artefacts", "CI updates"] },
	{ id: "help", label: "Help", items: ["Troubleshooting", "Security"] },
];

export function Docs() {
	const navigate = useNavigate();
	return (
		<main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
			<aside className="border-b border-divider px-6 py-8 lg:border-r lg:border-b-0">
				<div className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} />Documentation</div>
				<nav aria-label="Documentation" className="mt-6 grid gap-6">
					{sections.map((section) => <div key={section.id}>
						<p className="text-xs font-semibold uppercase tracking-wider text-muted">{section.label}</p>
						<div className="mt-2 grid gap-1">{section.items.map((item) => <a key={item} href={`#${section.id}`} className="rounded px-2 py-1 text-sm text-muted hover:bg-default hover:text-foreground">{item}</a>)}</div>
					</div>)}
				</nav>
			</aside>
			<article className="max-w-3xl px-6 py-10 sm:px-12 sm:py-16">
				<div className="flex items-center gap-2"><Chip size="sm">Docs</Chip><span className="text-sm text-muted">Klee documentation</span></div>
				<Heading level={1} className="mt-5 text-4xl tracking-tight sm:text-5xl">Build a shared understanding of your work.</Heading>
				<Paragraph className="mt-5 max-w-2xl text-lg text-muted">Klee turns engineering context into clear, shareable artefacts: decisions, pull-request briefs, architecture views, and implementation plans.</Paragraph>
				<div className="mt-8 flex flex-wrap gap-3"><Button onPress={() => navigate("/")}>Open Klee <ChevronRight size={16} /></Button><Button variant="secondary" onPress={() => document.getElementById("github")?.scrollIntoView({ behavior: "smooth" })}>GitHub setup</Button></div>

				<DocsSection id="overview" icon={<Sparkles size={19} />} title="What is Klee?">
					<Paragraph>Klee turns a prompt or connected pull request into a structured artefact. Artefacts are private by default and can include code diffs, review feedback, commits, CI status, and architecture flow.</Paragraph>
					<DocsCard title="Core concepts" items={["Artefact — a generated, editable document for a decision or change.", "Template — a purposeful visual block such as a diff, check list, or review summary.", "Share link — a read-only URL you explicitly enable for an artefact."]} />
				</DocsSection>

				<DocsSection id="start" icon={<Share2 size={19} />} title="Create and share an artefact">
					<ol className="list-decimal space-y-3 pl-5 text-muted"><li>Describe the outcome you need, or connect GitHub and open a pull request.</li><li>Review the generated artefact and add any follow-up context.</li><li>Use Share to create a read-only link for collaborators.</li></ol>
					<blockquote className="mt-6 border-l-2 border-brand pl-4 text-sm text-muted">Sharing is opt-in. Creating an artefact does not make it public.</blockquote>
				</DocsSection>

				<DocsSection id="github" icon={<GitPullRequest size={19} />} title="GitHub pull-request artefacts">
					<Paragraph>Install the Klee GitHub App from your profile, then grant it access to the repositories you want Klee to read. Klee fetches the pull request, important file changes, reviews, commits, and check runs to generate a focused brief.</Paragraph>
					<DocsCard title="GitHub App permissions" items={["Pull requests: Read-only — PR metadata, files, reviews, and commits.", "Checks: Read-only — CI check status and pipeline links.", "Issues: Read and write — Klee posts and refreshes the PR artefact comment."]} />
					<DocsCard title="CI updates" items={["Add the Klee GitHub Action to a pull-request workflow.", "Klee refreshes the linked artefact when PR CI completes.", "Enable the Check run webhook for individual check-run updates."]} />
					<Link href="https://github.com/saasathon-2/integrations/tree/main/github" target="_blank" className="mt-6 inline-flex items-center gap-1 text-sm">View the GitHub Action setup <ExternalLink size={14} /></Link>
				</DocsSection>

				<DocsSection id="help" icon={<Plug size={19} />} title="Troubleshooting and security">
					<DocsCard title="A pull request did not update" items={["Confirm the GitHub Action has id-token: write permission.", "Confirm the GitHub App is installed for the repository and subscribed to Check run events.", "Check that the app API URL and GitHub App credentials are configured in deployment."]} />
					<Paragraph className="mt-6">Klee validates GitHub Action identity tokens before accepting a request. Treat share URLs as public to anyone who receives them, and revoke sharing when access is no longer needed.</Paragraph>
				</DocsSection>
			</article>
		</main>
	);
}

function DocsSection({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
	return <section id={id} className="scroll-mt-24 border-t border-divider pt-10 mt-12"><Heading level={2} className="flex items-center gap-2 text-2xl">{icon}{title}</Heading><div className="mt-5 space-y-4 leading-7 text-muted">{children}</div></section>;
}

function DocsCard({ title, items }: { title: string; items: string[] }) {
	return <div className="rounded-lg border border-divider bg-surface p-5"><p className="font-semibold text-foreground">{title}</p><Separator className="my-3" /><ul className="space-y-2 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
