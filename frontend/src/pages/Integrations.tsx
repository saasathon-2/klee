import {
	Button,
	Card,
	Chip,
	Code,
	Heading,
	Paragraph,
	Separator,
	Surface,
} from "@heroui/react";
import { GitPullRequest, MessageSquare, SquareKanban } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type GitHubInstallation = {
	installationId: string;
	accountLogin: string;
	accountType: string;
};

const apiUrl = import.meta.env.VITE_API_URL || "https://<api-domain>";

const workflow = `name: klee

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
					<Card.Title className="text-base font-semibold">
						{name}
					</Card.Title>
					<Card.Description>{summary}</Card.Description>
				</div>
				{status}
			</Card.Header>
			<Card.Content className="gap-4">
				<Separator />
				<div className="grid gap-6 sm:grid-cols-2">
					<div>
						<Paragraph size="xs" color="muted" weight="medium">
							What it does
						</Paragraph>
						<ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-6">
							{features.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>
					</div>
					<div>
						<Paragraph size="xs" color="muted" weight="medium">
							Set up
						</Paragraph>
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
				Bring artefacts to where your team already works. Each
				integration uses shared artefact links, so only artefacts you
				have shared are visible outside Klee.
			</Paragraph>
			<div className="mt-6 space-y-4">
				<IntegrationCard
					icon={<GitPullRequest size={20} />}
					name="GitHub"
					summary="Generate an artefact for every pull request."
					status={
						installations ===
						undefined ? null : installations.length ? (
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
							Connect GitHub and choose which repositories the
							Klee App can access.
						</>,
						<>
							Add the workflow below to{" "}
							<Code className="text-xs">
								.github/workflows/klee.yml
							</Code>{" "}
							in each repository.
						</>,
						<>
							Open or update a pull request to generate its
							artefact.
						</>,
					]}
				>
					<Surface
						variant="secondary"
						className="overflow-x-auto rounded-xl p-4"
					>
						<Code className="block bg-transparent p-0 text-xs leading-5 whitespace-pre">
							{workflow}
						</Code>
					</Surface>
				</IntegrationCard>

				<IntegrationCard
					icon={<MessageSquare size={20} />}
					name="Slack"
					summary="Preview artefacts in channels and threads."
					status={<Chip size="sm">Workspace app</Chip>}
					features={[
						"Posts a rendered artefact preview to the channel with the /artefact command.",
						"Unfurls any Klee artefact link pasted into a message into a preview.",
						"Accepts either an artefact ID or its full share link.",
					]}
					steps={[
						<>
							A workspace admin installs the Klee app from the{" "}
							<Code className="text-xs">slack</Code> folder of the
							integrations repository.
						</>,
						<>Share an artefact from Klee to get its link.</>,
						<>
							Paste the link, or run{" "}
							<Code className="text-xs">
								/artefact &lt;link or ID&gt;
							</Code>{" "}
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
						"Adds an Klee artefacts panel to every Jira issue.",
						"Embeds each artefact linked in the issue's description or comments.",
						"Reads issues with the viewer's own Jira permissions.",
					]}
					steps={[
						<>
							A Jira admin deploys and installs the Forge app from
							the <Code className="text-xs">jira/klee</Code>{" "}
							folder with{" "}
							<Code className="text-xs">forge deploy</Code> and{" "}
							<Code className="text-xs">forge install</Code>.
						</>,
						<>
							Paste a shared artefact link into an issue's
							description or a comment.
						</>,
						<>Open the Klee artefacts panel on the issue.</>,
					]}
				/>
			</div>
		</div>
	);
}
