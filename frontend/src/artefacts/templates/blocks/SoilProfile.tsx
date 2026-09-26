import { Paragraph } from "@heroui/react";
import type { ReactNode } from "react";
import type { SoilLayer, SoilMaterial, SoilTest } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { formatValue, linearScale } from "./chart";

const columnWidth = 76;
const axisWidth = 44;
const testWidth = 150;
const pxPerUnit = 44;

/** Conventional log hatching, one tile per material, drawn in muted ink. */
const materials: Record<SoilMaterial, { label: string; tile: number; pattern: ReactNode }> = {
	topsoil: {
		label: "Topsoil",
		tile: 12,
		pattern: <path d="M2 10 V5 M6 10 V6 M10 10 V4" />,
	},
	"made-ground": {
		label: "Made ground",
		tile: 14,
		pattern: <path d="M3 3 L8 8 M8 3 L3 8 M9 10 L12 13" />,
	},
	clay: { label: "Clay", tile: 12, pattern: <path d="M1 4 H7 M7 10 H13" /> },
	silt: { label: "Silt", tile: 12, pattern: <path d="M1 4 H5 M8 4 H9 M7 10 H11 M2 10 H3" /> },
	sand: {
		label: "Sand",
		tile: 8,
		pattern: (
			<>
				<circle cx={2} cy={2} r={0.9} stroke="none" fill="currentColor" />
				<circle cx={6} cy={6} r={0.9} stroke="none" fill="currentColor" />
			</>
		),
	},
	gravel: {
		label: "Gravel",
		tile: 14,
		pattern: (
			<>
				<circle cx={4} cy={4} r={2.4} fill="none" />
				<circle cx={11} cy={10} r={2} fill="none" />
			</>
		),
	},
	peat: { label: "Peat", tile: 14, pattern: <path d="M1 5 Q4 2 7 5 T13 5 M1 11 Q4 8 7 11 T13 11" fill="none" /> },
	rock: { label: "Rock", tile: 16, pattern: <path d="M0 0.5 H16 M0 8.5 H16 M4 0.5 V8.5 M12 8.5 V16" /> },
};

