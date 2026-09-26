import {
	AlertDialog,
	Button,
	Disclosure,
	Dropdown,
	Header,
	Label,
	ListBox,
	Paragraph,
} from "@heroui/react";
import { FileText, Folder as FolderIcon, FolderPlus, MoreHorizontal } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
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
	project?: string | null;
	folderId?: string | null;
};

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
			className={`rounded-xl transition-colors ${isDropTarget ? "bg-accent-soft ring-1 ring-accent-text" : ""}`}
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
	return [...groups].filter(([project, group]) => project === null || group.length);
}

function ArtefactItems({
	label,
	artefacts,
	selectedId,
	onOpen,
}: {
	label: string;
	artefacts: NavArtefact[];
	selectedId?: string;
	onOpen: (id: string) => void;
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
				<ListBox.Item key={artefact.id} id={artefact.id} textValue={artefact.title}>
					<FileText size={16} />
					<Label>{artefact.title}</Label>
				</ListBox.Item>
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
}: {
	project: string | null;
	artefacts: NavArtefact[];
	selectedId?: string;
	onOpen: (id: string) => void;
	onUnfile: (id: string) => void;
}) {
	const dragAndDropHooks = useArtefactDragAndDrop(onUnfile);
	return (
		<ListBox
			aria-label={project ?? "Artefacts"}
			className="mt-3 rounded-xl transition-colors data-[drop-target]:bg-accent-soft data-[drop-target]:ring-1 data-[drop-target]:ring-accent-text"
			selectedKeys={selectedId ? [selectedId] : []}
			onAction={(key) => onOpen(String(key))}
			dragAndDropHooks={dragAndDropHooks}
		>
			<ListBox.Section>
				<Header>{project ?? "Artefacts"}</Header>
				{artefacts.map((artefact) => (
					<ListBox.Item key={artefact.id} id={artefact.id} textValue={artefact.title}>
						<FileText size={16} />
						<Label>{artefact.title}</Label>
					</ListBox.Item>
				))}
			</ListBox.Section>
		</ListBox>
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
}: {
	artefacts: NavArtefact[];
	folders: Folder[];
	selectedId?: string;
	onOpen: (id: string) => void;
	onMoveArtefact: (id: string, folderId: string | null) => void;
	onCreateFolder: (name: string) => Promise<unknown>;
	onRenameFolder: (id: string, name: string) => Promise<unknown>;
	onDeleteFolder: (id: string) => Promise<unknown>;
}) {
	// Which dialog is open: creating, renaming a folder, or confirming a delete.
	const [dialog, setDialog] = useState<
		{ kind: "create" } | { kind: "rename" | "delete"; folder: Folder }
	>();
	const folderIds = new Set(folders.map((folder) => folder.id));
	const unfiled = artefacts.filter(
		(artefact) => !artefact.folderId || !folderIds.has(artefact.folderId),
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

			{folders.map((folder) => {
				const contents = artefacts.filter((artefact) => artefact.folderId === folder.id);
				return (
					<FolderDropTarget
						key={folder.id}
						onDropArtefact={(id) => onMoveArtefact(id, folder.id)}
					>
						<Disclosure defaultExpanded>
							<Disclosure.Heading className="flex items-center gap-1">
								<Disclosure.Trigger className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-default">
									<Disclosure.Indicator />
									<FolderIcon size={16} className="shrink-0 text-muted" />
									<span className="min-w-0 flex-1 truncate">{folder.name}</span>
									<span className="text-xs text-muted">{contents.length}</span>
								</Disclosure.Trigger>
								<Dropdown>
									<Button
										aria-label={`${folder.name} actions`}
										variant="ghost"
										size="sm"
										className="size-7 min-w-7 p-0"
									>
										<MoreHorizontal size={16} />
									</Button>
									<Dropdown.Popover placement="bottom end">
										<Dropdown.Menu
											aria-label={`${folder.name} actions`}
											onAction={(key) =>
												setDialog({ kind: key === "delete" ? "delete" : "rename", folder })
											}
										>
											<Dropdown.Item id="rename" textValue="Rename">
												<Label>Rename</Label>
											</Dropdown.Item>
											<Dropdown.Item id="delete" textValue="Delete" variant="danger">
												<Label>Delete</Label>
											</Dropdown.Item>
										</Dropdown.Menu>
									</Dropdown.Popover>
								</Dropdown>
							</Disclosure.Heading>
							<Disclosure.Content>
								<Disclosure.Body className="pl-4">
									{contents.length ? (
										<ArtefactItems
											label={folder.name}
											artefacts={contents}
											selectedId={selectedId}
											onOpen={onOpen}
										/>
									) : (
										<Paragraph size="xs" color="muted" className="px-2 py-1.5">
											Drag artefacts here to file them.
										</Paragraph>
									)}
								</Disclosure.Body>
							</Disclosure.Content>
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
				/>
			))}

			{(dialog?.kind === "create" || dialog?.kind === "rename") && (
				<FolderDialog
					isOpen
					initialName={dialog.kind === "rename" ? dialog.folder.name : ""}
					onClose={() => setDialog(undefined)}
					onSubmit={async (name) => {
						if (dialog.kind === "rename") await onRenameFolder(dialog.folder.id, name);
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
									Delete “{dialog?.kind === "delete" ? dialog.folder.name : ""}”?
								</AlertDialog.Heading>
							</AlertDialog.Header>
							<AlertDialog.Body>
								<Paragraph size="sm" color="muted">
									The artefacts inside aren't deleted; they move back to your main list.
								</Paragraph>
							</AlertDialog.Body>
							<AlertDialog.Footer>
								<Button variant="ghost" onPress={() => setDialog(undefined)}>
									Cancel
								</Button>
								<Button
									variant="danger"
									onPress={async () => {
										if (dialog?.kind === "delete") await onDeleteFolder(dialog.folder.id);
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
