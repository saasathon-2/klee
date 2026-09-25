import {
	Alert,
	AlertDialog,
	Button,
	Card,
	Header,
	Input,
	Label,
	ListBox,
	Modal,
	Paragraph,
	Popover,
	Separator,
	Surface,
	TextArea,
	Toolbar,
} from "@heroui/react";
import {
	ArrowUp,
	BrainCog,
	Check,
	FileText,
	History,
	LogOut,
	Maximize2,
	Minimize2,
	PanelLeftClose,
	PanelLeftOpen,
	Pencil,
	Plug,
	Plus,
	Share2,
	UserRound,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
	Navigate,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { UserAvatar } from "../components/UserAvatar";
import { ArtefactRenderer } from "../artefacts/templates/renderer";
import {
	fallbackDocument,
	withEditedText,
	type ArtefactDocument,
} from "../artefacts/model";
import type { EditPath } from "../artefacts/templates/types";
import { developerExamplePrompts } from "../artefacts/examplePrompts";
import { ThemeToggle } from "../components/ThemeToggle";
import { IntegrationsPanel } from "./Integrations";
import { GitHubAccountLink } from "./artefact/GitHubAccountLink";
import { ProjectSelect } from "./artefact/ProjectSelect";
import { VersionHistory } from "./artefact/VersionHistory";

type Revision = {
	id: string;
	content: string;
	generatedContent?: ArtefactDocument;
	createdAt: string;
};
type Artefact = {
	id: string;
	isShared?: boolean;
	prompt: string;
	title: string;
	createdAt: string;
	content?: ArtefactDocument;
	revisions?: Revision[];
	/** Latest version number; manual saves must be based on it. */
	version?: number;
	isOwner?: boolean;
	/** GitHub org (project) whose members can view and edit this artefact. */
	project?: string | null;
	installationId?: string | null;
};

type SaveResult = "saved" | "conflict" | "failed";

function artefactHeading(artefact: Artefact) {
	if (artefact.title !== "New artefact") return artefact.title;
	return /\b(pr|pull request|github|change|architecture)\b/i.test(
		artefact.prompt,
	)
		? "Change brief"
		: "Working brief";
}

const godPrompt = developerExamplePrompts.find(
	(template) => template.id === "god-prompt",
);

const api = (path: string, options?: RequestInit) =>
	fetch(`/api${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...options?.headers },
		...options,
	});

export function Artefacts() {
	const navigate = useNavigate();
	const location = useLocation();
	const { id: routeId, shareId } = useParams();
	const [searchParams] = useSearchParams();
	const id = routeId ?? searchParams.get("artefact") ?? undefined;
	const { data: session, isPending } = useSession();
	const isShared = Boolean(shareId);
	const isProfile = location.pathname === "/profile";
	const isIntegrations = location.pathname === "/integrations";
	const [artefacts, setArtefacts] = useState<Artefact[]>([]);
	const [loaded, setLoaded] = useState<{
		path: string;
		artefact: Artefact;
	}>();
	const [prompt, setPrompt] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [generationStatus, setGenerationStatus] = useState("");
	const [followUp, setFollowUp] = useState("");
	const [isRevising, setIsRevising] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const [notShared, setNotShared] = useState(false);
	const [isFullscreen, setFullscreen] = useState(false);
	const [isSidebarOpen, setSidebarOpen] = useState(true);
	const generationAbort = useRef<AbortController | undefined>(undefined);
	const artefactPath = shareId
		? `/shared/artefacts/${shareId}`
		: id
			? `/artefacts/${id}`
			: undefined;
	const current =
		loaded?.path === artefactPath ? loaded?.artefact : undefined;

	useEffect(() => {
		if (isShared || !session?.user) return;
		api("/artefacts")
			.then((response) =>
				response.ok ? response.json() : Promise.reject(),
			)
			.then(setArtefacts)
			.catch(() => setError("Could not load artefacts."));
	}, [isShared, session?.user]);
	useEffect(() => {
		if (!artefactPath || loaded?.path === artefactPath) return;
		api(artefactPath)
			.then((response) => {
				if (response.ok) return response.json();
				if (response.status === 403)
					return Promise.reject("not_shared");
				return Promise.reject("not_found");
			})
			.then((artefact: Artefact) => {
				setNotShared(false);
				setLoaded({ path: artefactPath, artefact });
			})
			.catch((reason) => {
				if (reason === "not_shared") return setNotShared(true);
				setNotShared(false);
				setError("This artefact could not be found.");
			});
	}, [artefactPath, loaded?.path]);

	async function create(event: FormEvent) {
		event.preventDefault();
		if (!prompt.trim() || isCreating) return;
		const controller = new AbortController();
		generationAbort.current = controller;
		setIsCreating(true);
		setGenerationStatus("Starting your brief…");
		setError("");
		try {
			const response = await api("/artefacts/stream", {
				method: "POST",
				body: JSON.stringify({ prompt }),
				signal: controller.signal,
			});
			if (!response.ok || !response.body)
				throw new Error("create failed");
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let artefact: Artefact | undefined;
			while (!artefact) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const frames = buffer.split(/\r?\n\r?\n/);
				buffer = frames.pop() ?? "";
				for (const frame of frames) {
					const eventName = frame.match(/^event: (.+)$/m)?.[1];
					const data = frame.match(/^data: (.+)$/m)?.[1];
					if (!eventName || !data) continue;
					const payload = JSON.parse(data) as {
						message?: string;
						artefact?: Artefact;
						error?: string;
					};
					if (eventName === "progress" && payload.message)
						setGenerationStatus(payload.message);
					if (eventName === "error") throw new Error(payload.error);
					if (eventName === "complete" && payload.artefact)
						artefact = payload.artefact;
				}
			}
			if (!artefact) throw new Error("create incomplete");
			const path = `/artefacts/${artefact.id}`;
			setArtefacts((currentArtefacts) => [artefact, ...currentArtefacts]);
			setLoaded({ path, artefact });
			setPrompt("");
			navigate(`/?artefact=${artefact.id}`);
		} catch (error) {
			if (!controller.signal.aborted)
				setError(
					error instanceof Error
						? error.message
						: "Could not create artefact.",
				);
		} finally {
			generationAbort.current = undefined;
			setIsCreating(false);
			setGenerationStatus("");
		}
	}
	function cancelGeneration() {
		generationAbort.current?.abort();
	}
	async function revise(event: FormEvent) {
		event.preventDefault();
		if (!current || !followUp.trim() || isRevising) return;
		setIsRevising(true);
		setError("");
		try {
			const response = await api(`/artefacts/${current.id}/revisions`, {
				method: "POST",
				body: JSON.stringify({ content: followUp }),
			});
			if (!response.ok) throw new Error("Could not revise artefact.");
			const result = (await response.json()) as {
				revision: Revision;
				artefact: Pick<Artefact, "title" | "content">;
			};
			setLoaded({
				path: artefactPath!,
				artefact: {
					...current,
					...result.artefact,
					revisions: [...(current.revisions ?? []), result.revision],
				},
			});
			setArtefacts((currentArtefacts) =>
				currentArtefacts.map((artefact) =>
					artefact.id === current.id
						? { ...artefact, title: result.artefact.title }
						: artefact,
				),
			);
			setFollowUp("");
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Could not revise artefact.",
			);
		} finally {
			setIsRevising(false);
		}
	}
	async function share() {
		if (!current) return;
		if (!current.isShared) {
			const response = await api(`/artefacts/${current.id}/share`, {
				method: "POST",
			});
			if (!response.ok) return setError("Could not share artefact.");
			setLoaded({
				path: artefactPath!,
				artefact: { ...current, isShared: true },
			});
		}
		await navigator.clipboard.writeText(
			`${window.location.origin}/artefacts/shared/${current.id}`,
		);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	}
	function updateCurrent(update: Partial<Artefact>) {
		if (!current) return;
		setLoaded({ path: artefactPath!, artefact: { ...current, ...update } });
		setArtefacts((currentArtefacts) =>
			currentArtefacts.map((artefact) =>
				artefact.id === current.id ? { ...artefact, ...update, content: undefined } : artefact,
			),
		);
	}
	async function saveEdits(content: ArtefactDocument): Promise<SaveResult> {
		if (!current) return "failed";
		setError("");
		const response = await api(`/artefacts/${current.id}/content`, {
			method: "PUT",
			body: JSON.stringify({ content, baseVersion: current.version ?? 0 }),
		});
		if (response.status === 409) return "conflict";
		if (!response.ok) {
			setError("Could not save your changes.");
			return "failed";
		}
		const result = (await response.json()) as {
			artefact: Pick<Artefact, "title" | "content" | "version">;
		};
		updateCurrent(result.artefact);
		return "saved";
	}
	function reload() {
		// Clearing the loaded artefact makes the loading effect fetch it again.
		setLoaded(undefined);
	}
	function close() {
		setFullscreen(false);
		navigate("/");
	}
	async function leave() {
		await signOut();
		navigate("/");
	}

	if (isPending && !isShared)
		return (
			<main className="grid min-h-screen place-items-center">
				<span className="text-sm text-muted">Loading</span>
			</main>
		);
	if (!isShared && !session?.user) return <Navigate to="/?auth=signin" replace />;
	if (isShared)
		return (
			<main className="min-h-screen bg-background">
				{error && <p className="p-10 text-sm text-danger">{error}</p>}
				{notShared && (
					<p className="p-10 text-sm text-muted">
						This artefact hasn't been shared.
					</p>
				)}
				{current && (
					<ArtefactBody
						artefact={current}
						canInteract={false}
						edgeToEdge
					/>
				)}
			</main>
		);

	const user = session!.user;
	return (
		<Surface className="flex min-h-screen overflow-hidden rounded-none border border-divider bg-background text-foreground">
			{isSidebarOpen && (
				<WorkspaceSidebar
					artefacts={artefacts}
					selectedId={id}
					user={user}
					isIntegrations={isIntegrations}
					onIntegrations={() => navigate("/integrations")}
					onCreate={() => navigate("/")}
					onOpenArtefact={(artefactId) =>
						navigate(`/?artefact=${artefactId}`)
					}
					onProfile={() => navigate("/profile")}
					onSignOut={leave}
				/>
			)}
			<section className="relative flex min-h-screen min-w-0 flex-1 flex-col bg-background">
				<header className="flex h-20 items-center gap-4 px-7">
					<Button
						aria-label={
							isSidebarOpen ? "Hide sidebar" : "Show sidebar"
						}
						variant="ghost"
						className="size-9 min-w-9 p-0"
						onPress={() => setSidebarOpen(!isSidebarOpen)}
					>
						{isSidebarOpen ? (
							<PanelLeftClose size={19} />
						) : (
							<PanelLeftOpen size={19} />
						)}
					</Button>
					<h1 className="text-2xl font-semibold tracking-tight">
						{isProfile
							? "Profile"
							: isIntegrations
								? "Integrations"
								: `Good morning, ${user.name?.split(" ")[0] || "there"}`}
					</h1>
					<ThemeToggle className="ml-auto" />
				</header>
				{isIntegrations ? (
					<IntegrationsPanel />
				) : isProfile ? (
					<div className="mx-auto flex w-full max-w-lg flex-1 items-center px-8 pb-20">
						<Card className="w-full">
							<Card.Header className="flex items-center gap-4">
								<UserAvatar
									image={user.image}
									name={user.name || user.email}
									size="lg"
								/>
								<div>
									<Card.Title>
										{user.name || "Unnamed"}
									</Card.Title>
									<Card.Description>
										{user.email}
									</Card.Description>
								</div>
							</Card.Header>
							<Card.Content>
								<dl className="divide-y divide-divider text-sm">
									<div className="flex items-center justify-between py-3">
										<dt className="text-muted">
											Email verified
										</dt>
										<dd>
											{user.emailVerified ? "Yes" : "No"}
										</dd>
									</div>
									<div className="flex items-center justify-between py-3">
										<dt className="text-muted">
											Member since
										</dt>
										<dd>
											{new Date(
												user.createdAt,
											).toLocaleDateString()}
										</dd>
									</div>
								</dl>
								<div className="mt-5">
									<Button
										onPress={() =>
											window.location.assign(
												"/api/integrations/github/install",
											)
										}
									>
										Connect GitHub
									</Button>
									{searchParams.get("github") ===
										"connected" && (
										<p className="mt-2 text-sm text-success">
											GitHub connected.
										</p>
									)}
									<GitHubAccountLink />
								</div>
							</Card.Content>
						</Card>
					</div>
				) : (
					<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-20 sm:px-8">
						<div className="mx-auto w-full max-w-2xl">
							<div className="mb-8 text-center">
								<img
									src="/kleelogo.svg"
									alt="Klee"
									className="mx-auto mb-4 size-11"
								/>
								<h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
									Turn context into something useful.
								</h2>
								<p className="mx-auto mt-3 max-w-xl text-base leading-6 text-muted">
									Ask for a shareable brief, technical
									diagram, or decision-ready plan.
								</p>
							</div>
							<form onSubmit={create} className="w-full">
								<Surface className="rounded-2xl border border-divider bg-surface p-3 transition-colors focus-within:border-muted">
									<TextArea
										aria-label="Artefact prompt"
										variant="secondary"
										rows={3}
										value={prompt}
										onChange={(event) =>
											setPrompt(event.target.value)
										}
										placeholder="What would you like to make? Paste a PR, issue, or a question…"
										className="min-h-28 w-full resize-none border-0 bg-transparent px-1 py-1 text-lg leading-7 shadow-none outline-none placeholder:text-muted focus-visible:ring-0"
									/>
									<Toolbar
										aria-label="Create artefact controls"
										className="flex w-full justify-end px-1 pt-1"
									>
										<Button
											aria-label={
												isCreating
													? "Generating artefact"
													: "Create artefact"
											}
											type="submit"
											className="size-9 min-w-9 rounded-full p-0"
											isDisabled={
												!prompt.trim() || isCreating
											}
										>
											{isCreating ? (
												"…"
											) : (
												<ArrowUp size={17} />
											)}
										</Button>
									</Toolbar>
								</Surface>
							</form>
							{godPrompt && (
								<div className="mt-4 flex justify-center">
									<Button
										size="sm"
										variant="outline"
										className="rounded-full"
										onPress={() => setPrompt(godPrompt.prompt)}
									>
										<BrainCog size={15} />
										{godPrompt.label}
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
				{error && (
					<p className="absolute bottom-8 left-8 text-sm text-danger">
						{error}
					</p>
				)}
			</section>
			{(current || isCreating) && (
				<ArtefactModal
					key={current?.id ?? "creating"}
					artefact={current}
					isCreating={isCreating}
					generationStatus={generationStatus}
					isFullscreen={isFullscreen}
					onClose={current ? close : cancelGeneration}
					onFullscreen={() => setFullscreen(!isFullscreen)}
					onShare={share}
					copied={copied}
					followUp={followUp}
					setFollowUp={setFollowUp}
					isRevising={isRevising}
					onSubmit={revise}
					onSave={saveEdits}
					onReload={reload}
					onProjectChange={updateCurrent}
					onError={setError}
				/>
			)}
		</Surface>
	);
}

/** Artefacts without a project first, then one group per GitHub org. */
function groupByProject(artefacts: Artefact[]) {
	const groups = new Map<string | null, Artefact[]>([[null, []]]);
	for (const artefact of artefacts) {
		const project = artefact.project ?? null;
		groups.set(project, [...(groups.get(project) ?? []), artefact]);
	}
	return [...groups].filter(([project, group]) => project === null || group.length);
}

function WorkspaceSidebar({
	artefacts,
	selectedId,
	user,
	isIntegrations,
	onIntegrations,
	onCreate,
	onOpenArtefact,
	onProfile,
	onSignOut,
}: {
	artefacts: Artefact[];
	selectedId?: string;
	user: { name?: string | null; email: string; image?: string | null };
	isIntegrations: boolean;
	onIntegrations: () => void;
	onCreate: () => void;
	onOpenArtefact: (id: string) => void;
	onProfile: () => void;
	onSignOut: () => void;
}) {
	const displayName = user.name || user.email;
	return (
		<aside className="sticky top-0 flex h-screen w-[288px] shrink-0 flex-col border-r border-divider bg-default-50 px-4 py-5">
			<ListBox
				aria-label="Workspace navigation"
				selectedKeys={isIntegrations ? ["integrations"] : []}
				onAction={(key) =>
					key === "integrations" ? onIntegrations() : onCreate()
				}
			>
				<ListBox.Item id="new" textValue="New artefact">
					<Plus size={18} />
					<Label>New artefact</Label>
				</ListBox.Item>
				<ListBox.Item id="integrations" textValue="Integrations">
					<Plug size={18} />
					<Label>Integrations</Label>
				</ListBox.Item>
			</ListBox>
			<Separator className="my-5" />
			<ListBox
				aria-label="Artefacts"
				className="min-h-0 flex-1 overflow-y-auto"
				selectedKeys={selectedId ? [selectedId] : []}
				onAction={(key) => onOpenArtefact(String(key))}
			>
				{groupByProject(artefacts).map(([project, group]) => (
					<ListBox.Section key={project ?? "own"}>
						<Header>{project ?? "Artefacts"}</Header>
						{group.map((artefact) => (
							<ListBox.Item
								key={artefact.id}
								id={artefact.id}
								textValue={artefact.title}
							>
								<FileText size={16} />
								<Label>{artefact.title}</Label>
							</ListBox.Item>
						))}
					</ListBox.Section>
				))}
			</ListBox>
			<Separator className="my-4" />
			<Popover>
				<Popover.Trigger>
					<Button
						variant="ghost"
						className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2 text-left"
					>
						<UserAvatar
							image={user.image}
							name={displayName}
							size="lg"
						/>
						<span className="min-w-0">
							<span className="block truncate text-base font-semibold">
								{displayName}
							</span>
							<span className="block truncate text-sm text-muted">
								{user.email}
							</span>
						</span>
					</Button>
				</Popover.Trigger>
				<Popover.Content placement="top" offset={8} className="w-64">
					<Popover.Arrow />
					<Popover.Dialog className="p-2">
						<div className="flex items-center gap-3 px-2 py-2">
							<UserAvatar image={user.image} name={displayName} />
							<span className="min-w-0">
								<span className="block truncate font-medium">
									{displayName}
								</span>
								<span className="block truncate text-xs text-muted">
									{user.email}
								</span>
							</span>
						</div>
						<Separator className="my-1" />
						<Button
							variant="ghost"
							className="w-full justify-start"
							onPress={onProfile}
						>
							<UserRound size={16} />
							Profile
						</Button>
						<Button
							variant="ghost"
							className="w-full justify-start text-danger"
							onPress={onSignOut}
						>
							<LogOut size={16} />
							Log out
						</Button>
					</Popover.Dialog>
				</Popover.Content>
			</Popover>
		</aside>
	);
}

function ArtefactModal({
	artefact,
	isCreating,
	generationStatus,
	isFullscreen,
	onClose,
	onFullscreen,
	onShare,
	copied,
	followUp,
	setFollowUp,
	isRevising,
	onSubmit,
	onSave,
	onReload,
	onProjectChange,
	onError,
}: {
	artefact?: Artefact;
	isCreating: boolean;
	generationStatus: string;
	isFullscreen: boolean;
	onClose: () => void;
	onFullscreen: () => void;
	onShare: () => void;
	copied: boolean;
	followUp: string;
	setFollowUp: (value: string) => void;
	isRevising: boolean;
	onSubmit: (event: FormEvent) => void;
	onSave: (content: ArtefactDocument) => Promise<SaveResult>;
	onReload: () => void;
	onProjectChange: (update: Pick<Artefact, "installationId" | "project">) => void;
	onError: (message: string) => void;
}) {
	// Edit mode keeps a draft copy; `undefined` means not editing.
	const [draft, setDraft] = useState<ArtefactDocument>();
	const [isSaving, setIsSaving] = useState(false);
	const [hasConflict, setHasConflict] = useState(false);
	const [isDiscarding, setIsDiscarding] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	// A past version picked on the history slider; `undefined` shows the latest.
	const [pastVersion, setPastVersion] = useState<ArtefactDocument>();
	const isEditing = draft !== undefined;
	const isDirty =
		isEditing && JSON.stringify(draft) !== JSON.stringify(artefact?.content);
	const historyOpen = isFullscreen && showHistory && !isEditing;

	function startEditing() {
		if (!artefact?.content) return;
		setDraft(structuredClone(artefact.content));
		setShowHistory(false);
		setPastVersion(undefined);
	}
	function stopEditing() {
		setDraft(undefined);
		setHasConflict(false);
		setIsDiscarding(false);
	}
	async function save() {
		if (!draft) return;
		setIsSaving(true);
		const result = await onSave(draft);
		setIsSaving(false);
		if (result === "saved") stopEditing();
		if (result === "conflict") setHasConflict(true);
	}

	return (
		<Modal>
			<Modal.Backdrop
				isOpen
				onOpenChange={(open) => {
					if (!open) onClose();
				}}
				variant={isFullscreen ? "transparent" : "blur"}
			>
				<Modal.Container
					placement="center"
					scroll="inside"
					size={isFullscreen ? "full" : "cover"}
				>
					<Modal.Dialog
						aria-label={
							artefact
								? artefactHeading(artefact)
								: "Creating artefact"
						}
						className={
							isFullscreen
								? "h-dvh min-h-dvh w-screen max-w-none rounded-none p-0"
								: "overflow-hidden rounded-2xl p-0"
						}
					>
						<Modal.Header className="z-10 shrink-0 flex-row items-center gap-4 border-b border-divider bg-surface px-5 py-3 sm:px-6">
							<Modal.Heading className="flex min-w-0 items-center gap-2">
								{artefact ? (
									<>
										<span className="shrink-0 text-muted">
											Artefacts
										</span>
										<span
											aria-hidden
											className="text-muted"
										>
											/
										</span>
										<span className="truncate">
											{artefactHeading(artefact)}
										</span>
									</>
								) : (
									<span>Creating artefact</span>
								)}
							</Modal.Heading>
							<Toolbar
								aria-label="Artefact actions"
								className="ml-auto flex items-center gap-1"
							>
								{artefact && !isEditing && (
									<ProjectSelect
										artefactId={artefact.id}
										installationId={artefact.installationId ?? null}
										project={artefact.project ?? null}
										isOwner={artefact.isOwner ?? true}
										onChange={onProjectChange}
										onError={onError}
									/>
								)}
								{artefact && !isEditing && isFullscreen && (
									<Button
										variant={showHistory ? "secondary" : "ghost"}
										size="sm"
										onPress={() => {
											setShowHistory(!showHistory);
											setPastVersion(undefined);
										}}
									>
										<History size={15} />
										History
									</Button>
								)}
								{artefact && !isEditing && (
									<Button
										variant="ghost"
										size="sm"
										isDisabled={!artefact.content || pastVersion !== undefined}
										onPress={startEditing}
									>
										<Pencil size={15} />
										Edit
									</Button>
								)}
								{artefact && !isEditing && (
									<Button
										variant="secondary"
										size="sm"
										onPress={onShare}
									>
										{copied ? (
											<Check size={15} />
										) : (
											<Share2 size={15} />
										)}
										{copied ? "Link copied" : "Share"}
									</Button>
								)}
								{artefact && (
									<Button
										aria-label={
											isFullscreen
												? "Exit fullscreen"
												: "Fullscreen"
										}
										variant="ghost"
										className="size-8 min-w-8 p-0"
										onPress={onFullscreen}
									>
										{isFullscreen ? (
											<Minimize2 size={17} />
										) : (
											<Maximize2 size={17} />
										)}
									</Button>
								)}
								<Button
									aria-label={
										artefact
											? "Close artefact"
											: "Cancel generation"
									}
									variant="ghost"
									className="size-8 min-w-8 p-0"
									onPress={onClose}
								>
									<X size={17} />
								</Button>
							</Toolbar>
						</Modal.Header>
						{artefact && historyOpen && (
							<Surface
								variant="secondary"
								className="shrink-0 border-b border-divider px-5 py-4 sm:px-6"
							>
								<VersionHistory
									artefactId={artefact.id}
									latestVersion={artefact.version ?? 1}
									onView={setPastVersion}
								/>
							</Surface>
						)}
						<Modal.Body className="m-0 bg-surface p-0">
							{artefact ? (
								<ArtefactBody
									artefact={artefact}
									document={draft ?? (historyOpen ? pastVersion : undefined)}
									canInteract
									edgeToEdge
									onAction={setFollowUp}
									isEditing={isEditing}
									onEdit={(nodeId, path, value) =>
										setDraft((current) =>
											current && withEditedText(current, nodeId, path, value),
										)
									}
								/>
							) : (
								<div
									className="grid min-h-96 place-items-center p-8"
									role="status"
								>
									<div className="w-full max-w-xl space-y-5 animate-pulse">
										<p className="text-center text-sm text-muted">
											{generationStatus ||
												"Starting your artefact…"}
										</p>
										<div className="h-8 w-2/3 rounded bg-divider" />
										<div className="h-4 w-full rounded bg-divider" />
										<div className="h-4 w-5/6 rounded bg-divider" />
										<div className="h-32 rounded-xl bg-divider" />
									</div>
								</div>
							)}
						</Modal.Body>
						{artefact && !isCreating && isEditing && (
							<Modal.Footer className="z-10 m-0 shrink-0 flex-col gap-3 border-t border-divider bg-surface px-4 py-3 sm:px-6">
								{hasConflict && (
									<Alert status="warning" className="w-full">
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Title>
												This artefact changed since you started editing
											</Alert.Title>
											<Alert.Description>
												Reload to get the latest version. Your unsaved
												changes will be lost.
											</Alert.Description>
										</Alert.Content>
										<Button size="sm" variant="secondary" onPress={onReload}>
											Reload
										</Button>
									</Alert>
								)}
								<Toolbar
									aria-label="Edit actions"
									className="flex w-full items-center justify-end gap-2"
								>
									<Paragraph size="sm" color="muted" className="mr-auto">
										{isDirty
											? "You have unsaved changes"
											: "Click any text to edit it"}
									</Paragraph>
									<Button
										variant="ghost"
										onPress={() =>
											isDirty ? setIsDiscarding(true) : stopEditing()
										}
									>
										Cancel
									</Button>
									<Button
										isDisabled={!isDirty || isSaving || hasConflict}
										onPress={() => void save()}
									>
										{isSaving ? "Saving…" : "Save"}
									</Button>
								</Toolbar>
							</Modal.Footer>
						)}
						{artefact && !isCreating && !isEditing && (
							<Modal.Footer className="z-10 m-0 shrink-0 border-t border-divider bg-surface px-4 py-3 sm:px-6">
								<form
									onSubmit={onSubmit}
									className="flex w-full items-center gap-2 rounded-full border border-divider bg-field p-1.5 pl-4"
								>
									<Input
										aria-label="Refine artefact"
										variant="secondary"
										className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none outline-none focus-visible:ring-0"
										value={followUp}
										disabled={pastVersion !== undefined}
										onChange={(event) =>
											setFollowUp(event.target.value)
										}
										placeholder={
											pastVersion
												? "Return to the latest version to make changes"
												: "Describe what to change"
										}
									/>
									<Button
										aria-label={
											isRevising
												? "Refining artefact"
												: "Refine artefact"
										}
										type="submit"
										className="size-10 min-w-10 rounded-full p-0"
										isDisabled={
											!followUp.trim() ||
											isRevising ||
											pastVersion !== undefined
										}
									>
										{isRevising ? (
											"…"
										) : (
											<ArrowUp size={17} />
										)}
									</Button>
								</form>
							</Modal.Footer>
						)}
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
			<AlertDialog>
				<AlertDialog.Backdrop
					isOpen={isDiscarding}
					onOpenChange={setIsDiscarding}
				>
					<AlertDialog.Container>
						<AlertDialog.Dialog>
							<AlertDialog.Header>
								<AlertDialog.Icon status="warning" />
								<AlertDialog.Heading>Discard your changes?</AlertDialog.Heading>
							</AlertDialog.Header>
							<AlertDialog.Body>
								<Paragraph size="sm" color="muted">
									Your edits to this artefact haven't been saved.
								</Paragraph>
							</AlertDialog.Body>
							<AlertDialog.Footer>
								<Button variant="ghost" onPress={() => setIsDiscarding(false)}>
									Keep editing
								</Button>
								<Button variant="danger" onPress={stopEditing}>
									Discard
								</Button>
							</AlertDialog.Footer>
						</AlertDialog.Dialog>
					</AlertDialog.Container>
				</AlertDialog.Backdrop>
			</AlertDialog>
		</Modal>
	);
}

function ArtefactBody({
	artefact,
	document: override,
	canInteract,
	edgeToEdge = false,
	isEditing = false,
	onAction,
	onEdit,
}: {
	artefact: Artefact;
	/** Shown instead of the saved content, e.g. an edit draft or a past version. */
	document?: ArtefactDocument;
	canInteract: boolean;
	edgeToEdge?: boolean;
	isEditing?: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: string) => void;
}) {
	const document =
		override ??
		artefact.content ??
		fallbackDocument(artefact.prompt, artefactHeading(artefact));
	return (
		<ArtefactRenderer
			document={document}
			createdAt={artefact.createdAt}
			canInteract={canInteract && !isEditing}
			edgeToEdge={edgeToEdge}
			isEditing={isEditing}
			onAction={onAction}
			onEdit={onEdit}
		/>
	);
}
