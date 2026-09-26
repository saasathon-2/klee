import {
	Alert,
	Button,
	Card,
	Chip,
	Link,
	Modal,
	Paragraph,
	Skeleton,
} from "@heroui/react";
import { ExternalLink, FileText, PlugZap } from "lucide-react";
import { useEffect, useState } from "react";
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
	connected = false,
}: {
	icon: ReactNode;
	name: string;
	summary: string;
	status?: ReactNode;
	action?: ReactNode;
	connected?: boolean;
}) {
	return (
		<Card variant="secondary" className="h-full gap-0 p-0">
			<div className="flex h-full flex-col items-start p-4">
				<div
					className={`grid size-10 shrink-0 place-items-center rounded-lg ${connected ? "bg-success-soft text-success" : "bg-surface"}`}
				>
					{icon}
				</div>
				<div className="mt-4 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<Paragraph weight="medium">{name}</Paragraph>
						{status}
					</div>
					<Paragraph size="sm" color="muted">
						{summary}
					</Paragraph>
				</div>
				{action && <div className="mt-auto w-full pt-5">{action}</div>}
			</div>
		</Card>
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
	const [disconnecting, setDisconnecting] = useState<"github" | "google">();
	const [error, setError] = useState("");
	const [googleConnected, setGoogleConnected] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(true);
	const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState(false);
	const isSelectingGoogleFiles = searchParams.get("select") === "google";

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
				response.ok ? response.json() : { connected: false },
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

	async function disconnectGitHub() {
		if (!installations?.length) return;
		setDisconnecting("github");
		setError("");
		const disconnected = await Promise.all(
			installations.map(async (installation) => {
				const response = await fetch(
					`/api/integrations/github/${installation.installationId}`,
					{ method: "DELETE", credentials: "include" },
				).catch(() => undefined);
				return response?.ok;
			}),
		);
		setInstallations((apps) =>
			apps?.filter((_, index) => !disconnected[index]),
		);
		if (disconnected.some((result) => !result))
			setError("Couldn't disconnect all GitHub accounts. Try again.");
		setDisconnecting(undefined);
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

	async function disconnectGoogle() {
		setDisconnecting("google");
		setError("");
		const response = await fetch("/api/integrations/google", {
			method: "DELETE",
			credentials: "include",
		}).catch(() => undefined);
		if (response?.ok) setGoogleConnected(false);
		else setError("Couldn't disconnect Google. Try again.");
		setDisconnecting(undefined);
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
				.enableFeature(
					window.google!.picker.Feature.MULTISELECT_ENABLED,
				)
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
				<Modal.Container placement="center" scroll="inside" size="lg">
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
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
									connected={googleConnected}
									action={
										googleLoading ||
										!googleOAuthConfigured ? null : googleConnected ? (
											isSelectingGoogleFiles ? (
												<Button
													fullWidth
													onPress={() =>
														void selectGoogleFiles()
													}
												>
													Select files
												</Button>
											) : (
												<Button
													fullWidth
													variant="danger"
													isPending={
														disconnecting ===
														"google"
													}
													onPress={() =>
														void disconnectGoogle()
													}
												>
													Disconnect app
												</Button>
											)
										) : (
											<Button
												fullWidth
												onPress={() =>
													void connectGoogle()
												}
											>
												Connect app
											</Button>
										)
									}
								/>
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
									connected={isConnected}
									action={
										installations ===
										undefined ? null : isConnected ? (
											<Button
												fullWidth
												variant="danger"
												isPending={
													disconnecting === "github"
												}
												onPress={() =>
													void disconnectGitHub()
												}
											>
												Disconnect app
											</Button>
										) : (
											<Button
												fullWidth
												onPress={connectGitHub}
											>
												Connect app
											</Button>
										)
									}
								/>
								<IntegrationCard
									icon={<SlackIcon size={20} />}
									name="Slack"
									summary="Preview artefacts in channels and threads."
									action={
										<Button
											fullWidth
											onPress={() =>
												openExternal(slackInstallUrl)
											}
										>
											Connect app
											<ExternalLink size={14} />
										</Button>
									}
								/>
								<IntegrationCard
									icon={<JiraIcon size={20} />}
									name="Jira"
									summary="Show linked artefacts on Jira issues."
									action={
										<Button
											fullWidth
											onPress={() =>
												openExternal(jiraInstallUrl)
											}
										>
											Connect app
											<ExternalLink size={14} />
										</Button>
									}
								/>
							</div>
							{isConnected && (
								<div className="rounded-xl border border-border px-4 py-1">
									<GitHubAccountLink />
								</div>
							)}
							<Paragraph
								size="sm"
								color="muted"
								className="px-1 pt-1"
							>
								Need help connecting an app?{" "}
								<Link href="/docs" onPress={onClose}>
									See the docs for additional help.
								</Link>
							</Paragraph>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
