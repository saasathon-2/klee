import { Heading, Paragraph } from "@heroui/react";
import type { ReactNode } from "react";
import type { ArtefactNode } from "../../model";
import type { RenderContext } from "../types";
import { EditableText } from "./EditableText";

/**
 * Shared padding and heading for every content block. Pass `edit` to make the
 * title and description editable; each is only editable when it is the node's
 * own `data.title` / `data.description`, not text computed by the block.
 */
export function BlockSection({
	title,
	description,
	action,
	edit,
	children,
}: {
	title?: string;
	description?: string;
	action?: ReactNode;
	edit?: { node: ArtefactNode; context: RenderContext };
	children?: ReactNode;
}) {
	const titleEdit = edit?.node.data.title === title ? edit : undefined;
	const descriptionEdit =
		edit?.node.data.description === description ? edit : undefined;
	return (
		<section className="px-6 py-8 sm:px-10">
			{(title || action) && (
				<div className="mb-5 flex items-start justify-between gap-4">
					<div className="min-w-0 flex-1">
						{title && (
							<Heading level={3}>
								{titleEdit ? (
									<EditableText {...titleEdit} path={["title"]} value={title} label="Section title" />
								) : (
									title
								)}
							</Heading>
						)}
						{description && (
							<Paragraph color="muted" className="mt-1 max-w-3xl">
								{descriptionEdit ? (
									<EditableText
										{...descriptionEdit}
										path={["description"]}
										value={description}
										label="Section description"
										multiline
									/>
								) : (
									description
								)}
							</Paragraph>
						)}
					</div>
					{action}
				</div>
			)}
			{children}
		</section>
	);
}
