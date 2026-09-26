import {
	AlertDialog,
	Button,
	Disclosure,
	Dropdown,
	Label,
	ListBox,
	Paragraph,
	Skeleton,
} from "@heroui/react";
import {
	CalendarCheck,
	ChartNoAxesCombined,
	FileText,
	Folder as FolderIcon,
	FolderOpen,
	FolderPlus,
	GitBranch,
	GitPullRequest,
	Lightbulb,
	ListTodo,
	MessageSquare,
	MoreHorizontal,
	Rocket,
	Workflow,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDrop } from "react-aria-components";
import {
	acceptArtefactDrop,
	droppedArtefactId,
	useArtefactDragAndDrop,
} from "./artefactDrag";
import { FolderDialog } from "./FolderDialog";
import type { Folder } from "./useFolders";

type NavArtefact = {
	id: string;
	title: string;
	description?: string;
	icon?: string;
	project?: string | null;
	folderId?: string | null;
};

type Preview = { artefact: NavArtefact; x: number; y: number };

const artefactIcons = {
	"git-pull-request": GitPullRequest,
	"git-branch": GitBranch,
	workflow: Workflow,
	"message-square": MessageSquare,
	"calendar-check": CalendarCheck,
	rocket: Rocket,
	"chart-no-axes-combined": ChartNoAxesCombined,
	lightbulb: Lightbulb,
	"list-todo": ListTodo,
};

export function ArtefactIcon({ icon }: { icon?: string }) {
	const Icon = artefactIcons[icon as keyof typeof artefactIcons] ?? FileText;
	return <Icon size={16} className="shrink-0" />;
}

function ArtefactListItem({
	artefact,
	onPreview,
	onMovePreview,
	onHidePreview,
}: {
	artefact: NavArtefact;
	onPreview: (artefact: NavArtefact, x: number, y: number) => void;
	onMovePreview: (x: number, y: number) => void;
	onHidePreview: () => void;
}) {
	return (
		<ListBox.Item
			id={artefact.id}
			textValue={artefact.title}
			className="h-8 min-h-8 max-h-8 min-w-0 overflow-hidden rounded-xl px-3 data-[dragging]:scale-[.98] data-[dragging]:opacity-55"
			onPointerEnter={(event) =>
				onPreview(artefact, event.clientX, event.clientY)
			}
			onPointerMove={(event) =>
				onMovePreview(event.clientX, event.clientY)
			}
			onPointerLeave={onHidePreview}
		>
			<ArtefactIcon icon={artefact.icon} />
			<Label className="min-w-0 flex-1 truncate whitespace-nowrap text-left">
				{artefact.title}
			</Label>
		</ListBox.Item>
	);
}

