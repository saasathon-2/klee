import { Globe } from "lucide-react";
import type { ClipboardEvent } from "react";
import { GitHubIcon, JiraIcon, SlackIcon } from "../components/BrandIcons";

const singleUrl = /^https?:\/\/\S+$/;

/** A short, recognisable name for a pasted link, like "acme/api #42". */
export function describeLink(href: string) {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return { label: href, Icon: Globe };
	}
	const parts = url.pathname.split("/").filter(Boolean);
	if (url.hostname === "github.com" && parts.length >= 2) {
		const repo = `${parts[0]}/${parts[1]}`;
		const [kind, id] = parts.slice(2);
		const label =
			(kind === "pull" || kind === "issues") && id
				? `${repo} #${id}`
				: kind === "commit" && id
					? `${repo}@${id.slice(0, 7)}`
					: (kind === "tree" || kind === "blob") && parts.length > 3
						? `${repo} · ${parts.slice(3).join("/")}`
						: repo;
		return { label, Icon: GitHubIcon };
	}
	if (url.hostname.endsWith(".atlassian.net")) {
		const key = url.pathname.match(/[A-Z][A-Z0-9]+-\d+/)?.[0] ?? url.searchParams.get("selectedIssue");
		return { label: key ?? `Jira · ${url.hostname.split(".")[0]}`, Icon: JiraIcon };
	}
	if (url.hostname.endsWith("slack.com"))
		return { label: `Slack · ${url.hostname.split(".")[0]}`, Icon: SlackIcon };
	const path = url.pathname === "/" ? "" : url.pathname;
	return { label: `${url.hostname.replace(/^www\./, "")}${path}`, Icon: Globe };
}

/**
 * Turns a pasted link into a chip instead of text. Returns true when the paste
 * was a lone URL and has been taken over.
 */
export function takeLinkPaste(event: ClipboardEvent, onLink: (url: string) => void) {
	const text = event.clipboardData.getData("text").trim();
	if (!singleUrl.test(text)) return false;
	event.preventDefault();
	onLink(text);
	return true;
}
