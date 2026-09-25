import { Button, Card, Chip, Heading, Paragraph, Separator } from "@heroui/react";
import { GitPullRequest, MessageSquare, SquareKanban } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type GitHubInstallation = {
	installationId: string;
	accountLogin: string;
	accountType: string;
};

const apiUrl = import.meta.env.VITE_API_URL || "https://<api-domain>";

const workflow = `name: Orcastrate

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  id-token: write

jobs:
  generate-artefact:
    runs-on: ubuntu-latest
    steps:
      - uses: saasathon-2/integrations/github@main
        with:
          api-url: ${apiUrl}
          pull-request: \${{ github.event.pull_request.number }}`;

function IntegrationCard({
	icon,
	name,
	summary,
	status,
	features,
	steps,
	children,
}: {
	icon: ReactNode;
	name: string;
	summary: string;
	status: ReactNode;
	features: string[];
	steps: ReactNode[];
	children?: ReactNode;
}) {
	return (
		<Card>
			<Card.Header className="flex-row items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<Card.Title className="text-base font-semibold">{name}</Card.Title>
					<Card.Description>{summary}</Card.Description>
				</div>
				{status}
			</Card.Header>
			<Card.Content className="gap-4">
				<Separator />
				<div className="grid gap-6 sm:grid-cols-2">
					<div>
						<p className="text-xs font-medium text-muted">What it does</p>
						<ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6">
							{features.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</div>
					<div>
						<p className="text-xs font-medium text-muted">Set up</p>
						<ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-6">
							{steps.map((step, index) => (
								<li key={index}>{step}</li>
							))}
						</ol>
					</div>
				</div>
				{children}
			</Card.Content>
		</Card>
	);
}

function InlineCode({ children }: { children: ReactNode }) {
	return (
		<code className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-xs">
			{children}
		</code>
	);
}

export function IntegrationsPanel() {
	const [installations, setInstallations] = useState<GitHubInstallation[]>();

	useEffect(() => {
		fetch("/api/integrations/github", { credentials: "include" })
			.then((response) => (response.ok ? response.json() : []))
			.then(setInstallations)
			.catch(() => setInstallations([]));
	}, []);

	const connectGitHub = () =>
		window.location.assign("/api/integrations/github/install");

	return (
		<div className="mx-auto w-full max-w-3xl px-6 pb-20 sm:px-8">
			<Heading level={2} className="sr-only">
				Integrations
			</Heading>
			<Paragraph color="muted" className="max-w-2xl">
				Bring artefacts to where your team already works. Each integration
				uses shared artefact links, so only artefacts you have shared are
				visible outside Orcastrate.
			</Paragraph>
			<div className="mt-6 space-y-4">
				<IntegrationCard
					icon={<GitPullRequest size={20} />}
					name="GitHub"
					summary="Generate an artefact for every pull request."
					status={
						installations === undefined ? null : installations.length ? (
							<Chip size="sm" color="success">
								Connected as {installations[0].accountLogin}
							</Chip>
						) : (
							<Button size="sm" onPress={connectGitHub}>
								Connect GitHub
							</Button>
						)
					}
					features={[
						"Creates an artefact from the pull request's title, description, and changed-file diffs whenever it is opened or updated.",
						"Comments a screenshot preview on the pull request that links to the shared artefact.",
						"Authenticates with GitHub's short-lived OIDC token, so there are no secrets to add to your repository.",
					]}
					steps={[
						<>
							Connect GitHub and choose which repositories the Orcastrate App can
							access.
						</>,
						<>
							Add the workflow below to{" "}
							<InlineCode>.github/workflows/orcastrate.yml</InlineCode> in each
							repository.
						</>,
						<>Open or update a pull request to generate its artefact.</>,
					]}
				>
					<pre className="overflow-x-auto rounded-xl bg-surface-secondary p-4 font-mono text-xs leading-5">
						{workflow}
					</pre>
				</IntegrationCard>

				<IntegrationCard
					icon={<MessageSquare size={20} />}
					name="Slack"
					summary="Preview artefacts in channels and threads."
					status={<Chip size="sm">Workspace app</Chip>}
					features={[
						"Posts a rendered artefact preview to the channel with the /artefact command.",
						"Unfurls any Orcastrate artefact link pasted into a message into a preview.",
						"Accepts either an artefact ID or its full share link.",
					]}
					steps={[
						<>
							A workspace admin installs the Klee app from the{" "}
							<InlineCode>slack</InlineCode> folder of the integrations
							repository.
						</>,
						<>Share an artefact from Orcastrate to get its link.</>,
						<>
							Paste the link, or run <InlineCode>/artefact &lt;link or ID&gt;</InlineCode>{" "}
							in any channel.
						</>,
					]}
				/>

				<IntegrationCard
					icon={<SquareKanban size={20} />}
					name="Jira"
					summary="Show linked artefacts on Jira issues."
					status={<Chip size="sm">Site app</Chip>}
					features={[
						"Adds an Orcastrate artefacts panel to every Jira issue.",
						"Embeds each artefact linked in the issue's description or comments.",
						"Reads issues with the viewer's own Jira permissions.",
					]}
					steps={[
						<>
							A Jira admin deploys and installs the Forge app from the{" "}
							<InlineCode>jira/klee</InlineCode> folder with{" "}
							<InlineCode>forge deploy</InlineCode> and{" "}
							<InlineCode>forge install</InlineCode>.
						</>,
						<>Paste a shared artefact link into an issue's description or a comment.</>,
						<>Open the Orcastrate artefacts panel on the issue.</>,
					]}
				/>
			</div>
		</div>
	);
}
