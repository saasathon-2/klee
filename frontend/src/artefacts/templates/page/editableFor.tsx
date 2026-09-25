import type { ArtefactNode } from "../../model";
import type { EditPath, RenderContext } from "../types";
import { EditableText } from "./EditableText";

/** Binds `EditableText` to one node, so blocks can write `text(path, value, label)`. */
export function editableFor(node: ArtefactNode, context: RenderContext) {
	return (path: EditPath, value: string, label: string, multiline = false) => (
		<EditableText
			node={node}
			context={context}
			path={path}
			value={value}
			label={label}
			multiline={multiline}
		/>
	);
}
