import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { safeUrl } from "./safeUrl";

/**
 * Makes a whole diagram node open its source record (a repo, service, or
 * ticket) in a new tab. Without a link it renders the node as-is.
 */
export function SourceLink({
	href,
	className,
	children,
}: {
	href?: string | null;
	className?: string;
	children: ReactNode;
}) {
	const url = safeUrl(href);
	if (!url) return <div className={className}>{children}</div>;
	return (
		<a
			href={url}
			target="_blank"
			rel="noreferrer"
			// React Flow would otherwise treat the press as the start of a pan.
			className={`nodrag nopan group/source cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus ${className ?? ""}`}
		>
			{children}
			<ArrowUpRight
				aria-hidden
				size={14}
				className="absolute top-2 right-2 text-muted opacity-0 transition-opacity group-hover/source:opacity-100 group-focus-visible/source:opacity-100"
			/>
		</a>
	);
}
