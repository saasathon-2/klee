import type { ChartAxis } from "../../model";

export type Scale = {
	/** Maps a data value to 0-1 along the axis. */
	fraction: (value: number) => number;
	/** The inverse: 0-1 along the axis back to a data value. */
	value: (fraction: number) => number;
	ticks: number[];
	domain: [number, number];
};

/** 1, 2, 2.5, 5 x 10^n steps giving roughly `count` ticks. */
function niceStep(span: number, count: number) {
	const raw = span / count;
	const power = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * power >= raw) ?? 10;
	return step * power;
}

export function linearScale(values: number[], count = 5): Scale {
	let low = Math.min(...values);
	let high = Math.max(...values);
	if (low === high) [low, high] = [low - 1, high + 1];
	const step = niceStep(high - low, count);
	const start = Math.floor(low / step) * step;
	const end = Math.ceil(high / step) * step;
	const ticks: number[] = [];
	for (let tick = start; tick <= end + step / 2; tick += step) ticks.push(Number(tick.toPrecision(12)));
	return {
		fraction: (value) => (value - start) / (end - start),
		value: (fraction) => start + fraction * (end - start),
		ticks,
		domain: [start, end],
	};
}

/** Whole decades around the data, ticked at each power of ten. */
export function logScale(values: number[]): Scale {
	const positive = values.filter((value) => value > 0);
	const low = Math.floor(Math.log10(Math.min(...positive)));
	let high = Math.ceil(Math.log10(Math.max(...positive)));
	if (low === high) high += 1;
	// Very wide ranges would crowd the axis; tick every other decade.
	const every = high - low > 8 ? 2 : 1;
	const ticks: number[] = [];
	for (let power = low; power <= high; power += every) ticks.push(10 ** power);
	return {
		fraction: (value) => (Math.log10(value) - low) / (high - low),
		value: (fraction) => 10 ** (low + fraction * (high - low)),
		ticks,
		domain: [10 ** low, 10 ** high],
	};
}

export const scaleFor = (axis: ChartAxis, values: number[]) =>
	axis.scale === "log" ? logScale(values) : linearScale(values);

/**
 * The series' y at `x`, interpolating in scale space between the neighbouring
 * points (so a straight segment on a log chart stays straight). Undefined
 * outside the series' own x range.
 */
export function valueAt(points: { x: number; y: number }[], x: number, xScale: Scale, yScale: Scale) {
	const first = points[0];
	const last = points[points.length - 1];
	if (!first || x < first.x || x > last.x) return;
	const after = points.findIndex((point) => point.x >= x);
	if (points[after].x === x) return points[after].y;
	const before = points[after - 1];
	const next = points[after];
	const t = (xScale.fraction(x) - xScale.fraction(before.x)) / (xScale.fraction(next.x) - xScale.fraction(before.x));
	return yScale.value(yScale.fraction(before.y) + t * (yScale.fraction(next.y) - yScale.fraction(before.y)));
}

const prefixes: [number, string][] = [
	[1e9, "G"],
	[1e6, "M"],
	[1e3, "k"],
	[1, ""],
	[1e-3, "m"],
	[1e-6, "µ"],
	[1e-9, "n"],
	[1e-12, "p"],
];

/** Compact SI formatting for axis ticks and readouts: 4700 -> 4.7k, 0.0033 -> 3.3m. */
export function formatValue(value: number) {
	if (value === 0) return "0";
	const magnitude = Math.abs(value);
	if (magnitude >= 0.01 && magnitude < 1000)
		return Number(value.toPrecision(3)).toLocaleString();
	const [factor, prefix] = prefixes.find(([step]) => magnitude >= step) ?? prefixes[prefixes.length - 1];
	return `${Number((value / factor).toPrecision(3))}${prefix}`;
}

export const axisTitle = (axis: ChartAxis) => (axis.unit ? `${axis.label} (${axis.unit})` : axis.label);