export function SoilProfile({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		borehole: string;
		depthUnit: string;
		layers: SoilLayer[];
		waterTable: number | null;
		testLabel: string | null;
		tests: SoilTest[];
	};
	const text = editableFor(node, context);
	const bottom = Math.max(...data.layers.map((layer) => layer.to), ...data.tests.map((test) => test.depth));
	const depthScale = linearScale([0, bottom], Math.max(3, Math.round(bottom / 2)));
	const maxDepth = depthScale.domain[1];
	const height = Math.min(720, Math.max(320, maxDepth * pxPerUnit));
	const top = 10;
	const py = (depth: number) => top + (depth / maxDepth) * (height - top - 8);
	const hasTests = data.tests.length > 0;
	const testScale = hasTests ? linearScale([0, ...data.tests.map((test) => test.value)], 4) : undefined;
	const tx = (value: number) => 12 + testScale!.fraction(value) * (testWidth - 24);
	const idFor = (material: SoilMaterial) => `soil-${node.id}-${material}`;

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<div className="flex items-baseline justify-between gap-3">
				<Paragraph size="xs" weight="medium" color="muted" className="uppercase tracking-wide">
					Borehole {data.borehole}
				</Paragraph>
				{data.waterTable !== null && (
					<Paragraph size="xs" color="muted">
						<span className="text-chart-1">▼</span> Groundwater at {formatValue(data.waterTable)} {data.depthUnit}
					</Paragraph>
				)}
			</div>
			<div className="mt-3 flex items-stretch" style={{ height }}>
				<svg
					width={axisWidth + columnWidth}
					height={height}
					role="img"
					aria-label={`Borehole ${data.borehole}: ${data.layers.map((layer) => `${materials[layer.material]?.label ?? layer.material} from ${layer.from} to ${layer.to} ${data.depthUnit}`).join("; ")}`}
					className="block shrink-0 overflow-visible"
				>
					<defs>
						{Object.entries(materials).map(([material, { tile, pattern }]) => (
							<pattern key={material} id={idFor(material as SoilMaterial)} width={tile} height={tile} patternUnits="userSpaceOnUse">
								<g className="stroke-muted text-muted" strokeWidth={1.1} strokeLinecap="round">
									{pattern}
								</g>
							</pattern>
						))}
					</defs>
					{depthScale.ticks.map((tick) => (
						<g key={tick}>
							<line x1={axisWidth - 6} x2={axisWidth} y1={py(tick)} y2={py(tick)} className="stroke-muted" />
							<text x={axisWidth - 10} y={py(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[10px] tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					<text x={4} y={height / 2} transform={`rotate(-90 4 ${height / 2})`} textAnchor="middle" dy="0.7em" className="fill-muted text-[10px]">
						Depth ({data.depthUnit})
					</text>
					{data.layers.map((layer, index) => (
						<g key={index}>
							<rect x={axisWidth} y={py(layer.from)} width={columnWidth} height={py(layer.to) - py(layer.from)} className="fill-surface-secondary" />
							<rect x={axisWidth} y={py(layer.from)} width={columnWidth} height={py(layer.to) - py(layer.from)} fill={`url(#${idFor(layer.material)})`} />
							<line x1={axisWidth} x2={axisWidth + columnWidth} y1={py(layer.to)} y2={py(layer.to)} className="stroke-foreground" strokeWidth={1} />
						</g>
					))}
					<rect x={axisWidth} y={py(0)} width={columnWidth} height={py(bottom) - py(0)} fill="none" className="stroke-foreground" strokeWidth={1.5} />
					{data.waterTable !== null && data.waterTable <= bottom && (
						<g className="stroke-chart-1 fill-chart-1">
							<line x1={axisWidth - 4} x2={axisWidth + columnWidth + 4} y1={py(data.waterTable)} y2={py(data.waterTable)} strokeWidth={2} />
							<path d={`M${axisWidth + columnWidth / 2 - 6} ${py(data.waterTable) - 11} h12 l-6 9 Z`} stroke="none" />
						</g>
					)}
				</svg>
				<ol className="relative min-w-0 flex-1" aria-label="Strata">
					{data.layers.map((layer, index) => {
						const layerHeight = py(layer.to) - py(layer.from);
						return (
							<li
								key={index}
								className="absolute inset-x-0 overflow-hidden border-t border-separator px-3 pt-1"
								style={{ top: py(layer.from), height: layerHeight }}
							>
								<Paragraph size="xs" weight="semibold" className="truncate">
									{materials[layer.material]?.label ?? layer.material}
									<span className="ml-2 font-normal text-muted tabular-nums">
										{formatValue(layer.from)}–{formatValue(layer.to)} {data.depthUnit}
									</span>
								</Paragraph>
								{layerHeight > 34 && (
									<Paragraph size="xs" color="muted" className={context.isEditing ? "" : "line-clamp-3"}>
										{text(["layers", index, "description"], layer.description, "Layer description", true)}
									</Paragraph>
								)}
							</li>
						);
					})}
				</ol>
				{hasTests && testScale && (
					<svg width={testWidth} height={height} role="img" aria-label={`${data.testLabel ?? "Test"} values: ${data.tests.map((test) => `${test.value} at ${test.depth} ${data.depthUnit}`).join(", ")}`} className="block shrink-0 overflow-visible">
						<text x={testWidth / 2} y={top - 2} textAnchor="middle" className="fill-muted text-[10px] font-medium">
							{data.testLabel ?? "Test value"}
						</text>
						{testScale.ticks.map((tick) => (
							<g key={tick}>
								<line x1={tx(tick)} x2={tx(tick)} y1={py(0)} y2={py(maxDepth)} className="stroke-separator" />
								<text x={tx(tick)} y={height + 4} textAnchor="middle" className="fill-muted text-[10px] tabular-nums">
									{formatValue(tick)}
								</text>
							</g>
						))}
						<path
							d={[...data.tests].sort((a, b) => a.depth - b.depth).map((test, i) => `${i ? "L" : "M"}${tx(test.value)} ${py(test.depth)}`).join(" ")}
							fill="none"
							strokeWidth={2}
							strokeLinejoin="round"
							className="stroke-chart-2"
						/>
						{data.tests.map((test, index) => (
							<circle key={index} cx={tx(test.value)} cy={py(test.depth)} r={4} strokeWidth={2} className="fill-chart-2 stroke-surface" />
						))}
					</svg>
				)}
			</div>
		</BlockSection>
	);
}

SoilProfile.template = "soil-profile" as const;
SoilProfile.info =
	"Borehole log: strata drawn with conventional hatching down a depth scale, with descriptions, the groundwater level, and in-situ test values such as SPT N plotted alongside. Pick it for site investigation or geotechnical data.";
SoilProfile.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
