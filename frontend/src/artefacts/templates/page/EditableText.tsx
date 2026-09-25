import { Input, TextArea } from "@heroui/react";
import type { ReactNode } from "react";
import type { ArtefactNode } from "../../model";
import type { EditPath, RenderContext } from "../types";

/**
 * A text field in an artefact. Renders `children` (or the value) normally and
 * a borderless HeroUI input while the artefact is being edited.
 */
export function EditableText({
	node,
	context,
	path,
	value,
	label,
	multiline = false,
	className,
	children,
}: {
	node: ArtefactNode;
	context: RenderContext;
	path: EditPath;
	value: string;
	/** Accessible name for the input, e.g. "Task title". */
	label: string;
	multiline?: boolean;
	className?: string;
	children?: ReactNode;
}) {
	if (!context.isEditing || !context.onEdit)
		return <>{children ?? value}</>;
	const onChange = (next: string) => context.onEdit?.(node.id, path, next);
	const field = `w-full bg-transparent px-1 text-inherit ${className ?? ""}`;
	return multiline ? (
		<TextArea
			aria-label={label}
			variant="secondary"
			value={value}
			rows={Math.max(2, Math.ceil(value.length / 80))}
			onChange={(event) => onChange(event.target.value)}
			className={`${field} resize-y`}
		/>
	) : (
		<Input
			aria-label={label}
			variant="secondary"
			value={value}
			onChange={(event) => onChange(event.target.value)}
			className={field}
		/>
	);
}
