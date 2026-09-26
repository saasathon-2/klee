import { Link } from "react-router-dom";
import { KleeLogo } from "../../../components/KleeLogo";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { Scallop } from "./Scallop";

export function ArtefactPage({ children, context }: TemplateProps) {
	return (
		<article
			className={
				context.edgeToEdge
					? `flex w-full flex-col overflow-x-visible overflow-y-clip bg-surface text-surface-foreground ${context.fillViewport ? "min-h-dvh" : ""}`
					: `mx-auto flex w-full max-w-4xl flex-col overflow-x-visible overflow-y-clip rounded-2xl border border-border bg-surface text-surface-foreground ${context.fillViewport ? "min-h-dvh" : ""}`
			}
		>
			{children}
			{context.showFooter && (
				<footer className={context.fillViewport ? "mt-auto pt-8" : "mt-8"}>
					<Scallop edge="top" />
					<div className="flex min-h-28 flex-col items-center justify-center gap-2 bg-brand px-6 py-4 text-center text-brand-foreground">
						<p className="text-sm font-medium">
							Made with Klee - Create beautiful, shareable diagrams effortlessly
						</p>
						<Link
							to="/"
							aria-label="Klee home"
							className="flex items-center gap-2 font-semibold hover:underline"
						>
							<KleeLogo className="size-7" />
							<img src="/klee.svg" alt="" className="h-5 w-auto" />
						</Link>
					</div>
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
