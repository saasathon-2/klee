import {
	Alert,
	AlertDialog,
	Button,
	Drawer,
	Input,
	Label,
	ListBox,
	Modal,
	Paragraph,
	Popover,
	Separator,
	Spinner,
	Surface,
	TextArea,
	Toolbar,
} from "@heroui/react";
import {
	ArrowUp,
	BrainCog,
	Building2,
	Check,
	Copy,
	ExternalLink,
	House,
	History,
	LogOut,
	MessageCircle,
	PanelLeftClose,
	PanelLeftOpen,
	Pencil,
	Plug,
	Plus,
	Share2,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useDrop } from "react-aria-components";
import {
	Navigate,
	Link,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { KleeIcon, KleeLogo } from "../components/KleeLogo";
import { UserAvatar } from "../components/UserAvatar";
import { LinkChips } from "../components/LinkChips";
import { PageLoader } from "../components/PageLoader";
import { takeLinkPaste } from "../lib/links";
import { ArtefactRenderer } from "../artefacts/templates/renderer";
import { useLiveStatus } from "../artefacts/templates/page/liveStatus";
import {
	changedBlockIds,
	fallbackDocument,
	withEditedValue,
	type ArtefactDocument,
} from "../artefacts/model";
import type { EditPath } from "../artefacts/templates/types";
import { developerExamplePrompts } from "../artefacts/examplePrompts";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../lib/use-theme";
import { IntegrationsModal } from "./Integrations";
import { OrganisationsModal } from "./Organisations";
import { useMediaQuery } from "../lib/use-media-query";
import { ArtefactSkeleton } from "./artefact/ArtefactSkeleton";
import { ArtefactIcon, ArtefactNav } from "./artefact/ArtefactNav";
import { acceptArtefactDrop, droppedArtefactId } from "./artefact/artefactDrag";
import { ProjectSelect } from "./artefact/ProjectSelect";
import { useFolders, type Folder } from "./artefact/useFolders";
import { VersionHistory } from "./artefact/VersionHistory";
import { ArtefactComments } from "./artefact/ArtefactComments";
import { ShareDialog } from "./artefact/ShareDialog";
import { useDocumentTitle } from "../useDocumentTitle";

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
	description?: string;
	icon?: string;
	createdAt: string;
	content?: ArtefactDocument;
	revisions?: Revision[];
	/** Latest version number; manual saves must be based on it. */
	version?: number;
	isOwner?: boolean;
	permission?: "view" | "comment" | "edit";
	/** GitHub org (project) whose members can view and edit this artefact. */
	project?: string | null;
	installationId?: string | null;
	/** The current user's folder for this artefact. */
	folderId?: string | null;
};

type SaveResult = "saved" | "conflict" | "failed";

const desktopQuery = "(min-width: 768px)";

function artefactHeading(artefact: Artefact) {
	if (artefact.title !== "New artefact") return artefact.title;
	return /\b(pr|pull request|github|change|architecture)\b/i.test(
		artefact.prompt,
	)
		? "Change brief"
		: "Working brief";
}

function artefactDescription(artefact: Artefact) {
	if (artefact.description) return artefact.description;
	const summary = artefact.content?.root.children?.[0]?.data.summary;
	return typeof summary === "string" && summary ? summary : artefact.prompt;
}

function artefactIcon(artefact: Artefact) {
	if (artefact.icon) return artefact.icon;
	const icon = artefact.content?.root.children?.[0]?.data.icon;
	return typeof icon === "string" ? icon : undefined;
}

/** Starter prompts offered as buttons under the prompt box. */
const starterPromptIds = new Set([
	"god-prompt",
	"sprint-status",
	"branch-history",
	"release-readiness",
	"incident-review",
	"architecture-decision",
	"on-call-handoff",
	"two-column",
]);
const starterPrompts = developerExamplePrompts.filter((template) =>
	starterPromptIds.has(template.id),
);

