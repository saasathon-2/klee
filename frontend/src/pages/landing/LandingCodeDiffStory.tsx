import { useEffect, useRef, useState, type ReactNode } from "react";
import { DiffLayoutContext } from "../../artefacts/templates/page/diffLayout";

/** Landing-only scroll treatment for the sample code diff. */
export function LandingCodeDiffStory({ children }: { children: ReactNode }) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [step, setStep] = useState(0);

	useEffect(() => {
		let frame = 0;
		const update = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				const section = sectionRef.current;
				const stage = stageRef.current;
				if (!section || !stage) return;
				const start =
					window.scrollY + section.getBoundingClientRect().top - 80;
				const distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
				const progress = Math.max(
					0,
					Math.min(1, (window.scrollY - start) / distance),
				);
				setStep(
					progress < 0.12
						? 0
						: progress < 0.345
							? 1
							: progress < 0.385
								? 2
								: progress < 0.465
									? 3
									: progress < 0.865
										? 4
										: 5,
				);
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
	}, []);

	return (
		<div
			ref={sectionRef}
			className="h-[calc(300vh+6rem)] lg:-mx-72 lg:w-[calc(100%+36rem)]"
		>
			<div
				ref={stageRef}
				className="sticky top-20 grid h-[calc(100vh-6rem)] items-center gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_18rem]"
			>
				<StoryNote
					placement="left"
					visible={step === 1}
					title="Context on every PR"
					body="Add the GitHub Action and each pull request gets a summary."
				/>
				{/* Split while the first note is up; unified once the notes swap. */}
				<DiffLayoutContext value={step >= 2 ? "unified" : "split"}>
					<div className="lg:col-start-2 lg:row-start-1">{children}</div>
				</DiffLayoutContext>
				<StoryNote
					placement="right"
					visible={step === 4}
					title="Share it with a link"
					body="Send the whole page, or just the part someone needs."
				/>
			</div>
		</div>
	);
}

function StoryNote({
	placement,
	visible,
	title,
	body,
}: {
	placement: "left" | "right";
	visible: boolean;
	title: string;
	body: string;
}) {
	return (
		<div
			className={`relative z-10 hidden w-72 self-center lg:row-start-1 lg:block ${placement === "left" ? "lg:col-start-1 lg:-translate-x-[12%] lg:-translate-y-[15%]" : "lg:col-start-3 lg:translate-x-[12%] lg:translate-y-[15%]"}`}
		>
			<aside
				aria-hidden={!visible}
				className={`rounded-2xl border border-border bg-surface-secondary p-5 shadow-2xl transition-all duration-500 ease-out ${visible ? "translate-x-0 translate-y-0 opacity-100" : `pointer-events-none translate-y-3 opacity-0 ${placement === "left" ? "-translate-x-8" : "translate-x-8"}`}`}
			>
				<p className="text-lg font-semibold leading-6">{title}</p>
				<p className="mt-2 text-sm leading-6 text-muted">{body}</p>
			</aside>
		</div>
	);
}
