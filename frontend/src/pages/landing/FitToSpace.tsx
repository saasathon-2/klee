import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fills the remaining height of a flex column and shows its child at natural
 * size, scaled down and centred only when it would not fit. Used by the pinned
 * landing stories, whose stage is one viewport tall, so the mock window is
 * never cut off at the bottom.
 */
export function FitToSpace({ children }: { children: ReactNode }) {
	const outer = useRef<HTMLDivElement>(null);
	const inner = useRef<HTMLDivElement>(null);
	const [fit, setFit] = useState({ scale: 1, top: 0 });

	useLayoutEffect(() => {
		const box = outer.current;
		const content = inner.current;
		if (!box || !content) return;
		const update = () => {
			const available = box.clientHeight;
			// offsetHeight ignores transforms, so this is the natural height.
			const natural = content.offsetHeight;
			if (!available || !natural) return;
			const scale = Math.min(1, available / natural);
			setFit({ scale, top: Math.max(0, (available - natural * scale) / 2) });
		};
		const observer = new ResizeObserver(update);
		observer.observe(box);
		observer.observe(content);
		update();
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={outer} className="relative min-h-0 w-full flex-1">
			<div
				ref={inner}
				className="absolute inset-x-0 mx-auto flex max-w-5xl origin-top justify-center transition-transform duration-300 ease-out motion-reduce:transition-none"
				style={{ top: fit.top, transform: `scale(${fit.scale})` }}
			>
				{children}
			</div>
		</div>
	);
}
