import { useCallback, useEffect, useId, useRef } from "react";
import { kleeLogoArt } from "./kleeLogoArt";

const { size, background, ink, linework, eyes } = kleeLogoArt;

/**
 * The Klee logo, drawn inline so its pupils can follow the pointer around the
 * page. Each pupil is clipped to its eye opening and slides toward the cursor,
 * further the further away the cursor is. Still for reduced motion.
 */
type Point = { x: number; y: number };

export function KleeLogo({
	className,
	lookAt,
}: {
	className?: string;
	/** A temporary viewport position that takes priority over pointer tracking. */
	lookAt?: Point;
}) {
	const svg = useRef<SVGSVGElement>(null);
	const pupils = useRef<(SVGEllipseElement | null)[]>([]);
	const animation = useRef(0);
	const lookAtRef = useRef<Point | undefined>(undefined);
	const pointer = useRef<Point | undefined>(undefined);
	const deferredPointer = useRef(false);
	const wasLookingAt = useRef(false);
	// useId can contain characters that break url(#...) references.
	const id = `klee-logo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

	const aimAt = useCallback((targetX: number, targetY: number) => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		cancelAnimationFrame(animation.current);
		animation.current = requestAnimationFrame(() => {
			const box = svg.current?.getBoundingClientRect();
			if (!box?.width) return;
			const scale = box.width / size;
			eyes.forEach(({ pupil, reach }, index) => {
				const dx = targetX - (box.left + pupil.cx * scale);
				const dy = targetY - (box.top + pupil.cy * scale);
				const distance = Math.hypot(dx, dy) || 1;
				// Full reach once the cursor is a logo-width or so away.
				const pull = Math.min(1, distance / (box.width * 1.2));
				const offsetX = (dx / distance) * reach.x * pull;
				const offsetY = (dy / distance) * reach.y * pull;
				const element = pupils.current[index];
				if (element) element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
			});
		});
	}, []);

	useEffect(() => {
		const wasFollowingText = wasLookingAt.current;
		lookAtRef.current = lookAt;
		wasLookingAt.current = Boolean(lookAt);
		if (lookAt) {
			if (!wasFollowingText) deferredPointer.current = false;
			aimAt(lookAt.x, lookAt.y);
		} else if (wasFollowingText && deferredPointer.current && pointer.current) {
			deferredPointer.current = false;
			aimAt(pointer.current.x, pointer.current.y);
		}
	}, [aimAt, lookAt]);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		function follow(event: PointerEvent) {
			pointer.current = { x: event.clientX, y: event.clientY };
			if (lookAtRef.current) {
				deferredPointer.current = true;
				return;
			}
			aimAt(event.clientX, event.clientY);
		}
		window.addEventListener("pointermove", follow);
		return () => {
			window.removeEventListener("pointermove", follow);
			cancelAnimationFrame(animation.current);
		};
	}, [aimAt]);

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
