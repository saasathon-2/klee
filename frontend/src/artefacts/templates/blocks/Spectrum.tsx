import { Paragraph, Table } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";
import type { SpectrumPeak } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { formatValue, linearScale } from "./chart";

type Technique = "nmr-1h" | "nmr-13c" | "ir" | "ms" | "uv-vis";

/** Each technique's axis, conventional direction, and default window. */
const techniques: Record<Technique, { name: string; axis: string; reversed: boolean; dips: boolean; range: [number, number] }> = {
	"nmr-1h": { name: "¹H NMR", axis: "δ (ppm)", reversed: true, dips: false, range: [0, 12] },
	"nmr-13c": { name: "¹³C NMR", axis: "δ (ppm)", reversed: true, dips: false, range: [0, 220] },
	ir: { name: "IR", axis: "Wavenumber (cm⁻¹)", reversed: true, dips: true, range: [400, 4000] },
	ms: { name: "Mass spectrum", axis: "m/z", reversed: false, dips: false, range: [0, 0] },
	"uv-vis": { name: "UV–vis", axis: "Wavelength (nm)", reversed: false, dips: false, range: [200, 800] },
};

const height = 260;
const margin = { top: 36, right: 16, bottom: 40, left: 16 };
/** Peaks without an intensity are drawn at a neutral height. */
const defaultIntensity = 60;

