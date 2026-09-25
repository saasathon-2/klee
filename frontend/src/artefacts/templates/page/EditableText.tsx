import { Input, TextArea, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import type { ArtefactNode } from "../../model";
import type { EditPath, RenderContext } from "../types";

/**
 * A text field in an artefact. Renders `children` (or the value) normally and
 * a HeroUI text field while the artefact is being edited.
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
	/** Accessible name for the field, e.g. "Task title". */
	label: string;
	multiline?: boolean;
	className?: string;
	children?: ReactNode;
}) {
	if (!context.isEditing || !context.onEdit)
		return <>{children ?? value}</>;
	return (
		<TextField
			aria-label={label}
			value={value}
			onChange={(next) => context.onEdit?.(node.id, path, next)}
			className={`w-full ${className ?? ""}`}
		>
			{multiline ? (
				<TextArea
					fullWidth
					// Roughly one row per phone-width line, so text isn't hidden behind a scroll.
					rows={Math.min(8, Math.max(2, Math.ceil(value.length / 30)))}
					className="resize-y"
				/>
			) : (
				<Input fullWidth />
			)}
		</TextField>
	);
}
