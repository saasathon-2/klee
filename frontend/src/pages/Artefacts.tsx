import {
	Button,
	Drawer,
	Spinner,
	Surface,
	TextArea,
	Toolbar,
} from "@heroui/react";
import {
	ArrowUp,
	BrainCog,
	Check,
	Copy,
	FileText,
	House,
	MessageCircle,
	PanelLeftClose,
	PanelLeftOpen,
	Pencil,
	Plug,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useDrop } from "react-aria-components";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { KleeLogo } from "../components/KleeLogo";
import { LinkChips } from "../components/LinkChips";
import { PageLoader } from "../components/PageLoader";
import { takeLinkPaste } from "../lib/links";
import type { ArtefactDocument } from "../artefacts/model";
import { developerExamplePrompts } from "../artefacts/examplePrompts";
import { ThemeToggle } from "../components/ThemeToggle";
import { IntegrationsModal, type GoogleFile } from "./Integrations";
import { OrganisationsModal } from "./Organisations";
import { useMediaQuery } from "../lib/use-media-query";
import { ArtefactSkeleton } from "./artefact/ArtefactSkeleton";
import { ArtefactBody } from "./artefact/ArtefactBody";
import { artefactHeading } from "./artefact/artefactDisplay";
import { ArtefactModal } from "./artefact/ArtefactModal";
import type { Artefact, Revision, SaveResult } from "./artefact/types";
import { WorkspaceSidebar as WorkspaceSidebarComponent } from "./artefact/WorkspaceSidebar";
import { acceptArtefactDrop, droppedArtefactId } from "./artefact/artefactDrag";
import { useFolders } from "./artefact/useFolders";
import { ArtefactComments } from "./artefact/ArtefactComments";
import { ShareDialog } from "./artefact/ShareDialog";
import { useDocumentTitle } from "../useDocumentTitle";

const desktopQuery = "(min-width: 768px)";

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

function greetingFor(date: Date) {
	const hour = date.getHours();
	if (hour < 5) return "Night shift";
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	if (hour < 22) return "Good evening";
	return "Night shift";
}

