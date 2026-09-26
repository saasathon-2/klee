import { useEffect, useId, useRef } from "react";

const size = 2215;
const background = "#FBF463";
const ink = "#1E1E1E";
const eyes = [
	{ pupil: { cx: 663.2, cy: 689.8, rx: 186.9, ry: 209.4 }, reach: { x: 157.6, y: 30.6 } },
	{ pupil: { cx: 1500.7, cy: 871.2, rx: 167.6, ry: 187.8 }, reach: { x: 139.7, y: 32.5 } },
];

export function KleeLogo({
	className,
	alt = "Klee",
}: {
	className?: string;
	alt?: string;
}) {
	const svg = useRef<SVGSVGElement>(null);
	const pupils = useRef<(SVGEllipseElement | null)[]>([]);
	const id = `klee-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let frame = 0;
		const follow = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const box = svg.current?.getBoundingClientRect();
				if (!box?.width) return;
				eyes.forEach((eye, index) => {
					const dx = event.clientX - (box.left + (eye.pupil.cx / size) * box.width);
					const dy = event.clientY - (box.top + (eye.pupil.cy / size) * box.height);
					const distance = Math.hypot(dx, dy) || 1;
					const pull = Math.min(1, distance / (box.width * 1.2));
					const pupil = pupils.current[index];
					if (pupil)
						pupil.setAttribute(
							"transform",
							`translate(${(dx / box.width) * eye.reach.x * pull} ${(dy / box.height) * eye.reach.y * pull})`,
						);
				});
			});
		};
		window.addEventListener("pointermove", follow);
		return () => {
			window.removeEventListener("pointermove", follow);
			cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<svg
			ref={svg}
			viewBox={`0 0 ${size} ${size}`}
			className={className}
			role="img"
			aria-label={alt}
		>
			<defs>
				{eyes.map((eye, index) => (
					<clipPath key={index} id={`${id}-eye-${index}`}>
						<ellipse {...eye.pupil} />
					</clipPath>
				))}
			</defs>
			<image href="/kleelogo.svg" width={size} height={size} />
			{eyes.map((eye, index) => (
				<g key={index} clipPath={`url(#${id}-eye-${index})`}>
					<ellipse {...eye.pupil} fill={background} />
					<ellipse
						ref={(element) => {
							pupils.current[index] = element;
						}}
						{...eye.pupil}
						fill={ink}
						style={{ transition: "transform 120ms ease-out" }}
					/>
				</g>
			))}
		</svg>
	);
}