export function Spectrum({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		technique: Technique;
		peaks: SpectrumPeak[];
	};
	const text = editableFor(node, context);
	const technique = techniques[data.technique] ?? techniques.ms;
	const frame = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState(640);
	const [active, setActive] = useState<number>();

	useLayoutEffect(() => {
		const element = frame.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const positions = data.peaks.map((peak) => peak.position);
	// The technique's conventional window, widened to fit every peak; MS has
	// no fixed window, so it pads around the peaks instead.
	const fixed = technique.range[1] > technique.range[0];
	const low = Math.min(...positions, ...(fixed ? [technique.range[0]] : []));
	const high = Math.max(...positions, ...(fixed ? [technique.range[1]] : []));
	const pad = fixed ? 0 : (high - low || 1) * 0.08;
	const scale = linearScale([low - pad, high + pad], 8);
	const plotWidth = Math.max(width - margin.left - margin.right, 40);
	const plotHeight = height - margin.top - margin.bottom;
	const px = (value: number) =>
		margin.left + (technique.reversed ? 1 - scale.fraction(value) : scale.fraction(value)) * plotWidth;
	const baseline = technique.dips ? margin.top : margin.top + plotHeight;
	const tip = (peak: SpectrumPeak) => {
		const size = ((peak.intensity ?? defaultIntensity) / 100) * plotHeight;
		return technique.dips ? baseline + size : baseline - size;
	};

	// Label the tallest peaks first, skipping any that would collide.
	const labelled = new Set<number>();
	const taken: number[] = [];
	data.peaks
		.map((peak, index) => ({ peak, index }))
		.filter(({ peak }) => peak.label)
		.sort((a, b) => (b.peak.intensity ?? defaultIntensity) - (a.peak.intensity ?? defaultIntensity))
		.forEach(({ peak, index }) => {
			const x = px(peak.position);
			if (taken.every((other) => Math.abs(other - x) > 56)) {
				labelled.add(index);
				taken.push(x);
			}
		});

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<Paragraph size="xs" weight="medium" color="muted" className="mb-2 uppercase tracking-wide">
				{technique.name}
			</Paragraph>
			<div ref={frame} className="relative">
				<svg width={width} height={height} role="img" aria-label={`${technique.name} with ${data.peaks.length} peaks; see the table below`} className="block">
					{scale.ticks.map((tick) => (
						<g key={tick}>
							<line x1={px(tick)} x2={px(tick)} y1={margin.top + plotHeight} y2={margin.top + plotHeight + 4} className="stroke-muted" />
							<text x={px(tick)} y={margin.top + plotHeight + 16} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
								{formatValue(tick)}
							</text>
						</g>
					))}
					<line x1={margin.left} x2={margin.left + plotWidth} y1={margin.top + plotHeight} y2={margin.top + plotHeight} className="stroke-border" />
					{technique.dips && (
						<line x1={margin.left} x2={margin.left + plotWidth} y1={baseline} y2={baseline} className="stroke-separator" />
					)}
					<text x={margin.left + plotWidth / 2} y={height - 4} textAnchor="middle" className="fill-muted text-[11px]">
						{technique.axis}
					</text>
					{data.peaks.map((peak, index) => {
						const x = px(peak.position);
						const isActive = active === index;
						return (
							<g
								key={index}
								tabIndex={0}
								role="button"
								aria-label={`${formatValue(peak.position)}${peak.label ? `, ${peak.label}` : ""}${peak.assignment ? `, ${peak.assignment}` : ""}`}
								onPointerEnter={() => setActive(index)}
								onPointerLeave={() => setActive(undefined)}
								onFocus={() => setActive(index)}
								onBlur={() => setActive(undefined)}
								className="outline-none"
								opacity={active === undefined || isActive ? 1 : 0.35}
							>
								{/* A wide transparent hit area around a thin stick. */}
								<rect x={x - 8} y={margin.top} width={16} height={plotHeight} fill="transparent" />
								<line x1={x} x2={x} y1={baseline} y2={tip(peak)} strokeWidth={2} strokeLinecap="round" className="stroke-chart-1" />
								{(labelled.has(index) || isActive) && peak.label && (
									<text x={x} y={technique.dips ? tip(peak) + 14 : tip(peak) - 6} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
										{peak.label}
									</text>
								)}
							</g>
						);
					})}
				</svg>
				{active !== undefined && data.peaks[active]?.assignment && (
					<div
						className="pointer-events-none absolute top-0 z-10 max-w-60 rounded-lg border border-border bg-overlay px-3 py-2 text-overlay-foreground shadow-sm"
						style={px(data.peaks[active].position) > width / 2 ? { right: width - px(data.peaks[active].position) + 12 } : { left: px(data.peaks[active].position) + 12 }}
					>
						<Paragraph size="xs" weight="semibold" className="tabular-nums">
							{formatValue(data.peaks[active].position)} {technique.axis.match(/\((.*)\)/)?.[1] ?? ""}
						</Paragraph>
						<Paragraph size="xs" color="muted">
							{data.peaks[active].assignment}
						</Paragraph>
					</div>
				)}
			</div>
			{context.isEditing ? (
				// Table keyboard navigation would swallow keystrokes, so edit as a list.
				<ul className="mt-4 flex flex-col gap-2">
					{data.peaks.map((peak, index) =>
						peak.assignment ? (
							<li key={index} className="flex items-center gap-3">
								<span className="w-16 shrink-0 text-sm tabular-nums">{formatValue(peak.position)}</span>
								{text(["peaks", index, "assignment"], peak.assignment, "Assignment")}
							</li>
						) : null,
					)}
				</ul>
			) : (
			<Table className="mt-4">
				<Table.ScrollContainer>
					<Table.Content aria-label={`${data.title} peaks`}>
						<Table.Header>
							<Table.Column isRowHeader>{technique.axis}</Table.Column>
							<Table.Column>Signal</Table.Column>
							<Table.Column>Assignment</Table.Column>
						</Table.Header>
						<Table.Body>
							{data.peaks.map((peak, index) => (
								<Table.Row key={index} id={`peak-${index}`}>
									<Table.Cell className="font-medium tabular-nums">{formatValue(peak.position)}</Table.Cell>
									<Table.Cell className="text-muted">{peak.label ?? "—"}</Table.Cell>
									<Table.Cell className="text-muted">{peak.assignment ?? "—"}</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
			)}
		</BlockSection>
	);
}

Spectrum.template = "spectrum" as const;
Spectrum.info =
	"Stick spectrum drawn in each technique's convention (¹H/¹³C NMR, IR, MS, UV–vis) from supplied peak positions and intensities, with labels and assignments in a peak table. Pick it for characterisation data or interpreting a spectrum.";
Spectrum.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
