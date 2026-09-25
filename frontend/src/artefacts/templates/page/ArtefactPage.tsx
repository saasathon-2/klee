import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { Scallop } from "./Scallop";

export function ArtefactPage({ children, context }: TemplateProps) {
	return (
		<article
			className={
				context.edgeToEdge
					? "w-full overflow-x-visible overflow-y-clip bg-surface text-surface-foreground"
					: "mx-auto w-full max-w-4xl overflow-x-visible overflow-y-clip rounded-2xl border border-divider bg-surface text-surface-foreground"
			}
		>
			{children}
			{context.showFooter && (
				<footer aria-hidden className="mt-8">
					<Scallop edge="top" />
					<div className="h-16 bg-brand" />
				</footer>
			)}
		</article>
	);
}

ArtefactPage.template = "artefact-page" as const;
ArtefactPage.info =
	"Root document shell for every artefact. Select exactly one category page as its child; never place content blocks directly inside it.";
ArtefactPage.children = {
	min: 1,
	max: 1,
	allowed: ["developer-page", "generic-page"],
} satisfies TemplateSelectionInfo["children"];
