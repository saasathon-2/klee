import { Paragraph, Table, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useCallback, useState } from "react";
import type { TrendSeries } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { formatDate, parseDate } from "../page/dates";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

type View = "chart" | "table";

const height = 220;
const margin = { top: 16, right: 16, bottom: 28, left: 44 };
/** Categorical series colours in fixed order; the schema caps series at four. */
const seriesColour = (index: number) => `var(--chart-${Math.min(index, 3) + 1})`;
const formatValue = (value: number) =>
	value.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** Clean axis maximum and four evenly spaced ticks from zero. */
function niceTicks(max: number) {
	if (max <= 0) return [0, 1];
	const rough = max / 4;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
	return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

/** Tracks an element's width; a callback ref so it follows remounts. */
function useWidth() {
	const [width, setWidth] = useState(0);
	const ref = useCallback((element: HTMLDivElement | null) => {
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, width] as const;
}

export function ActivityTrend({ node, context }: TemplateProps) {
	const { title, description, unit, chart, series, annotation } = node.data as {
		title: string;
		description: string;
		unit: string;
		chart: "line" | "bar";
		series: TrendSeries[];
		annotation?: { at: string; label: string } | null;
	};
	const text = editableFor(node, context);
	const [view, setView] = useState<View>("chart");
	const [active, setActive] = useState<number>();
	const [ref, width] = useWidth();
	const tableColumns = [
		{ id: "date", index: -1, label: "Date" },
		...series.map((item, index) => ({ id: `series-${index}`, index, label: `${item.label} (${unit})` })),
	];

	// Every distinct timestamp across series, in time order, is one x position.
	const dates = [...new Set(series.flatMap((item) => item.points.map((point) => point.at)))].sort(
		(a, b) => (parseDate(a)?.getTime() ?? 0) - (parseDate(b)?.getTime() ?? 0),
	);
	const valueAt = (item: TrendSeries, at: string) =>
		item.points.find((point) => point.at === at)?.value;
	const ticks = niceTicks(Math.max(0, ...series.flatMap((item) => item.points.map((p) => p.value))));
	const top = ticks[ticks.length - 1];
	const plotWidth = Math.max(0, width - margin.left - margin.right);
	const plotHeight = height - margin.top - margin.bottom;
	const band = plotWidth / Math.max(1, dates.length);
	const x = (index: number) =>
		margin.left + (chart === "bar" ? band * (index + 0.5) : dates.length > 1 ? (plotWidth * index) / (dates.length - 1) : plotWidth / 2);
	const y = (value: number) => margin.top + plotHeight - (value / top) * plotHeight;
	const barWidth = Math.min(24, (band * 0.7) / series.length);
	const annotationIndex = annotation ? dates.indexOf(annotation.at) : -1;
	// Label the first, last and a few evenly spaced dates so they never collide.
	const labelEvery = Math.max(1, Math.ceil(dates.length / Math.max(2, Math.floor(plotWidth / 72))));

	const pointerIndex = (clientX: number, element: Element) => {
		const offset = clientX - element.getBoundingClientRect().left;
		const index =
			chart === "bar" ? Math.floor((offset - margin.left) / band) : Math.round(((offset - margin.left) / plotWidth) * (dates.length - 1));
		return Math.min(dates.length - 1, Math.max(0, index));
	};
	const toggle = (
		<ToggleButtonGroup
			aria-label="Trend view"
			size="sm"
			selectionMode="single"
			disallowEmptySelection
			selectedKeys={[view]}
			onSelectionChange={(keys) => setView([...keys][0] as View)}
			className="shrink-0"
		>
			<ToggleButton id="chart">Chart</ToggleButton>
			<ToggleButton id="table">Table</ToggleButton>
		</ToggleButtonGroup>
	);

	return (
		<BlockSection title={title} description={description} action={toggle} edit={{ node, context }}>
			{series.length > 1 && (
				<ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Series">
					{series.map((item, index) => (
						<li key={index} className="flex items-center gap-2 text-xs">
							{chart === "bar" ? (
								<span aria-hidden className="size-2.5 rounded-xs" style={{ background: seriesColour(index) }} />
							) : (
								<span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: seriesColour(index) }} />
							)}
							<span>{item.label}</span>
						</li>
					))}
				</ul>
			)}
			{view === "table" ? (
				<Table>
					<Table.ScrollContainer>
						<Table.Content aria-label={`${title} data`}>
							<Table.Header columns={tableColumns}>
								{(column) => (
									<Table.Column id={column.id} isRowHeader={column.index < 0} className={column.index < 0 ? "" : "text-right"}>
										{column.label}
									</Table.Column>
								)}
							</Table.Header>
							<Table.Body>
								{dates.map((at) => (
									<Table.Row key={at} id={at} columns={tableColumns}>
										{(column) => {
											if (column.index < 0) return <Table.Cell>{formatDate(at)}</Table.Cell>;
											const value = valueAt(series[column.index], at);
											return (
												<Table.Cell className="text-right tabular-nums">
													{value === undefined ? "—" : formatValue(value)}
												</Table.Cell>
											);
										}}
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			) : (
				<div ref={ref} className="relative">
					{width > 0 && (
						<svg
							width={width}
							height={height}
							role="img"
							aria-label={`${title}, ${unit}. Use the table view for exact values.`}
							tabIndex={0}
							className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus"
							onPointerMove={(event) => setActive(pointerIndex(event.clientX, event.currentTarget))}
							onPointerLeave={() => setActive(undefined)}
							onBlur={() => setActive(undefined)}
							onKeyDown={(event) => {
								if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
								event.preventDefault();
								const step = event.key === "ArrowLeft" ? -1 : 1;
								setActive((current) =>
									Math.min(dates.length - 1, Math.max(0, (current ?? (step > 0 ? -1 : dates.length)) + step)),
								);
							}}
						>
							{ticks.map((tick) => (
								<g key={tick}>
									<line
										x1={margin.left}
										x2={width - margin.right}
										y1={y(tick)}
										y2={y(tick)}
										stroke={tick === 0 ? "var(--border)" : "var(--separator)"}
									/>
									<text x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
										{formatValue(tick)}
									</text>
								</g>
							))}
							{dates.map((at, index) =>
								index % labelEvery === 0 || index === dates.length - 1 ? (
									<text
										key={at}
										x={x(index)}
										y={height - 8}
										// A line reaches the plot edges, so its end labels sit inside them.
										textAnchor={chart === "line" && index === dates.length - 1 ? "end" : "middle"}
										className="fill-muted text-[11px]"
									>
										{formatDate(at)}
									</text>
								) : null,
							)}
							{annotationIndex >= 0 && (
								<g>
									<line x1={x(annotationIndex)} x2={x(annotationIndex)} y1={margin.top} y2={margin.top + plotHeight} stroke="var(--muted)" />
									<text
										x={x(annotationIndex) + (annotationIndex > dates.length / 2 ? -6 : 6)}
										y={margin.top + 4}
										textAnchor={annotationIndex > dates.length / 2 ? "end" : "start"}
										className="fill-foreground text-[11px] font-medium"
									>
										{annotation!.label}
									</text>
								</g>
							)}
							{active !== undefined && chart === "line" && (
								<line x1={x(active)} x2={x(active)} y1={margin.top} y2={margin.top + plotHeight} stroke="var(--border)" />
							)}
							{series.map((item, seriesIndex) => {
								const colour = seriesColour(seriesIndex);
								const points = dates
									.map((at, index) => ({ index, value: valueAt(item, at) }))
									.filter((point): point is { index: number; value: number } => point.value !== undefined);
								if (chart === "bar")
									return points.map(({ index, value }) => {
										const left = x(index) - (barWidth * series.length) / 2 + barWidth * seriesIndex;
										const barHeight = Math.max(0, y(0) - y(value));
										const radius = Math.min(4, barHeight, barWidth / 2);
										// Rounded data end, square at the baseline, with a 2px gap between bars.
										return (
											<path
												key={`${seriesIndex}-${index}`}
												d={`M${left + 1} ${y(0)} V${y(value) + radius} Q${left + 1} ${y(value)} ${left + 1 + radius} ${y(value)} H${left + barWidth - 1 - radius} Q${left + barWidth - 1} ${y(value)} ${left + barWidth - 1} ${y(value) + radius} V${y(0)} Z`}
												fill={colour}
												opacity={active === undefined || active === index ? 1 : 0.55}
											/>
										);
									});
								const last = points[points.length - 1];
								return (
									<g key={seriesIndex}>
										<path
											d={points.map(({ index, value }, i) => `${i ? "L" : "M"}${x(index)} ${y(value)}`).join(" ")}
											fill="none"
											stroke={colour}
											strokeWidth={2}
											strokeLinejoin="round"
											strokeLinecap="round"
										/>
										{last && (
											<circle cx={x(last.index)} cy={y(last.value)} r={4} fill={colour} stroke="var(--surface)" strokeWidth={2} />
										)}
										{active !== undefined && valueAt(item, dates[active]) !== undefined && (
											<circle cx={x(active)} cy={y(valueAt(item, dates[active])!)} r={4} fill={colour} stroke="var(--surface)" strokeWidth={2} />
										)}
									</g>
								);
							})}
						</svg>
					)}
					{active !== undefined && (
						<div
							role="status"
							className="pointer-events-none absolute top-2 z-10 min-w-32 rounded-lg border border-border bg-overlay px-3 py-2 text-overlay-foreground shadow-sm"
							style={
								x(active) > width / 2
									? { right: width - x(active) + 12 }
									: { left: x(active) + 12 }
							}
						>
							<Paragraph size="xs" color="muted">{formatDate(dates[active])}</Paragraph>
							{series.map((item, index) => {
								const value = valueAt(item, dates[active]);
								return (
									<div key={index} className="mt-1 flex items-center gap-2 text-xs">
										<span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: seriesColour(index) }} />
										<span className="font-semibold tabular-nums">
											{value === undefined ? "—" : `${formatValue(value)} ${unit}`}
										</span>
										{series.length > 1 && <span className="text-muted">{item.label}</span>}
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
			{annotation && (
				<Paragraph size="xs" color="muted" className="mt-2">
					{formatDate(annotation.at)}: {text(["annotation", "label"], annotation.label, "Annotation")}
				</Paragraph>
			)}
		</BlockSection>
	);
}

ActivityTrend.template = "activity-trend" as const;
ActivityTrend.info =
	"Small line or bar chart with a table view for dated numeric values such as throughput, open defects, deployment frequency, error rate, or sprint completion. Pick it only when supplied dated values show a meaningful trend; never manufacture time-series values.";
ActivityTrend.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
