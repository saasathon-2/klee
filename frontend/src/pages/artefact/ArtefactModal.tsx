import {
	Alert,
	AlertDialog,
	Button,
	Input,
	Modal,
	Paragraph,
	Spinner,
	Surface,
	Toolbar,
} from "@heroui/react";
import {
	ArrowUp,
	ExternalLink,
	History,
	MessageCircle,
	Pencil,
	Share2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
	changedBlockIds,
	withEditedValue,
	type ArtefactDocument,
} from "../../artefacts/model";
import { ArtefactIcon } from "./ArtefactNav";
import { ArtefactBody } from "./ArtefactBody";
import { artefactHeading, artefactIcon } from "./artefactDisplay";
import { ArtefactComments } from "./ArtefactComments";
import { ArtefactSkeleton } from "./ArtefactSkeleton";
import { GenerationCommentary } from "./GenerationCommentary";
import { ProjectSelect } from "./ProjectSelect";
import type { Artefact, SaveResult } from "./types";
import type { Folder } from "./useFolders";
import { VersionHistory } from "./VersionHistory";

export function ArtefactModal({
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
								{artefact && !historyOpen && (
									<Button
										aria-label={`Comments, ${commentCount}`}
										aria-pressed={
											commentsOpen || isCommenting
										}
										variant={
											commentsOpen || isCommenting
												? "secondary"
												: "ghost"
										}
										size="sm"
										onPress={() => {
											const next = !(
												commentsOpen || isCommenting
											);
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
													className="min-w-0 flex-1 truncate text-sm text-muted"
													aria-label="AI commentary"
													aria-live="polite"
												>
													{generationCommentary ? (
														<GenerationCommentary
															text={
																generationCommentary
															}
														/>
													) : (
														<span
															className={`transition-opacity duration-200 motion-reduce:transition-none ${isCommentaryStarting ? "opacity-0" : "opacity-100"}`}
														>
															<GenerationCommentary text="Refining artefact…" />
														</span>
													)}
												</p>
											) : (
												<Input
													aria-label="Refine artefact"
													variant="secondary"
													className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none outline-none focus-visible:ring-0"
													value={followUp}
													disabled={
														pastVersion !==
														undefined
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
