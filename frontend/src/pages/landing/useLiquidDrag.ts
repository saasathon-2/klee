import { type RefObject, useEffect } from "react";

/** How far the pointer can move before the string goes taut, in pixels. */
const slack = 36;
/** Pull per frame once the string is taut; low, so shapes are towed rather than carried. */
const stiffness = 0.008;
/** Velocity kept per frame; the rest is lost to the liquid's drag. */
const damping = 0.9;
/** Top speed while held, in pixels per frame, so a fast flick still tows slowly. */
const maxSpeed = 5;
/** Frames of glide added to the drop point from the release velocity. */
const glide = 6;

type Body = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	targetX: number;
	targetY: number;
	rotate: number;
	grab?: { id: number; startX: number; startY: number; fromX: number; fromY: number };
};

/**
 * Lets the mouse drag each direct child of `container`, as if towing it on a
 * string through liquid: it waits until the string goes taut, then follows
 * slowly, swings with its speed, and settles where it's let go. Touch keeps
 * scrolling the page.
 */
export function useLiquidDrag(container: RefObject<HTMLElement | null>) {
	useEffect(() => {
		const root = container.current;
		if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const bodies = new Map<HTMLElement, Body>();
		let frame = 0;

		const step = () => {
			frame = 0;
			let moving = false;
			for (const [element, body] of bodies) {
				// Like a string: no pull while it's slack, then a pull that grows as it stretches.
				const dx = body.targetX - body.x;
				const dy = body.targetY - body.y;
				const distance = Math.hypot(dx, dy);
				const reach = body.grab ? slack : 0;
				const pull = distance > reach ? ((distance - reach) / distance) * stiffness : 0;
				body.vx = (body.vx + dx * pull) * damping;
				body.vy = (body.vy + dy * pull) * damping;
				const held = Math.hypot(body.vx, body.vy);
				if (body.grab && held > maxSpeed) {
					body.vx *= maxSpeed / held;
					body.vy *= maxSpeed / held;
				}
				body.x += body.vx;
				body.y += body.vy;
				const speed = Math.min(Math.hypot(body.vx, body.vy), 40);
				element.style.translate = `${body.x}px ${body.y}px`;
				// Swings towards where it's being towed, like a weight on a string.
				element.style.rotate = `${body.rotate + body.vx * 1.2}deg`;
				element.style.scale = `${1 + speed / 300}`;
				if (body.grab || speed > 0.02 || distance > 0.2) moving = true;
			}
			if (moving) frame = requestAnimationFrame(step);
		};
		const run = () => {
			if (!frame) frame = requestAnimationFrame(step);
		};

		const cleanups = [...root.children].map((child) => {
			const element = child as HTMLElement;
			const body: Body = {
				x: 0,
				y: 0,
				vx: 0,
				vy: 0,
				targetX: 0,
				targetY: 0,
				rotate: Number.parseFloat(element.style.rotate) || 0,
			};
			bodies.set(element, body);
			const down = (event: PointerEvent) => {
				if (event.pointerType !== "mouse" || event.button !== 0) return;
				event.preventDefault();
				element.setPointerCapture(event.pointerId);
				element.dataset.dragging = "";
				body.grab = {
					id: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					fromX: body.targetX,
					fromY: body.targetY,
				};
			};
			const move = (event: PointerEvent) => {
				if (body.grab?.id !== event.pointerId) return;
				body.targetX = body.grab.fromX + event.clientX - body.grab.startX;
				body.targetY = body.grab.fromY + event.clientY - body.grab.startY;
				run();
			};
			const up = (event: PointerEvent) => {
				if (body.grab?.id !== event.pointerId) return;
				body.grab = undefined;
				delete element.dataset.dragging;
				body.targetX += body.vx * glide;
				body.targetY += body.vy * glide;
				run();
			};
			element.addEventListener("pointerdown", down);
			element.addEventListener("pointermove", move);
			element.addEventListener("pointerup", up);
			element.addEventListener("pointercancel", up);
			return () => {
				element.removeEventListener("pointerdown", down);
				element.removeEventListener("pointermove", move);
				element.removeEventListener("pointerup", up);
				element.removeEventListener("pointercancel", up);
			};
		});

		return () => {
			cancelAnimationFrame(frame);
			cleanups.forEach((cleanup) => cleanup());
		};
	}, [container]);
}
