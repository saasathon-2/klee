import { Paragraph } from "@heroui/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PlotFunction, PlotPoint } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { MathText } from "../page/MathText";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { formatValue, linearScale } from "./chart";
import { compile } from "./expression";

/** Whole-class strings so Tailwind generates them; functions keep their slot. */
const strokes = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4"];
const keys = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"];
const fills = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4"];

const height = 340;
const margin = { top: 12, right: 16, bottom: 32, left: 48 };

/** Middle 96% of the finite values, so an asymptote doesn't flatten the plot. */
function robustRange(values: number[]): [number, number] {
	const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
	if (!sorted.length) return [-1, 1];
	const low = sorted[Math.floor(sorted.length * 0.02)];
	const high = sorted[Math.ceil(sorted.length * 0.98) - 1];
	const pad = (high - low || Math.abs(high) || 1) * 0.1;
	return [low - pad, high + pad];
}

export function FunctionPlot({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		xMin: number;
		xMax: number;
		yMin: number | null;
		yMax: number | null;
		functions: PlotFunction[];
		points: PlotPoint[];
	};
	const frame = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(640);
	const [cursor, setCursor] = useState<number>();

	useLayoutEffect(() => {
		const element = frame.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const plotWidth = Math.max(width - margin.left - margin.right, 40);
	const plotHeight = height - margin.top - margin.bottom;
	const samples = Math.min(800, Math.max(200, Math.round(plotWidth)));

	const compiled = useMemo(
		() =>
			data.functions.map((fn) => {
				try {
					return { fn: compile(fn.expression) };
				} catch (error) {
					return { error: (error as Error).message };
				}
			}),
		[data.functions],
	);
	const sampled = useMemo(
		() =>
			compiled.map((entry) =>
				entry.fn
					? Array.from({ length: samples + 1 }, (_, i) => {
							const x = data.xMin + ((data.xMax - data.xMin) * i) / samples;
							return { x, y: entry.fn!(x) };
						})
					: [],
			),
		[compiled, samples, data.xMin, data.xMax],
	);

	const [autoLow, autoHigh] = robustRange([
		...sampled.flat().map((point) => point.y),
		...data.points.map((point) => point.y),
	]);
	const xScale = linearScale([data.xMin, data.xMax], 8);
	const yScale = linearScale([data.yMin ?? autoLow, data.yMax ?? autoHigh], 6);
	const px = (x: number) => margin.left + xScale.fraction(x) * plotWidth;
	const py = (y: number) => margin.top + (1 - yScale.fraction(y)) * plotHeight;

	// Breaks the line at gaps and asymptotes rather than joining across them.
	const paths = sampled.map((points) => {
		let d = "";
		let previous: number | undefined;
		for (const point of points) {
			const y = py(point.y);
			const valid = Number.isFinite(y) && Math.abs(y) < height * 20;
			const jump = previous !== undefined && Math.abs(y - previous) > plotHeight * 1.5;
			d += valid ? `${d && previous !== undefined && !jump ? "L" : "M"}${px(point.x).toFixed(1)} ${y.toFixed(1)} ` : "";
			previous = valid ? y : undefined;
		}
		return d;
	});

	const cursorX = cursor === undefined ? undefined : xScale.value(cursor);
	const readings =
		cursorX === undefined
			? []
			: compiled.map((entry, index) => ({ index, y: entry.fn?.(cursorX) })).filter((r) => r.y !== undefined && Number.isFinite(r.y));
	const origin = { x: px(0), y: py(0) };
	const clipId = `plot-${node.id}`;

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1" aria-label="Functions">
				{data.functions.map((fn, index) => (
					<li key={index} className="flex items-center gap-2">
						<span aria-hidden className={`h-0.5 w-4 rounded-full ${keys[index]}`} />
						<MathText latex={fn.label} />
						{compiled[index].error && (
							<span className="text-xs text-danger">Couldn't plot: {compiled[index].error}</span>
						)}
					</li>
				))}
			</ul>
			<div
				ref={frame}
				className="relative select-none"
				onPointerMove={(event) => {
					const box = frame.current?.getBoundingClientRect();
					if (!box) return;
					const fraction = (event.clientX - box.left - margin.left) / plotWidth;
					setCursor(fraction < 0 || fraction > 1 ? undefined : fraction);
				}}
				onPointerLeave={() => setCursor(undefined)}
			>
				<svg
					width={width}
					height={height}
					role="img"
					aria-label={`${data.title}: ${data.functions.map((fn) => fn.expression).join(", ")} for x from ${data.xMin} to ${data.xMax}`}
					className="block"
				>
					<defs>
						<clipPath id={clipId}>
							<rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
						</clipPath>
					</defs>
					{xScale.ticks.map((tick) => (
						<g key={`x${tick}`}>
							<line x1={px(tick)} x2={px(tick)} y1={margin.top} y2={margin.top + plotHeight} className="stroke-separator" />
							<text x={px(tick)} y={height - 10} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					{yScale.ticks.map((tick) => (
						<g key={`y${tick}`}>
							<line x1={margin.left} x2={margin.left + plotWidth} y1={py(tick)} y2={py(tick)} className="stroke-separator" />
							<text x={margin.left - 8} y={py(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					{/* Axes through the origin, when it's in view. */}
					<g className="stroke-muted" strokeWidth={1}>
						{origin.y >= margin.top && origin.y <= margin.top + plotHeight && (
							<line x1={margin.left} x2={margin.left + plotWidth} y1={origin.y} y2={origin.y} />
						)}
						{origin.x >= margin.left && origin.x <= margin.left + plotWidth && (
							<line x1={origin.x} x2={origin.x} y1={margin.top} y2={margin.top + plotHeight} />
						)}
					</g>
					<g clipPath={`url(#${clipId})`}>
						{paths.map((d, index) => (
							<path key={index} d={d} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className={strokes[index]} />
						))}
						{cursorX !== undefined && (
							<line x1={px(cursorX)} x2={px(cursorX)} y1={margin.top} y2={margin.top + plotHeight} className="stroke-border" />
						)}
						{readings.map(({ index, y }) => (
							<circle key={index} cx={px(cursorX!)} cy={py(y!)} r={4} strokeWidth={2} className={`stroke-surface ${fills[index]}`} />
						))}
					</g>
					{data.points.map((point, index) => {
						const x = px(point.x);
						const y = py(point.y);
						if (y < margin.top || y > margin.top + plotHeight) return null;
						const right = x < margin.left + plotWidth - 120;
						return (
							<g key={index}>
								<circle cx={x} cy={y} r={5} strokeWidth={2} className="fill-foreground stroke-surface" />
								<text x={right ? x + 9 : x - 9} y={y - 9} textAnchor={right ? "start" : "end"} className="fill-foreground text-[12px] font-medium">
									{point.label}
								</text>
							</g>
						);
					})}
				</svg>
				{cursorX !== undefined && readings.length > 0 && (
					<div
						className="pointer-events-none absolute top-2 z-10 rounded-lg border border-border bg-overlay px-3 py-2 text-overlay-foreground shadow-sm"
						style={px(cursorX) > width / 2 ? { right: width - px(cursorX) + 12 } : { left: px(cursorX) + 12 }}
					>
						<Paragraph size="xs" color="muted" className="tabular-nums">
							x = {formatValue(cursorX)}
						</Paragraph>
						{readings.map(({ index, y }) => (
							<div key={index} className="mt-1 flex items-center gap-2 text-xs">
								<span aria-hidden className={`h-0.5 w-3 rounded-full ${keys[index]}`} />
								<span className="font-semibold tabular-nums">{formatValue(y!)}</span>
							</div>
						))}
					</div>
				)}
			</div>
			{data.points.length > 0 && (
				<ul className="sr-only" aria-label="Marked points">
					{data.points.map((point, index) => (
						<li key={index}>
							{point.label}: ({point.x}, {point.y})
						</li>
					))}
				</ul>
			)}
		</BlockSection>
	);
}

FunctionPlot.template = "function-plot" as const;
FunctionPlot.info =
	"Plots one to four functions of x from their expressions over a chosen domain, with labelled key points such as roots, extrema, or intersections. Pick it to show the shape of a function, compare functions, or illustrate a maths solution.";
FunctionPlot.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
