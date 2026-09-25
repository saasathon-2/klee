import { Button, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { useState, type FormEvent } from "react";

/** Names a new folder, or renames an existing one. */
export function FolderDialog({
	isOpen,
	initialName = "",
	onClose,
	onSubmit,
}: {
	isOpen: boolean;
	/** Set when renaming; empty when creating. */
	initialName?: string;
	onClose: () => void;
	onSubmit: (name: string) => Promise<void>;
}) {
	const [name, setName] = useState(initialName);
	const [isSaving, setIsSaving] = useState(false);
	const isRename = Boolean(initialName);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!name.trim() || isSaving) return;
		setIsSaving(true);
		await onSubmit(name.trim());
		setIsSaving(false);
		onClose();
	}

	return (
		<Modal>
			<Modal.Backdrop
				isOpen={isOpen}
				onOpenChange={(open) => {
					if (!open) onClose();
				}}
			>
				<Modal.Container placement="center" size="sm">
					<Modal.Dialog aria-label={isRename ? "Rename folder" : "New folder"}>
						<Form onSubmit={submit}>
							<Modal.Header>
								<Modal.Heading>{isRename ? "Rename folder" : "New folder"}</Modal.Heading>
							</Modal.Header>
							<Modal.Body>
								<TextField
									value={name}
									onChange={setName}
									isRequired
									autoFocus
									maxLength={80}
									className="flex flex-col gap-1.5"
								>
									<Label>Name</Label>
									<Input fullWidth placeholder="e.g. Sprint 12" />
								</TextField>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="ghost" onPress={onClose}>
									Cancel
								</Button>
								<Button type="submit" isDisabled={!name.trim() || isSaving}>
									{isRename ? "Save" : "Create folder"}
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