const api = (path: string, options?: RequestInit) =>
	fetch(`/api${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...options?.headers },
		...options,
	});

export function Artefacts() {
	const navigate = useNavigate();
	const { id: routeId, shareId } = useParams();
	const [searchParams] = useSearchParams();
	const id = routeId ?? searchParams.get("artefact") ?? undefined;
	const snapshotToken = searchParams.get("snapshot");
	const isPreview = searchParams.get("preview") === "1";
	const { data: session, isPending } = useSession();
	const viewerId = session?.user?.id;
	const isShared = Boolean(shareId);
	const panel = searchParams.get("panel");
	const isIntegrations = panel === "integrations";
	const isOrganisations = panel === "organisations";
	const [artefacts, setArtefacts] = useState<Artefact[]>([]);
	const [artefactsLoaded, setArtefactsLoaded] = useState(false);
	const [loaded, setLoaded] = useState<{
		path: string;
		artefact: Artefact;
	}>();
	const [failedPath, setFailedPath] = useState<string>();
	const [prompt, setPrompt] = useState("");
	// Links pasted into the prompt, shown as chips and sent after the text.
	const [promptLinks, setPromptLinks] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [generationStatus, setGenerationStatus] = useState("");
	const [generationCommentary, setGenerationCommentary] = useState("");
	const [isCommentaryStarting, setIsCommentaryStarting] = useState(false);
	const [followUp, setFollowUp] = useState("");
	const [isRevising, setIsRevising] = useState(false);
	const [error, setError] = useState("");
	const {
		folders,
		create: createFolder,
		rename: renameFolder,
		remove: removeFolder,
	} = useFolders(Boolean(session?.user) && !isShared, setError);
	const [shareOpen, setShareOpen] = useState(false);
	const [notShared, setNotShared] = useState(false);
	const [sharedCommentsOpen, setSharedCommentsOpen] = useState(false);
	const [isSharedCommenting, setSharedCommenting] = useState(false);
	const [sharedCommentCount, setSharedCommentCount] = useState(0);
	const [copiedSharedLinkId, setCopiedSharedLinkId] = useState<string>();
	const [sharedAccess, setSharedAccess] = useState<{
		artefactId: string;
		viewerId: string;
		isOwner: boolean;
		permission?: Artefact["permission"];
	}>();
	// Phones get the sidebar as a drawer, closed until the toggle is pressed.
	const isDesktop = useMediaQuery(desktopQuery);
	const [isSidebarOpen, setSidebarOpen] = useState(
		() => window.matchMedia(desktopQuery).matches,
	);
	const generationAbort = useRef<AbortController | undefined>(undefined);
	// Dropping a sidebar artefact onto the main view opens it.
	const mainRef = useRef<HTMLElement>(null);
	const { dropProps: mainDropProps, isDropTarget: isMainDropTarget } =
		useDrop({
			ref: mainRef,
			getDropOperation: acceptArtefactDrop,
			onDrop: async ({ items }) => {
				const artefactId = await droppedArtefactId(items);
				if (artefactId) navigate(`/?artefact=${artefactId}`);
			},
		});
	const artefactPath = shareId
		? snapshotToken
			? `/artefacts/${shareId}/snapshot?token=${encodeURIComponent(snapshotToken)}`
			: `/shared/artefacts/${shareId}`
		: id
			? `/artefacts/${id}`
			: undefined;
	const current =
		loaded?.path === artefactPath ? loaded?.artefact : undefined;
	const isLoadingArtefact = Boolean(
		artefactPath && !current && failedPath !== artefactPath,
	);
	useDocumentTitle(
		current
			? `${artefactHeading(current)} - Klee`
			: isIntegrations
				? "Integrations - Klee"
				: isOrganisations
					? "Organisations - Klee"
					: isShared
						? "Shared artefact - Klee"
						: "Artefacts - Klee",
	);
	const currentSharedAccess =
		current &&
		sharedAccess?.artefactId === current.id &&
		sharedAccess.viewerId === viewerId
			? sharedAccess
			: undefined;

	// A shared artefact scrolls the window, so overscroll shows the page canvas;
	// match it to the artefact's brand header and footer.
	useEffect(() => {
		if (!isShared) return;
		const root = window.document.documentElement;
		root.style.backgroundColor = "var(--brand)";
		return () => {
			root.style.backgroundColor = "";
		};
	}, [isShared]);
	useEffect(() => {
		if (isShared || !viewerId) return;
		api("/artefacts")
			.then((response) =>
				response.ok ? response.json() : Promise.reject(),
			)
			.then(setArtefacts)
			.catch(() => setError("Could not load artefacts."))
			.finally(() => setArtefactsLoaded(true));
	}, [isShared, viewerId]);
	useEffect(() => {
		if (!artefactPath || loaded?.path === artefactPath) return;
		const privatePath = isShared && viewerId && !snapshotToken
			? `/artefacts/${shareId}`
			: undefined;
		const load = async () => {
			const privateResponse = privatePath
				? await api(privatePath)
				: undefined;
			const response = privateResponse?.ok
				? privateResponse
				: await api(artefactPath);
			if (response.ok) return response.json() as Promise<Artefact>;
			if (response.status === 403) throw new Error("not_shared");
			throw new Error("not_found");
		};
		load()
			.then((artefact: Artefact) => {
				setNotShared(false);
				setLoaded({ path: artefactPath, artefact });
			})
			.catch((error: Error) => {
				setFailedPath(artefactPath);
				if (error.message === "not_shared") return setNotShared(true);
				setNotShared(false);
				setError("This artefact could not be found.");
			});
	}, [artefactPath, isShared, loaded?.path, shareId, snapshotToken, viewerId]);

	useEffect(() => {
		let active = true;
		if (!isShared || !shareId || !viewerId)
			return () => {
				active = false;
			};
		api(`/artefacts/${shareId}`)
			.then(async (response) =>
				response.ok ? ((await response.json()) as Artefact) : undefined,
			)
			.then((artefact) => {
				if (!active) return;
				setSharedAccess(
					artefact
						? {
								artefactId: shareId,
								viewerId,
								isOwner: Boolean(artefact.isOwner),
								permission: artefact.permission,
							}
						: undefined,
				);
			})
			.catch(() => {
				if (active) setSharedAccess(undefined);
			});
		return () => {
			active = false;
		};
	}, [isShared, shareId, viewerId]);

	async function create(event: FormEvent) {
		event.preventDefault();
		const fullPrompt = [prompt.trim(), ...promptLinks].filter(Boolean).join("\n");
		if (!fullPrompt || isCreating) return;
		const controller = new AbortController();
		generationAbort.current = controller;
		setIsCreating(true);
		setGenerationStatus("Starting your brief…");
		setGenerationCommentary("");
		setError("");
		try {
			const response = await api("/artefacts/stream", {
				method: "POST",
				body: JSON.stringify({ prompt: fullPrompt }),
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
						text?: string;
					};
					if (eventName === "progress" && payload.message)
						setGenerationStatus(payload.message);
					if (eventName === "commentary" && payload.text)
						setGenerationCommentary(payload.text);
					if (eventName === "error") throw new Error(payload.error);
					if (eventName === "complete" && payload.artefact)
						artefact = payload.artefact;
				}
			}
			if (!artefact) throw new Error("create incomplete");
			const path = `/artefacts/${artefact.id}`;
			const ownedArtefact = {
				...artefact,
				isOwner: true,
				permission: "edit" as const,
			};
			setArtefacts((currentArtefacts) => [
				ownedArtefact,
				...currentArtefacts,
			]);
			setLoaded({ path, artefact: ownedArtefact });
			setPrompt("");
			setPromptLinks([]);
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
		setGenerationCommentary("");
		setIsCommentaryStarting(false);
		setError("");
		let commentaryTimer: number | undefined;
		let commentaryReveal = Promise.resolve();
		try {
			const response = await api(`/artefacts/${current.id}/revisions`, {
				method: "POST",
				body: JSON.stringify({ content: followUp }),
			});
			if (!response.ok || !response.body)
				throw new Error("Could not revise artefact.");
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let result:
				| {
						revision: Revision;
						artefact: Pick<Artefact, "title" | "content">;
				  }
				| undefined;
			while (!result) {
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
						text?: string;
						error?: string;
						revision?: Revision;
						artefact?: Pick<Artefact, "title" | "content">;
					};
					if (
						eventName === "commentary" &&
						payload.text &&
						commentaryTimer === undefined
					) {
						setIsCommentaryStarting(true);
						commentaryReveal = new Promise((resolve) => {
							commentaryTimer = window.setTimeout(() => {
								setGenerationCommentary(payload.text!);
								setIsCommentaryStarting(false);
								resolve();
							}, 180);
						});
					}
					if (eventName === "error") throw new Error(payload.error);
					if (
						eventName === "complete" &&
						payload.revision &&
						payload.artefact
					)
						result = {
							revision: payload.revision,
							artefact: payload.artefact,
						};
				}
			}
			await commentaryReveal;
			if (!result) throw new Error("Could not revise artefact.");
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
			if (commentaryTimer !== undefined)
				window.clearTimeout(commentaryTimer);
			setIsCommentaryStarting(false);
			setIsRevising(false);
		}
	}
	function setShared(isShared: boolean) {
		if (!current) return;
		setLoaded({ path: artefactPath!, artefact: { ...current, isShared } });
		setArtefacts((items) =>
			items.map((item) =>
				item.id === current.id ? { ...item, isShared } : item,
			),
		);
	}
	function updateCurrent(update: Partial<Artefact>) {
		if (!current) return;
		setLoaded({ path: artefactPath!, artefact: { ...current, ...update } });
		setArtefacts((currentArtefacts) =>
			currentArtefacts.map((artefact) =>
				artefact.id === current.id
					? { ...artefact, ...update, content: undefined }
					: artefact,
			),
		);
	}
	async function saveEdits(content: ArtefactDocument): Promise<SaveResult> {
		if (!current) return "failed";
		setError("");
		const response = await api(`/artefacts/${current.id}/content`, {
			method: "PUT",
			body: JSON.stringify({
				content,
				baseVersion: current.version ?? 0,
			}),
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
	async function moveArtefact(artefactId: string, folderId: string | null) {
		const listed = artefacts.find((artefact) => artefact.id === artefactId);
		if (listed && (listed.folderId ?? null) === folderId) return;
		const response = await api(`/artefacts/${artefactId}/folder`, {
			method: "PUT",
			body: JSON.stringify({ folderId }),
		});
		if (!response.ok) return setError("Could not move the artefact.");
		setArtefacts((currentArtefacts) =>
			currentArtefacts.map((artefact) =>
				artefact.id === artefactId
					? { ...artefact, folderId }
					: artefact,
			),
		);
		setLoaded((open) =>
			open?.artefact.id === artefactId
				? { ...open, artefact: { ...open.artefact, folderId } }
				: open,
		);
	}
	function reload() {
		// Clearing the loaded artefact makes the loading effect fetch it again.
		setFailedPath(undefined);
		setLoaded(undefined);
	}
	function close() {
		navigate("/");
	}
	async function leave() {
		await signOut();
		navigate("/");
	}

	if (isPending && !isShared)
		return (
			<PageLoader />
		);
	if (!isShared && !session?.user)
		return <Navigate to="/?auth=signin" replace />;
	if (isShared)
		return (
			<main className="relative flex min-h-screen flex-col bg-background">
				{error && <p className="p-10 text-sm text-danger">{error}</p>}
				{notShared && (
					<p className="p-10 text-sm text-muted">
						This artefact hasn't been shared.
					</p>
				)}
				{current && !isPreview && (
					<div className="fixed inset-x-0 top-2 z-10 flex items-center justify-between px-4">
								<Button
									aria-label="Artefact home"
									variant="ghost"
									size="sm"
									className="border border-border bg-background text-foreground shadow-sm hover:bg-surface"
									onPress={() => navigate("/")}
								>
									<House size={15} />
									Artefact home
								</Button>
								<div className="flex items-center gap-2">
									{currentSharedAccess?.permission === "edit" && (
										<Button
											aria-label="Edit artefact"
											variant="ghost"
											size="sm"
											className="border border-border bg-background text-foreground shadow-sm hover:bg-surface"
											onPress={() => navigate(`/?artefact=${current.id}`)}
										>
											<Pencil size={15} />
											Edit
										</Button>
									)}
									<Button
										aria-label="Copy artefact link"
										variant="ghost"
										size="sm"
										className="border border-border bg-background text-foreground shadow-sm hover:bg-surface"
										onPress={() =>
											void navigator.clipboard
												.writeText(
													`${window.location.origin}/artefacts/shared/${current.id}`,
												)
												.then(() => setCopiedSharedLinkId(current.id))
												.catch(() =>
													setError("Could not copy the artefact link."),
												)
										}
									>
										{copiedSharedLinkId === current.id ? (
											<Check size={15} />
										) : (
											<Copy size={15} />
										)}
										{copiedSharedLinkId === current.id
											? "Link copied"
											: "Copy link"}
									</Button>
									<Button
										aria-label={`Comments, ${sharedCommentCount}`}
										aria-pressed={sharedCommentsOpen || isSharedCommenting}
										variant={
											sharedCommentsOpen || isSharedCommenting
												? "secondary"
												: "ghost"
										}
										size="sm"
										className="border border-border bg-background text-foreground shadow-sm hover:bg-surface"
										onPress={() => {
											const next = !(sharedCommentsOpen || isSharedCommenting);
											setSharedCommentsOpen(next);
											setSharedCommenting(
												next &&
													(currentSharedAccess?.permission === "comment" ||
														currentSharedAccess?.permission === "edit"),
											);
										}}
									>
										<MessageCircle size={15} />
										Comments
										{sharedCommentCount > 0 &&
											` ${sharedCommentCount}`}
									</Button>
								</div>
					</div>
				)}
				{!current && !notShared && !error && <ArtefactSkeleton />}
				{current &&
					(isPreview ? (
						<ArtefactBody
							artefact={current}
							canInteract={false}
							edgeToEdge
							fillViewport
							compactHeader
						/>
					) : (
						<ArtefactComments
							key={current.id}
							artefactId={current.id}
							isOwner={currentSharedAccess?.isOwner ?? false}
							userId={session?.user?.id ?? ""}
							isShared
							canComment={
								currentSharedAccess?.permission === "comment" ||
								currentSharedAccess?.permission === "edit"
							}
							isOpen={sharedCommentsOpen}
							onOpenChange={setSharedCommentsOpen}
							isCommenting={isSharedCommenting}
							onCommentingChange={setSharedCommenting}
							onCountChange={setSharedCommentCount}
						>
							<ArtefactBody
								artefact={current}
								canInteract={false}
								edgeToEdge
								fillViewport
								compactHeader={isPreview}
							/>
						</ArtefactComments>
					))}
			</main>
		);

	const user = session!.user;
	// On phones, picking something also closes the drawer.
	const go = (path: string) => {
		navigate(path);
		if (!isDesktop) setSidebarOpen(false);
	};
	const sidebar = (
		<WorkspaceSidebar
			inDrawer={!isDesktop}
			artefacts={artefacts}
			isLoadingArtefacts={!artefactsLoaded}
			folders={folders}
			onCreateFolder={createFolder}
			onRenameFolder={renameFolder}
			onDeleteFolder={removeFolder}
			onMoveArtefact={moveArtefact}
			selectedId={id}
			user={user}
			isIntegrations={isIntegrations}
			isOrganisations={isOrganisations}
			onIntegrations={() => go("/?panel=integrations")}
			onOrganisations={() => go("/?panel=organisations")}
			onCreate={() => go("/")}
			onOpenArtefact={(artefactId) => go(`/?artefact=${artefactId}`)}
			onSignOut={leave}
		/>
	);
	return (
		<Surface className="flex min-h-screen overflow-hidden rounded-none border border-border bg-background text-foreground">
			{isDesktop ? (
				isSidebarOpen && sidebar
			) : (
				// Open state goes on the root: it wraps a DialogTrigger that owns it.
				<Drawer isOpen={isSidebarOpen} onOpenChange={setSidebarOpen}>
					<Drawer.Backdrop>
						<Drawer.Content placement="left">
							<Drawer.Dialog
								aria-label="Workspace"
								className="w-[288px] max-w-[85vw] p-0"
							>
								{sidebar}
							</Drawer.Dialog>
						</Drawer.Content>
					</Drawer.Backdrop>
				</Drawer>
			)}
			<section
				ref={mainRef}
				{...mainDropProps}
				className="relative flex min-h-screen min-w-0 flex-1 flex-col bg-background"
			>
				{isMainDropTarget && (
					<div className="pointer-events-none absolute inset-4 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-accent-text bg-accent-soft">
						<span className="rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-surface-foreground">
							Drop to open
						</span>
					</div>
				)}
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
					<ThemeToggle className="ml-auto" />
				</header>
				<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-20 sm:px-8">
					<div className="mx-auto w-full max-w-2xl">
						<div className="mb-8 text-center">
							<KleeLogo className="mx-auto mb-4 size-16" />
							<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
								Good morning,{" "}
								{user.name?.split(" ")[0] || "there"}
							</h1>
						</div>
						<form onSubmit={create} className="w-full">
							<Surface className="rounded-2xl border border-border bg-surface p-3 transition-colors focus-within:border-muted">
								<LinkChips
									links={promptLinks}
									onRemove={(link) =>
										setPromptLinks((links) =>
											links.filter((item) => item !== link),
										)
									}
								/>
								<TextArea
									onPaste={(event) =>
										takeLinkPaste(event, (link) =>
											setPromptLinks((links) =>
												links.includes(link)
													? links
													: [...links, link],
											),
										)
									}
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
										className="size-9 min-w-9 rounded-xl p-0"
										isPending={isCreating}
										isDisabled={
											!prompt.trim() &&
											promptLinks.length === 0
										}
									>
										{({ isPending }) =>
											isPending ? (
												<Spinner color="current" size="sm" />
											) : (
												<ArrowUp size={17} />
											)
										}
									</Button>
								</Toolbar>
							</Surface>
						</form>
						<div className="mt-5 flex justify-center">
							<Button
								variant="ghost"
								className="h-auto max-w-full rounded-xl justify-center border border-border bg-surface px-4 py-3 hover:bg-surface-secondary"
								onPress={() => navigate("/?panel=integrations")}
							>
								<span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
									<Plug size={16} />
								</span>
								<span>
									<span className="block text-sm font-medium">
										Connect your apps
									</span>
									<span className="block text-xs text-muted">
										Bring in context from GitHub and manage
										access in one place.
									</span>
								</span>
							</Button>
						</div>
						<div className="mt-4 flex flex-wrap justify-center gap-2">
							{starterPrompts.map((template) => (
								<Button
									key={template.id}
									size="sm"
									variant="outline"
									className="rounded-full"
									onPress={() => setPrompt(template.prompt)}
								>
									{template.id === "god-prompt" && (
										<BrainCog size={15} />
									)}
									{template.label}
								</Button>
							))}
						</div>
					</div>
				</div>
				{error && (
					<p className="absolute bottom-8 left-8 text-sm text-danger">
						{error}
					</p>
				)}
			</section>
			{(current || isCreating || isLoadingArtefact) && (
				<ArtefactModal
					key={artefactPath ?? (isCreating ? "creating" : "loading")}
					artefact={current}
					isCreating={isCreating}
					isLoading={isLoadingArtefact}
					generationStatus={generationStatus}
					generationCommentary={generationCommentary}
					isCommentaryStarting={isCommentaryStarting}
					userId={user.id}
					onClose={isCreating ? cancelGeneration : close}
					onOpenShared={(artefactId) =>
						navigate(`/artefacts/shared/${artefactId}`)
					}
					onShare={() => setShareOpen(true)}
					followUp={followUp}
					setFollowUp={setFollowUp}
					isRevising={isRevising}
					onSubmit={revise}
					onSave={saveEdits}
					onReload={reload}
					onProjectChange={updateCurrent}
					folders={folders}
					onError={setError}
				/>
			)}
			{isIntegrations && (
				<IntegrationsModal onClose={() => navigate("/")} />
			)}
			{isOrganisations && (
				<OrganisationsModal onClose={() => navigate("/")} />
			)}
			{shareOpen && current?.isOwner && (
				<ShareDialog
					artefactId={current.id}
					isShared={Boolean(current.isShared)}
					onSharingChange={setShared}
					onClose={() => setShareOpen(false)}
				/>
			)}
		</Surface>
	);
}

function WorkspaceSidebar({
	inDrawer = false,
	artefacts,
	isLoadingArtefacts,
	folders,
	onCreateFolder,
	onRenameFolder,
	onDeleteFolder,
	onMoveArtefact,
	selectedId,
	user,
	isIntegrations,
	isOrganisations,
	onIntegrations,
	onOrganisations,
	onCreate,
	onOpenArtefact,
	onSignOut,
}: {
	/** Fills the phone drawer instead of sitting beside the page. */
	inDrawer?: boolean;
	artefacts: Artefact[];
	isLoadingArtefacts: boolean;
	folders: Folder[];
	onCreateFolder: (name: string) => Promise<unknown>;
	onRenameFolder: (id: string, name: string) => Promise<unknown>;
	onDeleteFolder: (id: string) => Promise<unknown>;
	onMoveArtefact: (id: string, folderId: string | null) => void;
	selectedId?: string;
	user: { name?: string | null; email: string; image?: string | null };
	isIntegrations: boolean;
	isOrganisations: boolean;
	onIntegrations: () => void;
	onOrganisations: () => void;
	onCreate: () => void;
	onOpenArtefact: (id: string) => void;
	onSignOut: () => void;
}) {
	const displayName = user.name || user.email;
	const { theme } = useTheme();
	return (
		<aside
			className={
				inDrawer
					? "flex h-full w-full flex-col px-4 py-5"
					: "sticky top-0 flex h-screen w-[288px] shrink-0 flex-col border-r border-border px-4 py-5"
			}
		>
			<Link
				to="/welcome"
				aria-label="Klee home"
				className="mb-5 flex h-10 items-center gap-2 px-2 text-left"
			>
				<KleeIcon className="size-10" />
				<img
					src={theme === "dark" ? "/kleelight.svg" : "/klee.svg"}
					alt="Klee"
					className="h-6 w-auto"
				/>
			</Link>
			<ListBox
				aria-label="Workspace navigation"
				selectedKeys={
					isIntegrations
						? ["integrations"]
						: isOrganisations
							? ["organisations"]
							: []
				}
				onAction={(key) =>
					key === "integrations"
						? onIntegrations()
						: key === "organisations"
							? onOrganisations()
							: onCreate()
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
				<ListBox.Item id="organisations" textValue="Organisations">
					<Building2 size={18} />
					<Label>Organisations</Label>
				</ListBox.Item>
			</ListBox>
			<Separator className="my-5" />
			<ArtefactNav
				artefacts={artefacts.map((artefact) => ({
					...artefact,
					description: artefactDescription(artefact),
					icon: artefactIcon(artefact),
				}))}
				isLoading={isLoadingArtefacts}
				folders={folders}
				selectedId={selectedId}
				onOpen={onOpenArtefact}
				onMoveArtefact={onMoveArtefact}
				onCreateFolder={onCreateFolder}
				onRenameFolder={onRenameFolder}
				onDeleteFolder={onDeleteFolder}
			/>
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
	isLoading,
	generationStatus,
	generationCommentary,
	isCommentaryStarting,
	userId,
	onClose,
	onOpenShared,
	onShare,
	followUp,
	setFollowUp,
	isRevising,
	onSubmit,
	onSave,
	onReload,
	onProjectChange,
	folders,
	onError,
}: {
	artefact?: Artefact;
	isCreating: boolean;
	isLoading: boolean;
	generationStatus: string;
	generationCommentary: string;
	isCommentaryStarting: boolean;
	userId: string;
	onClose: () => void;
	onOpenShared: (artefactId: string) => void;
	onShare: () => void;
	followUp: string;
	setFollowUp: (value: string) => void;
	isRevising: boolean;
	onSubmit: (event: FormEvent) => void;
	onSave: (content: ArtefactDocument) => Promise<SaveResult>;
	onReload: () => void;
	onProjectChange: (
		update: Pick<Artefact, "installationId" | "project">,
	) => void;
	folders: Folder[];
	onError: (message: string) => void;
}) {
	const [generationStartedAt] = useState(() => Date.now());
	const loadingLabel = isLoading ? "Loading artefact" : "Creating artefact";
	const [generationSeconds, setGenerationSeconds] = useState(0);
	useEffect(() => {
		if (!isCreating) return;
		const timer = window.setInterval(
			() =>
				setGenerationSeconds(
					Math.floor((Date.now() - generationStartedAt) / 1000),
				),
			1000,
		);
		return () => window.clearInterval(timer);
	}, [generationStartedAt, isCreating]);
	// Edit mode keeps a draft copy; `undefined` means not editing.
	const [draft, setDraft] = useState<ArtefactDocument>();
	const [isSaving, setIsSaving] = useState(false);
	const [hasConflict, setHasConflict] = useState(false);
	const [isDiscarding, setIsDiscarding] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [isCommenting, setCommenting] = useState(false);
	const [commentCount, setCommentCount] = useState(0);
	// A past version picked on the history slider; `undefined` shows the latest.
	const [pastVersion, setPastVersion] = useState<ArtefactDocument>();
	const isEditing = draft !== undefined;
	const isDirty =
		isEditing &&
		JSON.stringify(draft) !== JSON.stringify(artefact?.content);
	const historyOpen = showHistory && !isEditing;
	const canEdit = artefact?.permission === "edit";
	const canComment = Boolean(
		artefact &&
		!isEditing &&
		!historyOpen &&
		(canEdit || artefact.permission === "comment"),
	);
	const breadcrumb =
		folders.find((folder) => folder.id === artefact?.folderId)?.name ??
		"Artefacts";
	// Blocks a revision or save changed, so they can be pointed out once.
	const [seenContent, setSeenContent] = useState(artefact?.content);
	const [changedIds, setChangedIds] = useState<Set<string>>();
	if (artefact?.content !== seenContent) {
		setSeenContent(artefact?.content);
		setChangedIds(
			seenContent && artefact?.content
				? changedBlockIds(seenContent, artefact.content)
				: undefined,
		);
	}
	useEffect(() => {
		if (changedIds?.size)
			window.document
				.querySelector(".artefact-changed")
				?.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}, [changedIds]);
	const renderedArtefact = artefact && (
		<ArtefactBody
			changedIds={changedIds}
			artefact={artefact}
			document={draft ?? (historyOpen ? pastVersion : undefined)}
			canInteract={canEdit}
			edgeToEdge
			fillViewport
			onAction={setFollowUp}
			isEditing={isEditing}
			onEdit={(nodeId, path, value) =>
				setDraft(
					(current) =>
						current &&
						withEditedValue(current, nodeId, path, value),
				)
			}
		/>
	);

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
				variant="blur"
			>
				<Modal.Container
					placement="center"
					scroll="inside"
					size="cover"
				>
					<Modal.Dialog
						aria-label={
							artefact ? artefactHeading(artefact) : loadingLabel
						}
						className="relative w-full max-w-[1100px] overflow-hidden rounded-2xl p-0"
					>
						{/* Phones: title and close control on top, the other actions on a second row. */}
						<Modal.Header className="z-10 shrink-0 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-4 py-3 sm:flex-nowrap sm:px-6">
							<Modal.Heading className="order-1 flex min-w-0 flex-1 items-center gap-2">
								{artefact ? (
									<>
										<span className="hidden shrink-0 text-muted sm:inline">
											{breadcrumb}
										</span>
										<span
											aria-hidden
											className="hidden text-muted sm:inline"
										>
											/
										</span>
										<ArtefactIcon
											icon={artefactIcon(artefact)}
										/>
										<span className="truncate">
											{artefactHeading(artefact)}
										</span>
									</>
								) : (
									<span>{loadingLabel}</span>
								)}
							</Modal.Heading>
							<Toolbar
								aria-label="Artefact actions"
								className="order-3 flex w-full flex-wrap items-center gap-1 sm:order-2 sm:ml-auto sm:w-auto sm:flex-nowrap"
							>
								{artefact && !isEditing && canEdit && (
									<ProjectSelect
										artefactId={artefact.id}
										installationId={
											artefact.installationId ?? null
										}
										project={artefact.project ?? null}
										isOwner={artefact.isOwner ?? true}
										onChange={onProjectChange}
										onError={onError}
									/>
								)}
								{artefact && !isEditing && (
									<Button
										aria-label="History"
										variant={
											showHistory ? "secondary" : "ghost"
										}
										size="sm"
										onPress={() => {
											setShowHistory(!showHistory);
											setPastVersion(undefined);
										}}
									>
										<History size={15} />
										<span className="hidden sm:inline">
											History
										</span>
									</Button>
								)}
								{artefact && !isEditing && canEdit && (
									<Button
										aria-label="Edit"
										variant="ghost"
										size="sm"
										isDisabled={
											!artefact.content ||
											pastVersion !== undefined
										}
										onPress={startEditing}
									>
										<Pencil size={15} />
										<span className="hidden sm:inline">
											Edit
										</span>
									</Button>
								)}
								{artefact && !isEditing && !historyOpen && (
									<Button
										aria-label={`Comments, ${commentCount}`}
										aria-pressed={commentsOpen || isCommenting}
										variant={
											commentsOpen || isCommenting
												? "secondary"
												: "ghost"
										}
										size="sm"
										onPress={() => {
											const next = !(commentsOpen || isCommenting);
											setCommentsOpen(next);
											setCommenting(next && canComment);
										}}
									>
										<MessageCircle size={15} />
										<span className="hidden sm:inline">
											Comments
										</span>
										{commentCount > 0 && (
											<span>{commentCount}</span>
										)}
									</Button>
								)}
								{artefact && !isEditing && artefact.isOwner && (
									<Button
										aria-label="Share"
										variant="secondary"
										size="sm"
										onPress={onShare}
									>
										<Share2 size={15} />
										<span className="hidden sm:inline">
											Share
										</span>
									</Button>
								)}
							</Toolbar>
							<div className="order-2 flex items-center gap-1 sm:order-3">
								{artefact && (
									<Button
										aria-label="Open shared artefact"
										variant="ghost"
										className="size-8 min-w-8 p-0"
										onPress={() =>
											onOpenShared(artefact.id)
										}
									>
										<ExternalLink size={17} />
									</Button>
								)}
								<Button
									aria-label={
										artefact
											? "Close artefact"
											: isCreating
												? "Cancel generation"
												: "Close artefact"
									}
									variant="ghost"
									className="size-8 min-w-8 p-0"
									onPress={onClose}
								>
									<X size={17} />
								</Button>
							</div>
						</Modal.Header>
						{artefact && historyOpen && (
							<Surface
								variant="secondary"
								className="shrink-0 border-b border-border px-5 py-4 sm:px-6"
							>
								<VersionHistory
									artefactId={artefact.id}
									latestVersion={artefact.version ?? 1}
									onView={setPastVersion}
								/>
							</Surface>
						)}
						<Modal.Body className="m-0 flex min-h-0 flex-1 bg-surface p-0">
							{artefact ? (
								<ArtefactComments
									artefactId={artefact.id}
									isOwner={artefact.isOwner ?? false}
									userId={userId}
									canComment={canComment}
									isOpen={commentsOpen}
									onOpenChange={setCommentsOpen}
									isCommenting={isCommenting}
									onCommentingChange={setCommenting}
									onCountChange={setCommentCount}
								>
									<div
										aria-busy={isRevising}
										className={
											isRevising
												? "artefact-revising"
												: undefined
										}
									>
										{renderedArtefact}
									</div>
								</ArtefactComments>
							) : (
								<div className="min-h-0 flex-1 overflow-auto">
									<ArtefactSkeleton>
										<div className="space-y-1 text-sm text-muted">
											<p role="status">
												{isCreating ? (
													<>
														{generationStatus ||
															"Starting your artefact…"}
														<span
															className="ml-2 text-xs tabular-nums"
															aria-hidden="true"
														>
															{Math.floor(
																generationSeconds /
																	60,
															)}
															:
															{String(
																generationSeconds %
																	60,
															).padStart(2, "0")}
														</span>
													</>
												) : (
													"Loading artefact…"
												)}
											</p>
											{isCreating && (
												<p
													className="max-w-full overflow-hidden whitespace-nowrap"
													aria-label="AI commentary"
													aria-live="off"
												>
													<GenerationCommentary
														text={
															generationCommentary
														}
													/>
												</p>
											)}
										</div>
									</ArtefactSkeleton>
								</div>
							)}
						</Modal.Body>
						{artefact && !isCreating && isEditing && (
							<Modal.Footer className="z-10 m-0 shrink-0 flex-col gap-3 border-t border-border bg-surface px-4 py-3 sm:px-6">
								{hasConflict && (
									<Alert status="warning" className="w-full">
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Title>
												This artefact changed since you
												started editing
											</Alert.Title>
											<Alert.Description>
												Reload to get the latest
												version. Your unsaved changes
												will be lost.
											</Alert.Description>
										</Alert.Content>
										<Button
											size="sm"
											variant="secondary"
											onPress={onReload}
										>
											Reload
										</Button>
									</Alert>
								)}
								<Toolbar
									aria-label="Edit actions"
									className="flex w-full items-center justify-end gap-2"
								>
									<Paragraph
										size="sm"
										color="muted"
										className="mr-auto"
									>
										{isDirty
											? "You have unsaved changes"
											: "Click any text to edit it"}
									</Paragraph>
									<Button
										variant="ghost"
										onPress={() =>
											isDirty
												? setIsDiscarding(true)
												: stopEditing()
										}
									>
										Cancel
									</Button>
									<Button
										isDisabled={
											!isDirty || isSaving || hasConflict
										}
										onPress={() => void save()}
									>
										{isSaving ? "Saving…" : "Save"}
									</Button>
								</Toolbar>
							</Modal.Footer>
						)}
						{artefact &&
							!isCreating &&
							!isEditing &&
							canEdit &&
							!commentsOpen &&
							!isCommenting && (
								<div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 px-4 sm:px-6">
									<div className="pointer-events-auto relative mx-auto w-[70%] max-sm:w-full">
										<form
											onSubmit={onSubmit}
											className="flex w-full items-center gap-2 rounded-xl border-2 border-border bg-surface-tertiary p-1.5 pl-4 shadow-2xl ring-1 ring-foreground/10"
										>
											{isRevising ? (
												<p
													className="flex h-9 min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap text-sm text-muted"
													aria-label="AI commentary"
													aria-live="off"
												>
													<span
														className={`transition-opacity duration-200 motion-reduce:transition-none ${isCommentaryStarting ? "opacity-0" : "opacity-100"}`}
													>
														<GenerationCommentary
															text={
																generationCommentary ||
																`Updating: ${followUp}`
															}
														/>
													</span>
												</p>
											) : (
												<Input
													aria-label="Refine artefact"
													variant="secondary"
													className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none outline-none focus-visible:ring-0"
													value={followUp}
													disabled={
														pastVersion !== undefined
													}
													onChange={(event) =>
														setFollowUp(
															event.target.value,
														)
													}
													placeholder={
														pastVersion
															? "Return to the latest version to make changes"
															: "Describe what to change"
													}
												/>
											)}
											<Button
												aria-label={
													isRevising
														? "Refining artefact"
														: "Refine artefact"
												}
												type="submit"
												className="size-10 min-w-10 rounded-xl p-0"
												isPending={isRevising}
												isDisabled={
													!followUp.trim() ||
													pastVersion !== undefined
												}
											>
												{({ isPending }) =>
													isPending ? (
														<Spinner
															color="current"
															size="sm"
														/>
													) : (
														<ArrowUp size={17} />
													)
												}
											</Button>
										</form>
									</div>
								</div>
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
								<AlertDialog.Heading>
									Discard your changes?
								</AlertDialog.Heading>
							</AlertDialog.Header>
							<AlertDialog.Body>
								<Paragraph size="sm" color="muted">
									Your edits to this artefact haven't been
									saved.
								</Paragraph>
							</AlertDialog.Body>
							<AlertDialog.Footer>
								<Button
									variant="ghost"
									onPress={() => setIsDiscarding(false)}
								>
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
	fillViewport = false,
	compactHeader = false,
	isEditing = false,
	onAction,
	onEdit,
	changedIds,
}: {
	artefact: Artefact;
	/** Shown instead of the saved content, e.g. an edit draft or a past version. */
	document?: ArtefactDocument;
	canInteract: boolean;
	edgeToEdge?: boolean;
	fillViewport?: boolean;
	compactHeader?: boolean;
	isEditing?: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: unknown) => void;
	/** Blocks to flash as just changed. */
	changedIds?: Set<string>;
}) {
	const { data: session } = useSession();
	const document =
		override ??
		artefact.content ??
		fallbackDocument(artefact.prompt, artefactHeading(artefact));
	// Past versions keep their saved statuses; only the latest is live.
	const liveStatus = useLiveStatus(
		artefact.id,
		override ? undefined : artefact.content,
		Boolean(session?.user),
	);
	return (
		<ArtefactRenderer
			liveStatus={liveStatus}
			renderNode={
				changedIds?.size
					? (node, rendered) =>
							changedIds.has(node.id) ? (
								<div className="artefact-changed">{rendered}</div>
							) : (
								rendered
							)
					: undefined
			}
			document={document}
			createdAt={artefact.createdAt}
			canInteract={canInteract && !isEditing}
			edgeToEdge={edgeToEdge}
			fillViewport={fillViewport}
			compactHeader={compactHeader}
			isEditing={isEditing}
			onAction={onAction}
			onEdit={onEdit}
		/>
	);
}

function GenerationCommentary({ text }: { text: string }) {
	const cleanText = text.replace(/\*\*/g, "").trim();
	const words = cleanText.split(/\s+/).filter(Boolean);
	const period = cleanText.indexOf(".");
	const displayText =
		words.length > 20
			? period >= 0
				? cleanText.slice(0, period + 1)
				: words.slice(0, 20).join(" ")
			: cleanText;
	return (
		<span className="generation-commentary whitespace-nowrap">
			{displayText
				.split(/\s+/)
				.filter(Boolean)
				.map((word, index) => (
					<span
						key={index}
						className="generation-commentary-word"
						style={{ animationDelay: `${index * 20}ms` }}
					>
						{index > 0 && " "}
						{word}
					</span>
				))}
		</span>
	);
}
