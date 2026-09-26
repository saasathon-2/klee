import {
	Alert,
	Button,
	Card,
	Chip,
	Code,
	Disclosure,
	Modal,
	Paragraph,
	Separator,
	Skeleton,
} from "@heroui/react";
import { ExternalLink, FileText, Plus, PlugZap } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { GitHubIcon, JiraIcon, SlackIcon } from "../components/BrandIcons";
import { authErrorMessage, linkGoogleDrive } from "../lib/auth-client";
import { GitHubAccountLink } from "./artefact/GitHubAccountLink";

type GitHubInstallation = {
	installationId: string;
	accountLogin: string;
	accountType: string;
};

export type GoogleFile = { id: string; name: string };
type PickerDoc = { id: string; name?: string };
type PickerData = { action: string; docs?: PickerDoc[] };
type PickerBuilder = {
	addView(view: string): PickerBuilder;
	enableFeature(feature: string): PickerBuilder;
	setMaxItems(count: number): PickerBuilder;
	setOAuthToken(token: string): PickerBuilder;
	setDeveloperKey(key: string): PickerBuilder;
	setAppId(id: string): PickerBuilder;
	setCallback(callback: (data: PickerData) => void): PickerBuilder;
	build(): { setVisible(visible: boolean): void };
};

declare global {
	interface Window {
		gapi?: { load(name: string, callback: () => void): void };
		google?: {
			picker: {
				PickerBuilder: new () => PickerBuilder;
				ViewId: { DOCUMENTS: string; SPREADSHEETS: string };
				Feature: { MULTISELECT_ENABLED: string };
				Action: { PICKED: string };
			};
		};
	}
}

const slackInstallUrl =
	import.meta.env.VITE_SLACK_INSTALL_URL || "https://slack.com/apps";
const jiraInstallUrl =
	import.meta.env.VITE_JIRA_INSTALL_URL ||
	"https://marketplace.atlassian.com/";
const openExternal = (url: string) =>
	window.open(url, "_blank", "noopener,noreferrer");

function IntegrationCard({
	icon,
	name,
	summary,
	status,
	action,
	setup,
	children,
}: {
	icon: ReactNode;
	name: string;
	summary: string;
	status?: ReactNode;
	action?: ReactNode;
	/** Numbered setup steps, shown behind a disclosure. */
	setup: ReactNode[];
	children?: ReactNode;
}) {
	return (
		<Card variant="secondary" className="gap-0 p-0">
			<div className="flex items-center gap-3 p-4">
				<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface">
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<Paragraph weight="medium">{name}</Paragraph>
						{status}
					</div>
					<Paragraph size="sm" color="muted">
						{summary}
					</Paragraph>
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>
			{children && (
				<>
					<Separator />
					<div className="px-4 py-3">{children}</div>
				</>
			)}
			<Separator />
			<Disclosure className="px-4">
				<Disclosure.Heading>
					<Disclosure.Trigger className="flex w-full items-center justify-between py-3 text-sm font-medium">
						How to set up
						<Disclosure.Indicator />
					</Disclosure.Trigger>
				</Disclosure.Heading>
				<Disclosure.Content>
					<Disclosure.Body className="pb-4">
						<ol className="flex flex-col gap-2">
							{setup.map((step, index) => (
								<li key={index} className="flex gap-3 text-sm">
									<span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface text-xs font-medium tabular-nums">
										{index + 1}
									</span>
									<span className="text-muted">{step}</span>
								</li>
							))}
						</ol>
					</Disclosure.Body>
				</Disclosure.Content>
			</Disclosure>
		</Card>
	);
}

function InstallationRow({
	installation,
	isRevoking,
	onRevoke,
}: {
	installation: GitHubInstallation;
	isRevoking: boolean;
	onRevoke: () => void;
}) {
	const [isConfirming, setIsConfirming] = useState(false);
	return (
		<div className="flex items-center gap-3 py-2">
			<div className="min-w-0 flex-1">
				<Paragraph size="sm" weight="medium" className="truncate">
					{installation.accountLogin}
				</Paragraph>
				<Paragraph size="xs" color="muted">
					{installation.accountType === "Organization"
						? "Organisation"
						: "Personal account"}
				</Paragraph>
			</div>
			{isConfirming ? (
				<div className="flex gap-1">
					<Button
						size="sm"
						variant="ghost"
						onPress={() => setIsConfirming(false)}
					>
						Keep
					</Button>
					<Button
						size="sm"
						variant="danger"
						isPending={isRevoking}
						onPress={onRevoke}
						aria-label={`Revoke access for ${installation.accountLogin}`}
					>
						Revoke
					</Button>
				</div>
			) : (
				<Button
					size="sm"
					variant="ghost"
					onPress={() => setIsConfirming(true)}
					aria-label={`Revoke access for ${installation.accountLogin}`}
				>
					Revoke
				</Button>
			)}
		</div>
	);
}

