import { Button, Label, ListBox, Popover, Separator } from "@heroui/react";
import { Building2, LogOut, Plug, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { KleeIcon } from "../../components/KleeLogo";
import { UserAvatar } from "../../components/UserAvatar";
import { useTheme } from "../../lib/use-theme";
import { ArtefactNav } from "./ArtefactNav";
import { artefactDescription, artefactIcon } from "./artefactDisplay";
import type { Folder } from "./useFolders";
import type { Artefact } from "./types";

export function WorkspaceSidebar({
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
						className="h-auto w-full justify-start gap-2 rounded-xl px-2 py-2 text-left"
					>
						<UserAvatar
							image={user.image}
							name={displayName}
							size="md"
						/>
						<span className="min-w-0">
							<span className="block truncate text-sm font-semibold">
								{displayName}
							</span>
							<span className="block truncate text-xs text-muted">
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
