import { useEffect, useRef, useState } from "react";
import type { ArtefactNode, ReadinessGate } from "../../artefacts/model";
import { DeliveryReadiness } from "../../artefacts/templates/blocks/DeliveryReadiness";
import type { RenderContext } from "../../artefacts/templates/types";

/** Landing-only scroll treatment: each required merge gate completes in turn. */
export function LandingDeliveryReadinessStory({ node, context }: { node: ArtefactNode; context: RenderContext }) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const gates = (node.data as { gates: ReadinessGate[] }).gates;
	const [passed, setPassed] = useState(0);

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
				setPassed(Math.min(gates.length, Math.floor(progress * (gates.length + 1))));
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
	}, [gates.length]);

	const complete = passed === gates.length;
	const animatedNode = {
		...node,
		data: {
			...node.data,
			animateChanges: true,
			summary: complete
				? "All required gates have passed. This pull request is ready to merge."
				: "Klee is checking the required gates before this pull request can merge.",
			gates: gates.map((gate, index) => index < passed ? gate : { ...gate, status: "pending", detail: "In progress" }),
		},
	};

	return (
		<div ref={sectionRef} style={{ height: `calc(${55 * (gates.length + 1)}vh + 20rem)` }}>
			<div ref={stageRef} className="sticky top-20">
				<DeliveryReadiness node={animatedNode} context={context}>{null}</DeliveryReadiness>
			</div>
		</div>
	);
}
