import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { ArtefactNode } from "../../model";
import type { EditPath, RenderContext } from "../types";

/**
 * Renders artefact copy as inline editable text, preserving the type and flow
 * of the surrounding content while edit mode is active.
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
	const element = useRef<HTMLSpanElement>(null);
	useLayoutEffect(() => {
		if (
			element.current &&
			document.activeElement !== element.current &&
			element.current.textContent !== value
		)
			element.current.textContent = value;
	}, [context.isEditing, value]);
	if (!context.isEditing || !context.onEdit) return <>{children ?? value}</>;

	return (
		<span
			ref={element}
			contentEditable
			suppressContentEditableWarning
			role="textbox"
			aria-label={label}
			aria-multiline={multiline || undefined}
			title={`Edit ${label}`}
			onInput={(event) =>
				context.onEdit?.(
					node.id,
					path,
					event.currentTarget.textContent ?? "",
				)
			}
			onKeyDown={(event) => {
				if (!multiline && event.key === "Enter") {
					event.preventDefault();
					event.currentTarget.blur();
				}
			}}
			className={`inline-block min-w-[1ch] rounded-sm px-0.5 -mx-0.5 outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5 focus:ring-1 focus:ring-brand/40 ${multiline ? "w-full whitespace-pre-wrap" : ""} ${className ?? ""}`}
		/>
	);
}
