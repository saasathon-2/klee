import { useEffect, useRef, useState, type ReactNode } from "react";
import { SelectedCommitContext } from "../../artefacts/templates/page/commitSelection";

/**
 * Landing-only scroll treatment for the sample git graph: the graph stays
 * pinned while scrolling steps the selection through each commit in turn.
 */
export function LandingGitGraphStory({ shas, children }: { shas: string[]; children: ReactNode }) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);

	useEffect(() => {
		let frame = 0;
		const update = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				const section = sectionRef.current;
				const stage = stageRef.current;
				if (!section || !stage) return;
				const start = window.scrollY + section.getBoundingClientRect().top - 80;
				const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
				const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
				setIndex(Math.min(shas.length - 1, Math.floor(progress * shas.length)));
			});
		};
		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		update();
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
			cancelAnimationFrame(frame);
		};
	}, [shas.length]);

	return (
		// Roughly half a screen of scrolling per commit.
		<div ref={sectionRef} style={{ height: `calc(${50 * shas.length}vh + 40rem)` }}>
			<div ref={stageRef} className="sticky top-20">
				<SelectedCommitContext value={shas[index]}>{children}</SelectedCommitContext>
			</div>
		</div>
	);
}
