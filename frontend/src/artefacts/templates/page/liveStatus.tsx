import { Tooltip } from "@heroui/react";
import { useEffect, useState } from "react";
import type { ArtefactDocument, Check } from "../../model";
import type { RenderContext } from "../types";

/** A check's current state, fetched from the connected source it links to. */
export type LiveStatus = {
	status: Check["status"];
	detail: string;
	checkedAt: string;
};

const pollMs = 30_000;
const checkRunLink = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(?:runs\/\d+|actions\/runs\/\d+\/job\/\d+)/;

/**
 * Polls the API for the live status of GitHub check runs the artefact links
 * to. Signed-in viewers use their own access; others fall back to the public
 * share. Artefacts without check run links never make a request.
 */
export function useLiveStatus(
	artefactId: string | undefined,
	document: ArtefactDocument | undefined,
	isSignedIn: boolean,
) {
	const [statuses, setStatuses] = useState<Record<string, LiveStatus>>({});
	const hasLinks = Boolean(document && checkRunLink.test(JSON.stringify(document)));
	useEffect(() => {
		if (!artefactId || !hasLinks) return;
		let active = true;
		const load = async () => {
			if (window.document.hidden) return;
			const paths = [
				...(isSignedIn ? [`/api/artefacts/${artefactId}/live-status`] : []),
				`/api/shared/artefacts/${artefactId}/live-status`,
			];
			for (const path of paths) {
				const response = await fetch(path, { credentials: "include" }).catch(() => undefined);
				if (!response?.ok) continue;
				const next = (await response.json()) as Record<string, LiveStatus>;
				if (active) setStatuses(next);
				return;
			}
		};
		void load();
		const timer = window.setInterval(() => void load(), pollMs);
		return () => {
			active = false;
			window.clearInterval(timer);
		};
	}, [artefactId, hasLinks, isSignedIn]);
	return statuses;
}

/** The item with its saved status replaced by the live one, when there is one. */
export function withLiveStatus<T extends { status: Check["status"]; detail: string; url?: string | null }>(
	item: T,
	context: RenderContext,
): T & { live?: LiveStatus } {
	const live = !context.isEditing && item.url ? context.liveStatus?.[item.url] : undefined;
	return live ? { ...item, status: live.status, detail: live.detail, live } : item;
}

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
