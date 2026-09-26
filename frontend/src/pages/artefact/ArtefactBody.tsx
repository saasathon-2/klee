import { useSession } from "../../lib/auth-client";
import { fallbackDocument, type ArtefactDocument } from "../../artefacts/model";
import { ArtefactRenderer } from "../../artefacts/templates/renderer";
import { useLiveStatus } from "../../artefacts/templates/page/liveStatus";
import type { EditPath } from "../../artefacts/templates/types";
import { artefactHeading } from "./artefactDisplay";
import type { Artefact } from "./types";

export function ArtefactBody({
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
	document?: ArtefactDocument;
	canInteract: boolean;
	edgeToEdge?: boolean;
	fillViewport?: boolean;
	compactHeader?: boolean;
	isEditing?: boolean;
	onAction?: (label: string) => void;
	onEdit?: (nodeId: string, path: EditPath, value: unknown) => void;
	changedIds?: Set<string>;
}) {
	const { data: session } = useSession();
	const document =
		override ??
		artefact.content ??
		fallbackDocument(artefact.prompt, artefactHeading(artefact));
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
								<div className="artefact-changed">
									{rendered}
								</div>
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
