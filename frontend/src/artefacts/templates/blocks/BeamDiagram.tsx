import { Paragraph } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { BeamLoad, BeamPoint, BeamSupport } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { formatValue, linearScale } from "./chart";

const margin = { left: 64, right: 28 };
const loadingHeight = 170;
const panelHeight = 132;
const beamY = 104;

/** The diagram's value at `x`, reading the later point at a jump (repeated x). */
function valueAt(points: BeamPoint[], x: number) {
	for (let i = points.length - 1; i > 0; i--) {
		const a = points[i - 1];
		const b = points[i];
		if (x >= a.x && x <= b.x) {
			if (b.x === a.x) return b.value;
			return a.value + ((x - a.x) / (b.x - a.x)) * (b.value - a.value);
		}
	}
	return undefined;
}

function Support({ support, x }: { support: BeamSupport; x: number }) {
	if (support.type === "fixed") {
		// A wall on the side of the beam the support sits at.
		const side = support.at === 0 ? -1 : 1;
		return (
			<g className="stroke-foreground" strokeWidth={1.5}>
				<line x1={x} x2={x} y1={beamY - 28} y2={beamY + 28} strokeWidth={3} />
				{Array.from({ length: 7 }, (_, i) => (
					<line key={i} x1={x} x2={x + side * 10} y1={beamY - 24 + i * 8} y2={beamY - 16 + i * 8} />
				))}
			</g>
		);
	}
	return (
		<g className="stroke-foreground" strokeWidth={1.5}>
			<path d={`M${x} ${beamY + 3} L${x - 11} ${beamY + 22} L${x + 11} ${beamY + 22} Z`} className="fill-surface" />
			{support.type === "roller" ? (
				<>
					<circle cx={x - 6} cy={beamY + 27} r={4} className="fill-surface" />
					<circle cx={x + 6} cy={beamY + 27} r={4} className="fill-surface" />
					<line x1={x - 16} x2={x + 16} y1={beamY + 32} y2={beamY + 32} />
				</>
			) : (
				<line x1={x - 16} x2={x + 16} y1={beamY + 23} y2={beamY + 23} />
			)}
		</g>
	);
}

function Arrow({ x, from, to }: { x: number; from: number; to: number }) {
	const direction = Math.sign(to - from) || 1;
	return (
		<g className="stroke-chart-2" strokeWidth={2} strokeLinecap="round">
			<line x1={x} x2={x} y1={from} y2={to - direction * 2} />
			<path d={`M${x - 5} ${to - direction * 8} L${x} ${to} L${x + 5} ${to - direction * 8} Z`} className="fill-chart-2" strokeLinejoin="round" />
		</g>
	);
}

function Load({ load, px, forceUnit }: { load: BeamLoad; px: (x: number) => number; forceUnit: string }) {
	const x = px(load.at);
	// Positive magnitudes act downwards onto the beam.
	const down = load.magnitude >= 0;
	const label = load.label ?? `${formatValue(Math.abs(load.magnitude))} ${load.kind === "udl" ? `${forceUnit}/m` : load.kind === "moment" ? `${forceUnit}·m` : forceUnit}`;
	if (load.kind === "point") {
		return (
			<g>
				{down ? <Arrow x={x} from={beamY - 58} to={beamY - 4} /> : <Arrow x={x} from={beamY + 58} to={beamY + 4} />}
				<text x={x} y={down ? beamY - 64 : beamY + 72} textAnchor="middle" className="fill-foreground text-[12px] font-medium">
					{label}
				</text>
			</g>
		);
	}
	if (load.kind === "udl" && load.to !== null) {
		const x2 = px(load.to);
		const count = Math.max(2, Math.round(Math.abs(x2 - x) / 22));
		return (
			<g>
				<rect x={Math.min(x, x2)} y={beamY - 40} width={Math.abs(x2 - x)} height={36} className="fill-chart-2" opacity={0.1} />
				<line x1={x} x2={x2} y1={beamY - 40} y2={beamY - 40} strokeWidth={2} className="stroke-chart-2" />
				{Array.from({ length: count + 1 }, (_, i) => (
					<Arrow key={i} x={x + ((x2 - x) * i) / count} from={beamY - 40} to={beamY - 4} />
				))}
				<text x={(x + x2) / 2} y={beamY - 48} textAnchor="middle" className="fill-foreground text-[12px] font-medium">
					{label}
				</text>
			</g>
		);
	}
	// A moment: a three-quarter arc around the point, clockwise when positive.
	const r = 16;
	const clockwise = load.magnitude >= 0;
	return (
		<g className="stroke-chart-2" strokeWidth={2} fill="none">
			<path d={`M${x - r} ${beamY} A${r} ${r} 0 1 ${clockwise ? 1 : 0} ${x} ${beamY + (clockwise ? r : -r)}`} />
			<path
				d={clockwise ? `M${x - 5} ${beamY + r - 5} L${x} ${beamY + r} L${x - 5} ${beamY + r + 5}` : `M${x - 5} ${beamY - r - 5} L${x} ${beamY - r} L${x - 5} ${beamY - r + 5}`}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<text x={x} y={beamY - r - 10} textAnchor="middle" stroke="none" className="fill-foreground text-[12px] font-medium">
				{label}
			</text>
		</g>
	);
}

