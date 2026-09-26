import type { ReactNode } from "react";
import { safeUrl } from "./safeUrl";

/** Underlined link to a source record, or its children when there is no link. */
export function ExternalLink({
	href,
	className,
	children,
}: {
	href?: string | null;
	className?: string;
	children: ReactNode;
}) {
	const url = safeUrl(href);
	if (!url) return <>{children}</>;
	return (
		<a
			className={`underline decoration-muted underline-offset-4 hover:text-accent-text ${className ?? ""}`}
			href={url}
			target="_blank"
			rel="noreferrer"
		>
			{children}
		</a>
	);
}