export function IntegrationsModal({
	onClose,
	onGoogleFilesSelected,
}: {
	onClose: () => void;
	onGoogleFilesSelected: (files: GoogleFile[]) => void;
}) {
	const [searchParams] = useSearchParams();
	const [installations, setInstallations] = useState<GitHubInstallation[]>();
	const [revoking, setRevoking] = useState<string>();
	const [error, setError] = useState("");
	const [googleConnected, setGoogleConnected] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(true);
	const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState(false);

	useEffect(() => {
		fetch("/api/integrations/github", { credentials: "include" })
			.then((response) => {
				if (!response.ok) throw new Error();
				return response.json() as Promise<GitHubInstallation[]>;
			})
			.then(setInstallations)
			.catch(() => {
				setInstallations([]);
				setError(
					"Couldn't load your GitHub connection. Refresh to try again.",
				);
			});
		fetch("/api/integrations/google", { credentials: "include" })
			.then((response) =>
				response.ok
					? response.json()
					: { connected: false },
			)
			.then((data: { connected: boolean }) => {
				setGoogleConnected(data.connected);
			})
			.catch(() => setError("Couldn't load your Google connection."))
			.finally(() => setGoogleLoading(false));
		fetch("/api/auth-providers")
			.then((response) =>
				response.ok ? response.json() : { google: false },
			)
			.then((providers: { google: boolean }) =>
				setGoogleOAuthConfigured(providers.google),
			)
			.catch(() => setGoogleOAuthConfigured(false));
	}, []);

	useEffect(() => {
		const oauthError = searchParams.get("error");
		if (oauthError) setError(authErrorMessage(oauthError));
	}, [searchParams]);

	async function revokeGitHub(installationId: string) {
		setRevoking(installationId);
		setError("");
		const response = await fetch(
			`/api/integrations/github/${installationId}`,
			{
				method: "DELETE",
				credentials: "include",
			},
		).catch(() => undefined);
		if (response?.ok)
			setInstallations((apps) =>
				apps?.filter((app) => app.installationId !== installationId),
			);
		else setError("Couldn't revoke GitHub access. Try again.");
		setRevoking(undefined);
	}

	const connectGitHub = () =>
		window.location.assign("/api/integrations/github/install");
	const isConnected = Boolean(installations?.length);

	async function connectGoogle() {
		setError("");
		const { error: linkError } = await linkGoogleDrive(
			"/integrations?google=connected",
		);
		if (linkError)
			setError(linkError.message ?? "Couldn't connect Google.");
	}

	async function selectGoogleFiles() {
		setError("");
		const apiKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY;
		const appId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_NUMBER;
		if (!apiKey || !appId) {
			setError("Google Picker is not configured yet.");
			return;
		}
		try {
			const tokenResponse = await fetch(
				"/api/integrations/google/access-token",
				{ credentials: "include" },
			);
			if (!tokenResponse.ok)
				throw new Error("Reconnect Google Docs to continue.");
			const { accessToken } = (await tokenResponse.json()) as {
				accessToken: string;
			};
			if (!window.gapi) {
				await new Promise<void>((resolve, reject) => {
					const script = document.createElement("script");
					script.src = "https://apis.google.com/js/api.js";
					script.onload = () => resolve();
					script.onerror = () =>
						reject(new Error("Couldn't load Google Picker."));
					document.head.append(script);
				});
			}
			await new Promise<void>((resolve) =>
				window.gapi!.load("picker", resolve),
			);
			const picker = new window.google!.picker.PickerBuilder()
				.addView(window.google!.picker.ViewId.DOCUMENTS)
				.addView(window.google!.picker.ViewId.SPREADSHEETS)
				.enableFeature(window.google!.picker.Feature.MULTISELECT_ENABLED)
				.setMaxItems(5)
				.setOAuthToken(accessToken)
				.setDeveloperKey(apiKey)
				.setAppId(appId)
				.setCallback(async (data) => {
					if (
						data.action !== window.google!.picker.Action.PICKED ||
						!data.docs?.length
					)
						return;
					onGoogleFilesSelected(
						data.docs.map((doc) => ({
							id: doc.id,
							name: doc.name ?? "Google file",
						})),
					);
				})
				.build();
			picker.setVisible(true);
			onClose();
		} catch (pickerError) {
			setError(
				pickerError instanceof Error
					? pickerError.message
					: "Couldn't open Google Picker.",
			);
		}
	}

	return (
		<Modal>
			<Modal.Backdrop
				isOpen
				onOpenChange={(open) => !open && onClose()}
				variant="blur"
			>
				<Modal.Container placement="center" scroll="inside" size="md">
					<Modal.Dialog aria-label="Apps and integrations">
						<Modal.CloseTrigger aria-label="Close apps and integrations" />
						<Modal.Header className="flex-row items-center gap-3">
							<Modal.Icon className="bg-accent text-accent-foreground">
								<PlugZap size={20} />
							</Modal.Icon>
							<div className="min-w-0">
								<Modal.Heading>
									Apps & integrations
								</Modal.Heading>
								<Paragraph size="sm" color="muted">
									Bring context in from the tools your team
									already uses.
								</Paragraph>
							</div>
						</Modal.Header>
						<Modal.Body className="flex flex-col gap-3">
							{error && (
								<Alert status="danger">
									<Alert.Indicator />
									<Alert.Content>
										<Alert.Description>
											{error}
										</Alert.Description>
									</Alert.Content>
								</Alert>
							)}
							<IntegrationCard
								icon={<FileText size={20} />}
								name="Google Docs & Sheets"
								summary={
									googleConnected
										? "Add context to your next artefact."
										: "Use selected development notes to explain code changes."
								}
								status={
									googleLoading ? (
										<Skeleton
											animationType="pulse"
											className="h-5 w-16 rounded"
										/>
									) : googleConnected ? (
										<Chip size="sm" color="success">
											Connected
										</Chip>
									) : null
								}
								action={
									googleLoading || !googleOAuthConfigured ? null : googleConnected ? (
										<Button
											size="sm"
											variant="secondary"
											onPress={() => void selectGoogleFiles()}
										>
											Select files
										</Button>
									) : (
										<Button size="sm" onPress={() => void connectGoogle()}>
											Connect
										</Button>
									)
								}
								setup={[
									"Connect the Google account that owns your development notes.",
									"Choose up to five Google Docs or Sheets for your next artefact.",
									"Klee reads those files only while generating that artefact.",
								]}
							>
								<Paragraph size="sm" color="muted">
									Select up to five Docs or Sheets. Klee uses them for the next
									artefact only, then discards the selection.
								</Paragraph>
								{!googleLoading && !googleOAuthConfigured && (
									<Paragraph size="sm" color="muted" className="mt-2">
										Google OAuth isn’t configured. Set GOOGLE_CLIENT_ID and
										GOOGLE_CLIENT_SECRET on the API service, then reload
										Integrations.
									</Paragraph>
								)}
							</IntegrationCard>
							<IntegrationCard
								icon={<GitHubIcon size={20} />}
								name="GitHub"
								summary="Generate an artefact for every pull request."
								status={
									installations === undefined ? (
										<Skeleton
											animationType="pulse"
											className="h-5 w-16 rounded"
										/>
									) : isConnected ? (
										<Chip size="sm" color="success">
											Connected
										</Chip>
									) : null
								}
								action={
									installations ===
									undefined ? null : isConnected ? (
										<Button
											size="sm"
											variant="secondary"
											onPress={connectGitHub}
										>
											<Plus size={14} />
											Add account
										</Button>
									) : (
										<Button
											size="sm"
											onPress={connectGitHub}
										>
											Connect
										</Button>
									)
								}
								setup={[
									"Connect GitHub and choose the repositories Klee can read.",
									"Add the Klee GitHub Actions workflow to each repository.",
									"Open or update a pull request; Klee comments with its artefact.",
								]}
							>
								{isConnected && (
									<>
										<div className="-my-2">
											{installations!.map(
												(installation, index) => (
													<Fragment
														key={
															installation.installationId
														}
													>
														{index > 0 && (
															<Separator />
														)}
														<InstallationRow
															installation={
																installation
															}
															isRevoking={
																revoking ===
																installation.installationId
															}
															onRevoke={() =>
																void revokeGitHub(
																	installation.installationId,
																)
															}
														/>
													</Fragment>
												),
											)}
										</div>
										<div className="mt-3 border-t border-separator pt-1">
											<GitHubAccountLink />
										</div>
									</>
								)}
							</IntegrationCard>
							<IntegrationCard
								icon={<SlackIcon size={20} />}
								name="Slack"
								summary="Preview artefacts in channels and threads."
								action={
									<Button
										size="sm"
										variant="secondary"
										onPress={() =>
											openExternal(slackInstallUrl)
										}
									>
										Install
										<ExternalLink size={14} />
									</Button>
								}
								setup={[
									"Install the Klee app to your Slack workspace.",
									"Paste a shared artefact link to unfurl a preview.",
									<>
										Or run{" "}
										<Code className="text-xs">
											/artefact &lt;link or ID&gt;
										</Code>{" "}
										in any channel.
									</>,
								]}
							/>
							<IntegrationCard
								icon={<JiraIcon size={20} />}
								name="Jira"
								summary="Show linked artefacts on Jira issues."
								action={
									<Button
										size="sm"
										variant="secondary"
										onPress={() =>
											openExternal(jiraInstallUrl)
										}
									>
										Install
										<ExternalLink size={14} />
									</Button>
								}
								setup={[
									"Install the Klee app from the Atlassian Marketplace.",
									"Paste a shared artefact link into an issue description or comment.",
									"Open the Klee panel on the issue to see the artefact.",
								]}
							/>
						</Modal.Body>
						<Modal.Footer>
							<Paragraph
								size="xs"
								color="muted"
								className="mr-auto"
							>
								You can revoke GitHub access at any time.
							</Paragraph>
							<Button variant="secondary" onPress={onClose}>
								Done
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
