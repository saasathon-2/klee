import { Heading, Paragraph } from "@heroui/react";
import type { ReactNode } from "react";

/** Shared padding and heading for every content block. */
export function BlockSection({
	title,
	description,
	action,
	children,
}: {
	title?: string;
	description?: string;
	action?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<section className="px-6 py-8 sm:px-10">
			{(title || action) && (
				<div className="mb-5 flex items-start justify-between gap-4">
					<div className="min-w-0">
						{title && <Heading level={3}>{title}</Heading>}
						{description && (
							<Paragraph color="muted" className="mt-1 max-w-3xl">
								{description}
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
