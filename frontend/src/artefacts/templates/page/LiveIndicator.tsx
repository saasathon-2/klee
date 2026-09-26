import { Tooltip } from "@heroui/react";
import type { LiveStatus } from "./liveStatus";

/** A pulsing dot marking a status as live, with when it was last checked. */
export function LiveIndicator({ live, className = "" }: { live?: LiveStatus; className?: string }) {
	if (!live) return null;
	const time = new Date(live.checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	return (
		<Tooltip delay={0}>
			<Tooltip.Trigger
				aria-label={`Live from GitHub, checked at ${time}`}
				className={`relative inline-flex size-2 shrink-0 ${className}`}
				tabIndex={0}
			>
				{live.status === "pending" && (
					<span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
				)}
				<span className="relative size-2 rounded-full bg-success" />
			</Tooltip.Trigger>
			<Tooltip.Content>Live from GitHub · checked {time}</Tooltip.Content>
		</Tooltip>
	);
}
