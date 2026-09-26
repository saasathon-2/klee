import { Paragraph, Table } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ChartAxis, ChartSeries } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { axisTitle, formatValue, scaleFor, valueAt } from "./chart";

/** Whole-class strings so Tailwind generates them; series keep their slot. */
const strokes = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5", "stroke-chart-6"];
const fills = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5", "fill-chart-6"];
const keys = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5", "bg-chart-6"];

const height = 300;
const margin = { top: 12, right: 16, bottom: 44, left: 60 };
const endLabelRoom = 104;

function LineKey({ index }: { index: number }) {
	return <span aria-hidden className={`inline-block h-0.5 w-3 shrink-0 rounded-full ${keys[index]}`} />;
}

export function CurveChart({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		xAxis: ChartAxis;
		yAxis: ChartAxis;
		series: ChartSeries[];
		approximate: boolean;
		source: string | null;
	};
	const frame = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(640);
	/** Crosshair position as 0-1 across the plot, or undefined when idle. */
	const [cursor, setCursor] = useState<number>();

	useLayoutEffect(() => {
		const element = frame.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const points = data.series.flatMap((line) => line.points);
	const xScale = scaleFor(data.xAxis, points.map((point) => point.x));
	const yScale = scaleFor(data.yAxis, points.map((point) => point.y));

	// Direct end labels for up to four series, unless their ends crowd together.
	const endLabels = data.series.length <= 4 && width >= 480;
	const plotRight = width - margin.right - (endLabels ? endLabelRoom : 0);
	const plotWidth = Math.max(plotRight - margin.left, 40);
	const plotHeight = height - margin.top - margin.bottom;
	const px = (x: number) => margin.left + xScale.fraction(x) * plotWidth;
	const py = (y: number) => margin.top + (1 - yScale.fraction(y)) * plotHeight;
	const ends = data.series.map((line) => py(line.points[line.points.length - 1].y));
	const endsClear = ends.every((y, index) => ends.every((other, j) => j === index || Math.abs(other - y) >= 16));

	const cursorX = cursor === undefined ? undefined : xScale.value(cursor);
	const readings =
		cursorX === undefined
			? []
			: data.series
					.map((line, index) => ({ index, name: line.name, y: valueAt(line.points, cursorX, xScale, yScale) }))
					.filter((reading): reading is { index: number; name: string; y: number } => reading.y !== undefined);

	const moveTo = (clientX: number) => {
		const box = frame.current?.getBoundingClientRect();
		if (!box) return;
		const fraction = (clientX - box.left - margin.left) / plotWidth;
		setCursor(fraction < 0 || fraction > 1 ? undefined : fraction);
	};

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			{data.series.length > 1 && (
				<ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Series">
					{data.series.map((line, index) => (
						<li key={line.name} className="flex items-center gap-2">
							<LineKey index={index} />
							{line.name}
						</li>
					))}
				</ul>
			)}
			<div
				ref={frame}
				className="relative touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-focus"
				tabIndex={0}
				role="group"
				aria-label={`${data.title}. ${axisTitle(data.yAxis)} against ${axisTitle(data.xAxis)}. Use left and right arrow keys to read values.`}
				onPointerMove={(event) => moveTo(event.clientX)}
				onPointerLeave={() => setCursor(undefined)}
				onFocus={() => setCursor((current) => current ?? 0.5)}
				onBlur={() => setCursor(undefined)}
				onKeyDown={(event) => {
					if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
					event.preventDefault();
					const step = event.key === "ArrowLeft" ? -0.02 : 0.02;
					setCursor((current) => Math.min(1, Math.max(0, (current ?? 0.5) + step)));
				}}
			>
				<svg aria-hidden width={width} height={height} className="block overflow-visible">
					{yScale.ticks.map((tick) => (
						<g key={`y${tick}`}>
							<line x1={margin.left} x2={margin.left + plotWidth} y1={py(tick)} y2={py(tick)} className="stroke-separator" />
							<text x={margin.left - 8} y={py(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-xs tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					{xScale.ticks.map((tick) => (
						<g key={`x${tick}`}>
							<line x1={px(tick)} x2={px(tick)} y1={margin.top} y2={margin.top + plotHeight} className="stroke-separator" />
							<text x={px(tick)} y={margin.top + plotHeight + 16} textAnchor="middle" className="fill-muted text-xs tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					<line x1={margin.left} x2={margin.left + plotWidth} y1={margin.top + plotHeight} y2={margin.top + plotHeight} className="stroke-border" />
					<text x={margin.left + plotWidth / 2} y={height - 6} textAnchor="middle" className="fill-muted text-xs">
						{axisTitle(data.xAxis)}
					</text>
					<text
						x={14}
						y={margin.top + plotHeight / 2}
						textAnchor="middle"
						transform={`rotate(-90 14 ${margin.top + plotHeight / 2})`}
						className="fill-muted text-xs"
					>
						{axisTitle(data.yAxis)}
					</text>

					{data.series.map((line, index) => {
						const last = line.points[line.points.length - 1];
						return (
							<g key={line.name}>
								<path
									d={line.points.map((point, i) => `${i ? "L" : "M"}${px(point.x)},${py(point.y)}`).join(" ")}
									fill="none"
									strokeWidth={2}
									strokeLinejoin="round"
									strokeLinecap="round"
									className={strokes[index]}
								/>
								<circle cx={px(last.x)} cy={py(last.y)} r={4} strokeWidth={2} className={`${fills[index]} stroke-surface`} />
								{endLabels && endsClear && (
									<text x={px(last.x) + 10} y={py(last.y)} dominantBaseline="middle" className="fill-foreground text-xs">
										{line.name.length > 16 ? `${line.name.slice(0, 15)}…` : line.name}
									</text>
								)}
							</g>
						);
					})}

					{cursorX !== undefined && (
						<g>
							<line x1={px(cursorX)} x2={px(cursorX)} y1={margin.top} y2={margin.top + plotHeight} className="stroke-muted" />
							{readings.map((reading) => (
								<circle
									key={reading.index}
									cx={px(cursorX)}
									cy={py(reading.y)}
									r={4}
									strokeWidth={2}
									className={`${fills[reading.index]} stroke-surface`}
								/>
							))}
						</g>
					)}
				</svg>

				{cursorX !== undefined && (
					<div
						role="status"
						className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-md border border-border bg-overlay px-3 py-2 text-sm text-overlay-foreground shadow-overlay"
						style={
							cursor !== undefined && cursor > 0.55
								? { right: width - px(cursorX) + 12 }
								: { left: px(cursorX) + 12 }
						}
					>
						<p className="mb-1 text-xs text-muted">
							{data.xAxis.label} {formatValue(cursorX)}
							{data.xAxis.unit ? ` ${data.xAxis.unit}` : ""}
						</p>
						{readings.length === 0 ? (
							<p className="text-xs text-muted">No data here</p>
						) : (
							readings.map((reading) => (
								<p key={reading.index} className="flex items-center gap-2">
									<LineKey index={reading.index} />
									<span className="font-semibold tabular-nums">
										{formatValue(reading.y)}
										{data.yAxis.unit ? ` ${data.yAxis.unit}` : ""}
									</span>
									{data.series.length > 1 && <span className="text-xs text-muted">{reading.name}</span>}
								</p>
							))
						)}
					</div>
				)}
			</div>

			{(data.approximate || data.source) && (
				<Paragraph size="xs" color="muted" className="mt-2">
					{data.approximate ? "Approximate values read from " : "Source: "}
					{data.source ?? "the source figure"}.
				</Paragraph>
			)}

			<details className="mt-4 text-sm">
				<summary className="cursor-pointer font-medium">Show data</summary>
				<div className="mt-3 space-y-4">
					{data.series.map((line, index) => (
						<Table key={line.name}>
							<Table.ScrollContainer>
								<Table.Content aria-label={line.name}>
									<Table.Header>
										<Table.Column isRowHeader>
											<span className="flex items-center gap-2">
												<LineKey index={index} />
												{axisTitle(data.xAxis)}
											</span>
										</Table.Column>
										<Table.Column>{data.series.length > 1 ? `${line.name}: ` : ""}{axisTitle(data.yAxis)}</Table.Column>
									</Table.Header>
									<Table.Body>
										{line.points.map((point, row) => (
											<Table.Row key={row} id={row}>
												<Table.Cell className="tabular-nums">{formatValue(point.x)}</Table.Cell>
												<Table.Cell className="tabular-nums">{formatValue(point.y)}</Table.Cell>
											</Table.Row>
										))}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
					))}
				</div>
			</details>
		</BlockSection>
	);
}

CurveChart.template = "curve-chart" as const;
CurveChart.info =
	"Line chart of one measured relationship with linear or log axes, a crosshair readout, and a data table. Pick it for performance curves from datasheets or measurements; one y-axis per chart.";
CurveChart.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
