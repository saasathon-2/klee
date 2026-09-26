import {
	isTextDropItem,
	useDragAndDrop,
	type DragTypes,
	type DropItem,
	type DropOperation,
} from "react-aria-components";

/** Drag type carrying an artefact id from the sidebar to a drop target. */
const artefactDragType = "application/x-klee-artefact";

/** Accepts sidebar artefact drags and refuses everything else. */
export const acceptArtefactDrop = (types: DragTypes): DropOperation =>
	types.has(artefactDragType) ? "move" : "cancel";

/** The id of the artefact in a drop, if it came from the sidebar. */
export async function droppedArtefactId(items: DropItem[]) {
	const item = items.find(
		(dropItem) => isTextDropItem(dropItem) && dropItem.types.has(artefactDragType),
	);
	return item && isTextDropItem(item) ? item.getText(artefactDragType) : undefined;
}

/**
 * Makes a sidebar list's artefacts draggable. With `onDropArtefact`, the list
 * also accepts artefacts dragged in from other lists.
 */
export function useArtefactDragAndDrop(onDropArtefact?: (id: string) => void) {
	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (keys) => [...keys].map((key) => ({ [artefactDragType]: String(key) })),
		...(onDropArtefact && {
			acceptedDragTypes: [artefactDragType],
			onRootDrop: async ({ items }) => {
				const id = await droppedArtefactId(items);
				if (id) onDropArtefact(id);
			},
		}),
	});
	return dragAndDropHooks;
}
