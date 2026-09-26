import type { Pin } from "../../model";

export type Side = Pin["side"];

/**
 * A side's pins in drawing order. Numbers run counterclockwise from pin 1 and
 * may wrap past the last pin (PLCC pin 1 sits mid-way along the top), so the
 * run starts after the gap in the numbering.
 */
export function sidePins(pins: Pin[], side: Side) {
	const onSide = pins.filter((pin) => pin.side === side).sort((a, b) => a.number - b.number);
	const gap = onSide.findIndex((pin, index) => index > 0 && pin.number - onSide[index - 1].number > 1);
	const counterclockwise = gap > 0 ? [...onSide.slice(gap), ...onSide.slice(0, gap)] : onSide;
	// Counterclockwise runs down the left, along the bottom, up the right and
	// back along the top; draw every side top-to-bottom or left-to-right.
	return side === "right" || side === "top" ? counterclockwise.reverse() : counterclockwise;
}
