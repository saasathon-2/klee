import { useEffect, useId, useRef } from "react";
import { kleeLogoArt } from "./kleeLogoArt";

const { size, background, ink, linework, eyes } = kleeLogoArt;

/**
 * The Klee logo, drawn inline so its pupils can follow the pointer around the
 * page. Each pupil is clipped to its eye opening and slides toward the cursor,
 * further the further away the cursor is. Still for reduced motion.
 */
export function KleeLogo({ className }: { className?: string }) {
	const svg = useRef<SVGSVGElement>(null);
	const pupils = useRef<(SVGEllipseElement | null)[]>([]);
	// useId can contain characters that break url(#...) references.
	const id = `klee-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let frame = 0;
		let pointer: { x: number; y: number } | undefined;
		function aim() {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const box = svg.current?.getBoundingClientRect();
				if (!pointer || !box?.width) return;
				const scale = box.width / size;
				eyes.forEach(({ pupil, reach }, index) => {
					const dx = pointer!.x - (box.left + pupil.cx * scale);
					const dy = pointer!.y - (box.top + pupil.cy * scale);
					const distance = Math.hypot(dx, dy) || 1;
					// Full reach once the cursor is a logo-width or so away.
					const pull = Math.min(1, distance / (box.width * 1.2));
					const x = (dx / distance) * reach.x * pull;
					const y = (dy / distance) * reach.y * pull;
					const element = pupils.current[index];
					if (element) element.style.transform = `translate(${x}px, ${y}px)`;
				});
			});
		}
		function follow(event: PointerEvent) {
			pointer = { x: event.clientX, y: event.clientY };
			aim();
		}
		// The logo moves under a still cursor when the page scrolls, so re-aim then too.
		window.addEventListener("pointermove", follow);
		window.addEventListener("scroll", aim, { capture: true, passive: true });
		return () => {
			window.removeEventListener("pointermove", follow);
			window.removeEventListener("scroll", aim, { capture: true });
			cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<svg
			ref={svg}
			viewBox={`0 0 ${size} ${size}`}
			className={className}
			role="img"
			aria-label="Klee"
		>
			<defs>
				{eyes.map((eye, index) => (
					<clipPath key={index} id={`${id}-eye-${index}`}>
						{eye.opening.map((d) => (
							<path key={d} d={d} />
						))}
					</clipPath>
				))}
				{/* Hides the original pupils so only the moving ones show. */}
				<mask id={`${id}-lines`} maskUnits="userSpaceOnUse" x="0" y="0" width={size} height={size}>
					<rect width={size} height={size} fill="#fff" />
					{eyes.flatMap((eye) => eye.opening.map((d) => <path key={d} d={d} fill="#000" />))}
				</mask>
			</defs>
			<rect width={size} height={size} rx="230" fill={background} />
			{eyes.map((eye, index) => (
				<g key={index}>
					{/* Eye openings show the background, as in the original; the stroke hides seams. */}
					{eye.opening.map((d) => (
						<path key={d} d={d} fill={background} stroke={background} strokeWidth="6" />
					))}
					<g clipPath={`url(#${id}-eye-${index})`}>
						<ellipse
							ref={(element) => {
								pupils.current[index] = element;
							}}
							{...eye.pupil}
							fill={ink}
							style={{ transition: "transform 120ms ease-out" }}
						/>
					</g>
				</g>
			))}
			<path d={linework} fill={ink} mask={`url(#${id}-lines)`} />
		</svg>
	);
}

export function KleeIcon({ className }: { className?: string }) {
	return <img src="/kleelogo.svg" alt="" className={className} />;
}
