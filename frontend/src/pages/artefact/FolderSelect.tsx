import { ListBox, Select } from "@heroui/react";
import type { Folder } from "./useFolders";

const noFolder = "none";

/** Files the open artefact into one of the user's folders. */
export function FolderSelect({
	folderId,
	folders,
	onChange,
}: {
	folderId: string | null;
	folders: Folder[];
	onChange: (folderId: string | null) => void;
}) {
	if (folders.length === 0) return null;
	return (
		<Select
			aria-label="Folder"
			className="min-w-0 flex-1 sm:w-44 sm:flex-none"
			value={folderId ?? noFolder}
			onChange={(key) => onChange(key === noFolder ? null : String(key))}
		>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					<ListBox.Item id={noFolder} textValue="No folder">
						No folder
					</ListBox.Item>
					{folders.map((folder) => (
						<ListBox.Item key={folder.id} id={folder.id} textValue={folder.name}>
							{folder.name}
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