/** A folder in the sidebar that files artefacts dropped onto it. */
function FolderDropTarget({
	onDropArtefact,
	children,
}: {
	onDropArtefact: (id: string) => void;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const { dropProps, isDropTarget } = useDrop({
		ref,
		getDropOperation: acceptArtefactDrop,
		onDrop: async ({ items }) => {
			const id = await droppedArtefactId(items);
			if (id) onDropArtefact(id);
		},
	});
	return (
		<div
			ref={ref}
			{...dropProps}
			className={`rounded-xl transition-colors ${isDropTarget ? "bg-accent-soft ring-2 ring-accent-text" : ""}`}
		>
			{children}
		</div>
	);
}

/** Unfiled artefacts without a project first, then one group per GitHub org. */
function groupByProject(artefacts: NavArtefact[]) {
	const groups = new Map<string | null, NavArtefact[]>([[null, []]]);
	for (const artefact of artefacts) {
		const project = artefact.project ?? null;
		groups.set(project, [...(groups.get(project) ?? []), artefact]);
	}
	return [...groups].filter(
		([project, group]) => project === null || group.length,
	);
}

function ArtefactItems({
	label,
	artefacts,
	selectedId,
	onOpen,
	onPreview,
	onMovePreview,
	onHidePreview,
}: {
	label: string;
	artefacts: NavArtefact[];
	selectedId?: string;
	onOpen: (id: string) => void;
	onPreview: (artefact: NavArtefact, x: number, y: number) => void;
	onMovePreview: (x: number, y: number) => void;
	onHidePreview: () => void;
}) {
	const dragAndDropHooks = useArtefactDragAndDrop();
	return (
		<ListBox
			aria-label={label}
			selectedKeys={selectedId ? [selectedId] : []}
			onAction={(key) => onOpen(String(key))}
			dragAndDropHooks={dragAndDropHooks}
		>
			{artefacts.map((artefact) => (
				<ArtefactListItem
					key={artefact.id}
					artefact={artefact}
					onPreview={onPreview}
					onMovePreview={onMovePreview}
					onHidePreview={onHidePreview}
				/>
			))}
		</ListBox>
	);
}

/** One group of unfiled artefacts; dropping an artefact here unfiles it. */
function UnfiledGroup({
	project,
	artefacts,
	selectedId,
	onOpen,
	onUnfile,
	onPreview,
	onMovePreview,
	onHidePreview,
}: {
	project: string | null;
	artefacts: NavArtefact[];
	selectedId?: string;
	onOpen: (id: string) => void;
	onUnfile: (id: string) => void;
	onPreview: (artefact: NavArtefact, x: number, y: number) => void;
	onMovePreview: (x: number, y: number) => void;
	onHidePreview: () => void;
}) {
	const dragAndDropHooks = useArtefactDragAndDrop(onUnfile);
	return (
		<div className="mt-3">
			<Disclosure defaultExpanded>
				<Disclosure.Heading className="flex h-8 items-center rounded-xl hover:bg-default focus-within:bg-default">
					<Disclosure.Trigger className="flex h-full w-full items-center gap-2 rounded-xl px-1 text-left">
						<Paragraph
							size="xs"
							color="muted"
							weight="medium"
							className="min-w-0 flex-1 truncate"
						>
							{project ?? "Artefacts"}
						</Paragraph>
						<Disclosure.Indicator />
					</Disclosure.Trigger>
				</Disclosure.Heading>
				<Disclosure.Content>
					<Disclosure.Body className="-m-2">
						<ListBox
							aria-label={project ?? "Artefacts"}
							className="rounded-xl transition-colors data-[drop-target]:bg-accent-soft data-[drop-target]:ring-2 data-[drop-target]:ring-accent-text"
							selectedKeys={selectedId ? [selectedId] : []}
							onAction={(key) => onOpen(String(key))}
							dragAndDropHooks={dragAndDropHooks}
						>
							{artefacts.map((artefact) => (
								<ArtefactListItem
									key={artefact.id}
									artefact={artefact}
									onPreview={onPreview}
									onMovePreview={onMovePreview}
									onHidePreview={onHidePreview}
								/>
							))}
						</ListBox>
						{!artefacts.length && (
							<Paragraph size="xs" color="muted" className="px-2 py-1.5">
								No unfiled artefacts.
							</Paragraph>
						)}
					</Disclosure.Body>
				</Disclosure.Content>
			</Disclosure>
		</div>
	);
}

/**
 * The sidebar's artefact list: the user's folders (collapsible, with rename
 * and delete), then everything unfiled, grouped by GitHub project as before.
 * Artefacts drag between folders and the unfiled list to move them.
 */
export function ArtefactNav({
	artefacts,
	folders,
	selectedId,
	onOpen,
	onMoveArtefact,
	onCreateFolder,
	onRenameFolder,
	onDeleteFolder,
	isLoading = false,
}: {
	artefacts: NavArtefact[];
	folders: Folder[];
	selectedId?: string;
	onOpen: (id: string) => void;
	onMoveArtefact: (id: string, folderId: string | null) => void;
	onCreateFolder: (name: string) => Promise<unknown>;
	onRenameFolder: (id: string, name: string) => Promise<unknown>;
	onDeleteFolder: (id: string) => Promise<unknown>;
	isLoading?: boolean;
}) {
	// Which dialog is open: creating, renaming a folder, or confirming a delete.
	const [dialog, setDialog] = useState<
		{ kind: "create" } | { kind: "rename" | "delete"; folder: Folder }
	>();
	const [preview, setPreview] = useState<Preview>();
	const showPreview = (artefact: NavArtefact, x: number, y: number) => {
		setPreview({ artefact, x, y });
	};
	const movePreview = (x: number, y: number) =>
		setPreview((current) => current && { ...current, x, y });
	const folderIds = new Set(folders.map((folder) => folder.id));
	const unfiled = artefacts.filter(
		(artefact) => !artefact.folderId || !folderIds.has(artefact.folderId),
	);

	if (isLoading)
		return (
			<div
				role="status"
				aria-label="Loading artefacts"
				className="min-h-0 flex-1 space-y-2 px-2"
			>
				{[70, 55, 80, 60, 45].map((width, index) => (
					<Skeleton
						key={index}
						animationType="pulse"
						className="h-8 rounded-lg"
						style={{ width: `${width}%` }}
					/>
				))}
			</div>
		);

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<div className="mb-1 flex items-center justify-between px-2">
				<Paragraph size="xs" color="muted" weight="medium">
					Folders
				</Paragraph>
				<Button
					aria-label="New folder"
					variant="ghost"
					size="sm"
					className="size-7 min-w-7 p-0"
					onPress={() => setDialog({ kind: "create" })}
				>
					<FolderPlus size={16} />
				</Button>
			</div>
			{!folders.length && (
				<Paragraph size="xs" color="muted" className="px-2 py-1.5">
					No folders yet.
				</Paragraph>
			)}

			{folders.map((folder) => {
				const contents = artefacts.filter(
					(artefact) => artefact.folderId === folder.id,
				);
				return (
					<FolderDropTarget
						key={folder.id}
						onDropArtefact={(id) => onMoveArtefact(id, folder.id)}
					>
						<Disclosure defaultExpanded>
							{({ isExpanded }) => (
								<>
									<Disclosure.Heading className="group/folder flex h-10 items-center rounded-xl hover:bg-default focus-within:bg-default">
										<Disclosure.Trigger className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-left text-sm">
											<Disclosure.Indicator />
											{isExpanded ? (
												<FolderOpen
													size={16}
													className="shrink-0 text-muted"
												/>
											) : (
												<FolderIcon
													size={16}
													className="shrink-0 text-muted"
												/>
											)}
											<span className="min-w-0 flex-1 truncate whitespace-nowrap">
												{folder.name}
											</span>
											<span className="text-xs text-muted">
												{contents.length}
											</span>
										</Disclosure.Trigger>
										<Dropdown>
											<Button
												aria-label={`${folder.name} actions`}
												variant="ghost"
												size="sm"
												className="h-7 !w-0 !min-w-0 overflow-hidden p-0 opacity-0 pointer-events-none transition-[width,opacity] duration-150 group-hover/folder:!w-7 group-hover/folder:!min-w-7 group-hover/folder:pointer-events-auto group-hover/folder:opacity-100 group-focus-within/folder:!w-7 group-focus-within/folder:!min-w-7 group-focus-within/folder:pointer-events-auto group-focus-within/folder:opacity-100 focus:!w-7 focus:!min-w-7 focus:pointer-events-auto focus:opacity-100"
											>
												<MoreHorizontal size={16} />
											</Button>
											<Dropdown.Popover placement="bottom end">
												<Dropdown.Menu
													aria-label={`${folder.name} actions`}
													onAction={(key) =>
														setDialog({
															kind:
																key === "delete"
																	? "delete"
																	: "rename",
															folder,
														})
													}
												>
													<Dropdown.Item
														id="rename"
														textValue="Rename"
													>
														<Label>Rename</Label>
													</Dropdown.Item>
													<Dropdown.Item
														id="delete"
														textValue="Delete"
														variant="danger"
													>
														<Label>Delete</Label>
													</Dropdown.Item>
												</Dropdown.Menu>
											</Dropdown.Popover>
										</Dropdown>
									</Disclosure.Heading>
									<Disclosure.Content>
										<Disclosure.Body className="-m-2 ml-2">
											{contents.length ? (
												<ArtefactItems
													label={folder.name}
													artefacts={contents}
													selectedId={selectedId}
													onOpen={onOpen}
													onPreview={showPreview}
													onMovePreview={movePreview}
													onHidePreview={() =>
														setPreview(undefined)
													}
												/>
											) : (
												<Paragraph
													size="xs"
													color="muted"
													className="px-2 py-1.5"
												>
													Drag artefacts here to file
													them.
												</Paragraph>
											)}
										</Disclosure.Body>
									</Disclosure.Content>
								</>
							)}
						</Disclosure>
					</FolderDropTarget>
				);
			})}

			{groupByProject(unfiled).map(([project, group]) => (
				<UnfiledGroup
					key={project ?? "own"}
					project={project}
					artefacts={group}
					selectedId={selectedId}
					onOpen={onOpen}
					onUnfile={(id) => onMoveArtefact(id, null)}
					onPreview={showPreview}
					onMovePreview={movePreview}
					onHidePreview={() => setPreview(undefined)}
				/>
			))}
			{preview &&
				createPortal(
					<div
						aria-hidden
						className="pointer-events-none fixed z-50 w-64 rounded-xl border border-divider bg-surface p-3 shadow-xl"
						style={{ left: preview.x + 16, top: preview.y + 16 }}
					>
						<div className="flex items-center gap-2">
							<ArtefactIcon icon={preview.artefact.icon} />
							<p className="truncate text-sm font-semibold">
								{preview.artefact.title}
							</p>
						</div>
						<p className="line-clamp-2 text-xs leading-5 text-muted">
							{preview.artefact.description ||
								"No description available."}
						</p>
					</div>,
					document.body,
				)}

			{(dialog?.kind === "create" || dialog?.kind === "rename") && (
				<FolderDialog
					isOpen
					initialName={
						dialog.kind === "rename" ? dialog.folder.name : ""
					}
					onClose={() => setDialog(undefined)}
					onSubmit={async (name) => {
						if (dialog.kind === "rename")
							await onRenameFolder(dialog.folder.id, name);
						else await onCreateFolder(name);
					}}
				/>
			)}
			<AlertDialog>
				<AlertDialog.Backdrop
					isOpen={dialog?.kind === "delete"}
					onOpenChange={(open) => {
						if (!open) setDialog(undefined);
					}}
				>
					<AlertDialog.Container>
						<AlertDialog.Dialog>
							<AlertDialog.Header>
								<AlertDialog.Icon status="danger" />
								<AlertDialog.Heading>
									Delete “
									{dialog?.kind === "delete"
										? dialog.folder.name
										: ""}
									”?
								</AlertDialog.Heading>
							</AlertDialog.Header>
							<AlertDialog.Body>
								<Paragraph size="sm" color="muted">
									The artefacts inside aren't deleted; they
									move back to your main list.
								</Paragraph>
							</AlertDialog.Body>
							<AlertDialog.Footer>
								<Button
									variant="ghost"
									onPress={() => setDialog(undefined)}
								>
									Cancel
								</Button>
								<Button
									variant="danger"
									onPress={async () => {
										if (dialog?.kind === "delete")
											await onDeleteFolder(
												dialog.folder.id,
											);
										setDialog(undefined);
									}}
								>
									Delete folder
								</Button>
							</AlertDialog.Footer>
						</AlertDialog.Dialog>
					</AlertDialog.Container>
				</AlertDialog.Backdrop>
			</AlertDialog>
		</div>
	);
}
