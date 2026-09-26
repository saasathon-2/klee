import type { Artefact } from "./types";

export function artefactHeading(artefact: Artefact) {
	if (artefact.title !== "New artefact") return artefact.title;
	return /\b(pr|pull request|github|change|architecture)\b/i.test(
		artefact.prompt,
	)
		? "Change brief"
		: "Working brief";
}

export function artefactDescription(artefact: Artefact) {
	if (artefact.description) return artefact.description;
	const summary = artefact.content?.root.children?.[0]?.data.summary;
	return typeof summary === "string" && summary ? summary : artefact.prompt;
}

export function artefactIcon(artefact: Artefact) {
	if (artefact.icon) return artefact.icon;
	const icon = artefact.content?.root.children?.[0]?.data.icon;
	return typeof icon === "string" ? icon : undefined;
}