function textareaCaretPoint(textarea: HTMLTextAreaElement) {
	const styles = getComputedStyle(textarea);
	const mirror = document.createElement("div");
	const marker = document.createElement("span");
	for (const property of [
		"box-sizing",
		"width",
		"font-family",
		"font-size",
		"font-weight",
		"letter-spacing",
		"line-height",
		"padding",
		"border",
		"text-transform",
		"text-indent",
		"text-align",
		"word-break",
		"overflow-wrap",
		"tab-size",
	])
		mirror.style.setProperty(property, styles.getPropertyValue(property));
	mirror.style.cssText +=
		";position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;";
	mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
	marker.textContent = textarea.value[textarea.selectionStart] || "\u200b";
	mirror.append(marker);
	document.body.append(mirror);
	const inputBox = textarea.getBoundingClientRect();
	const mirrorBox = mirror.getBoundingClientRect();
	const markerBox = marker.getBoundingClientRect();
	mirror.remove();
	return {
		x:
			inputBox.left +
			markerBox.left -
			mirrorBox.left -
			textarea.scrollLeft,
		y:
			inputBox.top +
			markerBox.top -
			mirrorBox.top -
			textarea.scrollTop +
			markerBox.height / 2,
	};
}

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
	const [promptCaret, setPromptCaret] = useState<{ x: number; y: number }>();
	const [googleFiles, setGoogleFiles] = useState<GoogleFile[]>([]);
	const [localTime, setLocalTime] = useState(() => new Date());
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
	const promptCaretTimer = useRef<number | undefined>(undefined);
	function followPromptCaret(textarea: HTMLTextAreaElement) {
		setPromptCaret(textareaCaretPoint(textarea));
		window.clearTimeout(promptCaretTimer.current);
		promptCaretTimer.current = window.setTimeout(
			() => setPromptCaret(undefined),
			1000,
		);
	}
	useEffect(() => () => window.clearTimeout(promptCaretTimer.current), []);
	useEffect(() => {
		const timer = window.setInterval(
			() => setLocalTime(new Date()),
			60_000,
		);
		return () => window.clearInterval(timer);
	}, []);
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
		const privatePath =
			isShared && viewerId && !snapshotToken
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
	}, [
		artefactPath,
		isShared,
		loaded?.path,
		shareId,
		snapshotToken,
		viewerId,
	]);

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
		const fullPrompt = [prompt.trim(), ...promptLinks]
			.filter(Boolean)
			.join("\n");
		if (!fullPrompt || isCreating) return;
		const controller = new AbortController();
		generationAbort.current = controller;
		setIsCreating(true);
		setGenerationStatus("Starting your brief…");
		setGenerationCommentary("");
		setError("");
		const googleFileIds = googleFiles.map((file) => file.id);
		setGoogleFiles([]);
		try {
			const response = await api("/artefacts/stream", {
				method: "POST",
				body: JSON.stringify({ prompt: fullPrompt, googleFileIds }),
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

	if (isPending && !isShared) return <PageLoader />;
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
									onPress={() =>
										navigate(`/?artefact=${current.id}`)
									}
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
										.then(() =>
											setCopiedSharedLinkId(current.id),
										)
										.catch(() =>
											setError(
												"Could not copy the artefact link.",
											),
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
								variant={
									sharedCommentsOpen ? "secondary" : "ghost"
								}
								size="sm"
								className="border border-border bg-background text-foreground shadow-sm hover:bg-surface"
								onPress={() =>
									setSharedCommentsOpen(!sharedCommentsOpen)
								}
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
	const greeting = greetingFor(localTime);
	// On phones, picking something also closes the drawer.
	const go = (path: string) => {
		navigate(path);
		if (!isDesktop) setSidebarOpen(false);
	};
	const sidebar = (
		<WorkspaceSidebarComponent
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
							<KleeLogo
								className="mx-auto mb-4 size-16"
								lookAt={promptCaret}
							/>
							<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
								{greeting},{" "}
								<span className="text-accent-text">
									{user.name?.split(" ")[0] || "there"}
								</span>
								{greeting === "Night shift" ? "?" : "!"}
							</h1>
						</div>
						<form onSubmit={create} className="w-full">
							<Surface className="rounded-2xl border border-border bg-surface p-3 transition-colors focus-within:border-muted">
								<LinkChips
									links={promptLinks}
									onRemove={(link) =>
										setPromptLinks((links) =>
											links.filter(
												(item) => item !== link,
											),
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
									onChange={(event) => {
										setPrompt(event.target.value);
										followPromptCaret(event.currentTarget);
									}}
									onSelect={(event) =>
										followPromptCaret(event.currentTarget)
									}
									placeholder="What would you like to make? Paste a PR, issue, or a question…"
									className="min-h-28 w-full resize-none border-0 bg-transparent px-1 py-1 text-lg leading-7 shadow-none outline-none placeholder:text-muted focus-visible:ring-0"
								/>
								<Toolbar
									aria-label="Create artefact controls"
									className="flex w-full items-center justify-between px-1 pt-1"
								>
									{googleFiles.length ? (
										<div className="flex min-w-0 items-center gap-2 text-xs text-muted">
											<FileText size={15} />
											<span className="truncate">
												{googleFiles.length === 1
													? `${googleFiles[0].name} will be used`
													: `${googleFiles.length} Google files will be used`}
											</span>
											<Button
												size="sm"
												variant="ghost"
												onPress={() =>
													setGoogleFiles([])
												}
											>
												Clear
											</Button>
										</div>
									) : (
										<Button
											size="sm"
											variant="ghost"
											onPress={() =>
												navigate("/?panel=integrations&select=google")
											}
										>
											<FileText size={15} />
											Add Google files
										</Button>
									)}
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
												<Spinner
													color="current"
													size="sm"
												/>
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
				<IntegrationsModal
					onClose={() => navigate("/")}
					onGoogleFilesSelected={setGoogleFiles}
				/>
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
