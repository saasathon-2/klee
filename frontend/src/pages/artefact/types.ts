import type { ArtefactDocument } from "../../artefacts/model";

export type Revision = {
	id: string;
	content: string;
	generatedContent?: ArtefactDocument;
	createdAt: string;
};

export type Artefact = {
	id: string;
	isShared?: boolean;
	prompt: string;
	title: string;
	description?: string;
	icon?: string;
	createdAt: string;
	content?: ArtefactDocument;
	revisions?: Revision[];
	version?: number;
	isOwner?: boolean;
	permission?: "view" | "comment" | "edit";
	project?: string | null;
	installationId?: string | null;
	folderId?: string | null;
};

export type SaveResult = "saved" | "conflict" | "failed";