function DiagramPanel({
	title,
	points,
	unit,
	px,
	width,
	fill,
	stroke,
	cursor,
}: {
	title: string;
	points: BeamPoint[];
	unit: string;
	px: (x: number) => number;
	width: number;
	fill: string;
	stroke: string;
	cursor?: number;
}) {
	const values = points.map((point) => point.value);
	const scale = linearScale([...values, 0], 4);
	const top = 16;
	const plotHeight = panelHeight - top - 12;
	const py = (value: number) => top + (1 - scale.fraction(value)) * plotHeight;
	const zero = py(0);
	const line = points.map((point, i) => `${i ? "L" : "M"}${px(point.x)} ${py(point.value)}`).join(" ");
	const area = `${line} L${px(points[points.length - 1].x)} ${zero} L${px(points[0].x)} ${zero} Z`;
	// Label the largest magnitude, the value readers look for.
	const peak = points.reduce((best, point) => (Math.abs(point.value) > Math.abs(best.value) ? point : best), points[0]);
	const reading = cursor === undefined ? undefined : valueAt(points, cursor);
	return (
		<svg width={width} height={panelHeight} role="img" aria-label={`${title}: peak ${formatValue(peak.value)} ${unit} at ${formatValue(peak.x)}`} className="block overflow-visible">
			<text x={0} y={10} className="fill-muted text-[11px] font-medium">
				{title} ({unit})
			</text>
			{scale.ticks.map((tick) => (
				<text key={tick} x={margin.left - 10} y={py(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
					{formatValue(tick)}
				</text>
			))}
			<path d={area} className={fill} opacity={0.12} />
			<line x1={margin.left} x2={width - margin.right} y1={zero} y2={zero} className="stroke-border" />
			<path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" className={stroke} />
			<circle cx={px(peak.x)} cy={py(peak.value)} r={4} strokeWidth={2} className={`stroke-surface ${fill}`} />
			<text
				x={px(peak.x)}
				y={peak.value >= 0 ? py(peak.value) - 9 : py(peak.value) + 17}
				textAnchor="middle"
				className="fill-foreground text-[12px] font-semibold tabular-nums"
			>
				{formatValue(peak.value)}
			</text>
			{cursor !== undefined && reading !== undefined && (
				<>
					<line x1={px(cursor)} x2={px(cursor)} y1={top} y2={top + plotHeight} className="stroke-border" />
					<circle cx={px(cursor)} cy={py(reading)} r={3.5} className={fill} />
					<text x={px(cursor) + 8} y={top + 10} className="fill-foreground text-[11px] tabular-nums">
						{formatValue(reading)}
					</text>
				</>
			)}
		</svg>
	);
}

export function BeamDiagram({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		length: number;
		lengthUnit: string;
		forceUnit: string;
		supports: BeamSupport[];
		loads: BeamLoad[];
		shear: BeamPoint[];
		moment: BeamPoint[];
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
	const px = (x: number) => margin.left + (x / data.length) * plotWidth;
	// Dimension ticks at the ends, supports, and load positions.
	const marks = [...new Set([0, data.length, ...data.supports.map((s) => s.at), ...data.loads.flatMap((l) => [l.at, ...(l.to === null ? [] : [l.to])])])]
		.filter((x) => x >= 0 && x <= data.length)
		.sort((a, b) => a - b);

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<div
				ref={frame}
				className="select-none"
				onPointerMove={(event) => {
					const box = frame.current?.getBoundingClientRect();
					if (!box) return;
					const x = ((event.clientX - box.left - margin.left) / plotWidth) * data.length;
					setCursor(x < 0 || x > data.length ? undefined : x);
				}}
				onPointerLeave={() => setCursor(undefined)}
			>
				<svg width={width} height={loadingHeight} role="img" aria-label={`Beam of ${data.length} ${data.lengthUnit} with ${data.supports.length} supports and ${data.loads.length} loads`} className="block overflow-visible">
					<text x={0} y={10} className="fill-muted text-[11px] font-medium">
						Loading
					</text>
					{data.loads.map((load, index) => (
						<Load key={index} load={load} px={px} forceUnit={data.forceUnit} />
					))}
					<line x1={px(0)} x2={px(data.length)} y1={beamY} y2={beamY} strokeWidth={5} strokeLinecap="round" className="stroke-foreground" />
					{data.supports.map((support, index) => (
						<Support key={index} support={support} x={px(support.at)} />
					))}
					<g className="fill-muted text-[10px] tabular-nums">
						<line x1={px(0)} x2={px(data.length)} y1={loadingHeight - 16} y2={loadingHeight - 16} className="stroke-border" />
						{marks.map((x) => (
							<g key={x}>
								<line x1={px(x)} x2={px(x)} y1={loadingHeight - 20} y2={loadingHeight - 12} className="stroke-muted" />
								<text x={px(x)} y={loadingHeight - 1} textAnchor="middle">
									{formatValue(x)}
									{x === data.length ? ` ${data.lengthUnit}` : ""}
								</text>
							</g>
						))}
					</g>
				</svg>
				{data.shear.length >= 2 && (
					<DiagramPanel title="Shear force" points={data.shear} unit={data.forceUnit} px={px} width={width} fill="fill-chart-1" stroke="stroke-chart-1" cursor={cursor} />
				)}
				{data.moment.length >= 2 && (
					<DiagramPanel title="Bending moment" points={data.moment} unit={`${data.forceUnit}·${data.lengthUnit}`} px={px} width={width} fill="fill-chart-3" stroke="stroke-chart-3" cursor={cursor} />
				)}
			</div>
			{cursor !== undefined && (
				<Paragraph size="xs" color="muted" className="mt-1 tabular-nums">
					x = {formatValue(cursor)} {data.lengthUnit}
				</Paragraph>
			)}
		</BlockSection>
	);
}

BeamDiagram.template = "beam-diagram" as const;
BeamDiagram.info =
	"Structural beam with its supports and point, distributed, and moment loads, above shear force and bending moment diagrams on the same span. Pick it for beam calculations or design checks when the source gives the loading and, ideally, the diagram values.";
BeamDiagram.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
