import { Button, Modal } from "@heroui/react";
import { GitPullRequest, MessageSquare, PlugZap, SquareKanban, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type GitHubInstallation = {
	installationId: string;
	accountLogin: string;
	accountType: string;
};

const slackInstallUrl = import.meta.env.VITE_SLACK_INSTALL_URL || "https://slack.com/apps";
const jiraInstallUrl = import.meta.env.VITE_JIRA_INSTALL_URL || "https://marketplace.atlassian.com/";

function IntegrationRow({ icon, name, summary, action, children }: {
	icon: ReactNode;
	name: string;
	summary: string;
	action: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-divider bg-surface-secondary p-4">
			<div className="flex items-center gap-3">
				<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface">{icon}</div>
				<div className="min-w-0 flex-1"><p className="font-medium">{name}</p><p className="text-sm text-muted">{summary}</p></div>
				{action}
			</div>
			<details className="mt-3 border-t border-divider pt-3 text-sm text-muted">
				<summary className="cursor-pointer font-medium text-foreground">Show setup</summary>
				<div className="pt-3 leading-5">{children}</div>
			</details>
		</div>
	);
}

export function IntegrationsModal({ onClose }: { onClose: () => void }) {
	const [installations, setInstallations] = useState<GitHubInstallation[]>();
	const [revoking, setRevoking] = useState<string>();

	useEffect(() => {
		fetch("/api/integrations/github", { credentials: "include" })
			.then((response) => (response.ok ? response.json() : []))
			.then(setInstallations)
			.catch(() => setInstallations([]));
	}, []);

	async function revokeGitHub(installationId: string) {
		setRevoking(installationId);
		const response = await fetch(`/api/integrations/github/${installationId}`, { method: "DELETE", credentials: "include" });
		if (response.ok) setInstallations((apps) => apps?.filter((app) => app.installationId !== installationId));
		setRevoking(undefined);
	}

	const connectGitHub = () => window.location.assign("/api/integrations/github/install");
	const gitHubAction = installations === undefined ? null : installations.length ? (
		<div className="flex flex-wrap justify-end gap-1">
			{installations.map((installation) => <Button key={installation.installationId} size="sm" variant="ghost" className="text-danger" isPending={revoking === installation.installationId} onPress={() => revokeGitHub(installation.installationId)}>Revoke</Button>)}
		</div>
	) : <Button size="sm" onPress={connectGitHub}>Connect</Button>;

	return (
		<Modal>
			<Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()} variant="blur">
				<Modal.Container placement="center" scroll="inside" size="md">
					<Modal.Dialog aria-label="Apps and integrations" className="max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl p-0">
						<Modal.Header className="flex-row items-start gap-4 border-b border-divider px-6 py-5">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><PlugZap size={20} /></div>
							<div className="min-w-0 flex-1"><Modal.Heading>Apps & integrations</Modal.Heading><p className="mt-1 text-sm leading-5 text-muted">Connect Klee to the tools your team already uses.</p></div>
							<Button aria-label="Close apps and integrations" variant="ghost" className="size-8 min-w-8 p-0" onPress={onClose}><X size={18} /></Button>
						</Modal.Header>
						<Modal.Body className="m-0 space-y-3 p-6">
							<IntegrationRow icon={<GitPullRequest size={20} />} name="GitHub" summary={installations?.length ? `Connected as ${installations.map((app) => app.accountLogin).join(", ")}` : "Generate an artefact for every pull request."} action={gitHubAction}>
								<ul className="list-disc space-y-1 pl-4"><li>Choose repositories for the Klee app.</li><li>Add the Klee GitHub Actions workflow to each repository.</li><li>Open or update a pull request to generate its artefact.</li></ul>
							</IntegrationRow>
							<IntegrationRow icon={<MessageSquare size={20} />} name="Slack" summary="Preview artefacts in channels and threads." action={<Button size="sm" variant="secondary" onPress={() => window.open(slackInstallUrl, "_blank", "noopener,noreferrer")}>Install</Button>}>
								<p>Install the Klee Slack app for your workspace, then paste a shared artefact link or use <code>/artefact &lt;link or ID&gt;</code>.</p>
							</IntegrationRow>
							<IntegrationRow icon={<SquareKanban size={20} />} name="Jira" summary="Show linked artefacts on Jira issues." action={<Button size="sm" variant="secondary" onPress={() => window.open(jiraInstallUrl, "_blank", "noopener,noreferrer")}>Install</Button>}>
								<p>Install the Klee Jira app, then paste a shared artefact link into an issue description or comment to see it in the Klee panel.</p>
							</IntegrationRow>
						</Modal.Body>
						<Modal.Footer className="m-0 border-t border-divider px-6 py-4"><span className="text-xs text-muted">You can revoke GitHub access at any time.</span></Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
