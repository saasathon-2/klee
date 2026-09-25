import { Card, Paragraph, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { ArtefactDocument, ArtefactNode } from "../../artefacts/model";
import { ArtefactRenderer } from "../../artefacts/templates/renderer";
import { landingSamples } from "./samples";

const blocksOf = (document: ArtefactDocument) =>
	document.root.children?.[0]?.children ?? [];
const [metrics, flow, tasks] = blocksOf(landingSamples.create);
const [codeDiff] = blocksOf(landingSamples.review);
const [reviews] = blocksOf(landingSamples.share);
const [checks, readiness] = blocksOf(landingSamples.integrate);
const transition = (id: string, label: string): ArtefactNode => ({
	id,
	template: "glue",
	data: { label },
});

const prompt =
	"Review PR #482: the code changes, reviewer feedback, CI results, and what to do next.";

/** One long pull request review, assembled from the landing samples. */
const demo: ArtefactDocument = {
	version: 1,
	root: {
		...landingSamples.create.root,
		children: [
			{
				...landingSamples.create.root.children![0],
				children: [
					metrics,
					codeDiff,
					transition("to-reviews", "Here is what reviewers said"),
					reviews,
					checks,
					readiness,
					transition("to-next", "So what happens next?"),
					flow,
					tasks,
				],
			},
		],
	},
};

const typingDelay = 50;

/**
 * Types the prompt once, then reveals each artefact block the first time it
 * scrolls into view.
 */
export function HeroArtefact() {
	const [typed, setTyped] = useState(0);
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typed >= prompt.length) return;
		const timer = window.setTimeout(() => setTyped(typed + 1), typingDelay);
		return () => window.clearTimeout(timer);
	}, [typed]);

	useEffect(() => {
		const blocks = container.current?.querySelectorAll<HTMLElement>(
			'[data-slot="artefact-blocks"] > *',
		);
		if (!blocks?.length) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					(entry.target as HTMLElement).dataset.revealed = "true";
					observer.unobserve(entry.target);
				}
			},
			{ rootMargin: "0px 0px -15% 0px", threshold: 0.15 },
		);
		blocks.forEach((block) => observer.observe(block));
		return () => observer.disconnect();
	}, []);

	return (
		<Card className="w-full gap-0 overflow-hidden p-0">
			<Surface className="flex items-center gap-3 border-b border-divider px-5 py-4">
				<Paragraph size="sm" truncate className="min-w-0 flex-1">
					{prompt.slice(0, typed)}
					{typed < prompt.length && (
						<span className="animate-pulse text-muted">|</span>
					)}
				</Paragraph>
			</Surface>
			<div ref={container} className="hero-demo pb-8">
				<ArtefactRenderer
					document={demo}
					createdAt="2026-09-26T00:00:00.000Z"
					canInteract
					edgeToEdge
					showFooter={false}
				/>
			</div>
		</Card>
	);
}
