import {
	Paragraph,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
} from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { RiskBand, RiskHazard, RiskLevel } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { bandFor, bandLevel, formatScore, riskSwatch, riskTint } from "./risk";
import { RiskScore } from "./RiskScore";

type View = "raw" | "residual";

function position(hazard: RiskHazard, view: View) {
	return view === "residual" && hazard.residualLikelihood !== null && hazard.residualImpact !== null
		? { likelihood: hazard.residualLikelihood, impact: hazard.residualImpact }
		: { likelihood: hazard.likelihood, impact: hazard.impact };
}

function HazardBadge({ hazard }: { hazard: RiskHazard }) {
	return (
		<Tooltip delay={200}>
			<Tooltip.Trigger
				aria-label={`${hazard.id}: ${hazard.label}`}
				className="grid h-6 min-w-6 cursor-default place-items-center rounded-full bg-surface px-1.5 text-xs font-semibold text-surface-foreground ring-2 ring-surface outline-none focus-visible:ring-focus"
			>
				{hazard.id}
			</Tooltip.Trigger>
			<Tooltip.Content showArrow>
				<Tooltip.Arrow />
				{hazard.label}
			</Tooltip.Content>
		</Tooltip>
	);
}

export function RiskMatrix({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		likelihoodLabel: string;
		impactLabel: string;
		likelihoodLevels: RiskLevel[];
		impactLevels: RiskLevel[];
		bands: RiskBand[];
		hazards: RiskHazard[];
	};
	const hasResidual = data.hazards.some((hazard) => hazard.residualLikelihood !== null);
	const [view, setView] = useState<View>("raw");
	const rows = [...data.likelihoodLevels].reverse();

	return (
		<BlockSection
			title={data.title}
			description={data.description}
			edit={{ node, context }}
			action={
				hasResidual && (
					<ToggleButtonGroup
						aria-label="Risk shown"
						size="sm"
						selectionMode="single"
						disallowEmptySelection
						selectedKeys={[view]}
						onSelectionChange={(keys) => setView([...keys][0] as View)}
						className="shrink-0"
					>
						<ToggleButton id="raw">Raw</ToggleButton>
						<ToggleButton id="residual">Residual</ToggleButton>
					</ToggleButtonGroup>
				)
			}
		>
			<div className="overflow-x-auto pb-2">
				<div
					role="table"
					aria-label={`${data.title}: ${data.likelihoodLabel} by ${data.impactLabel}`}
					className="grid min-w-fit gap-0.5"
					style={{
						gridTemplateColumns: `minmax(6rem, auto) repeat(${data.impactLevels.length}, minmax(4.5rem, 1fr))`,
					}}
				>
					{rows.map((likelihood) => (
						<div key={likelihood.value} role="row" className="contents">
							<div
								role="rowheader"
								className="flex flex-col justify-center pr-3 text-right text-xs"
							>
								<span className="font-medium">{likelihood.label}</span>
								<span className="text-muted tabular-nums">{formatScore(likelihood.value)}</span>
							</div>
							{data.impactLevels.map((impact) => {
								const score = likelihood.value * impact.value;
								const band = bandFor(score, data.bands);
								const here = data.hazards.filter((hazard) => {
									const at = position(hazard, view);
									return at.likelihood === likelihood.value && at.impact === impact.value;
								});
								return (
									<div
										key={impact.value}
										role="cell"
										aria-label={`${likelihood.label} × ${impact.label}: ${formatScore(score)}${band ? `, ${band.label}` : ""}${here.length ? `, ${here.length} hazard${here.length === 1 ? "" : "s"}` : ""}`}
										className={`relative flex min-h-16 flex-wrap content-start gap-1 rounded-sm p-1.5 pt-5 ${riskTint[bandLevel(band)]}`}
									>
										<span className="absolute top-1 right-1.5 text-xs text-muted tabular-nums">
											{formatScore(score)}
										</span>
										{here.map((hazard) => (
											<HazardBadge key={hazard.id} hazard={hazard} />
										))}
									</div>
								);
							})}
						</div>
					))}
					<div role="row" className="contents">
						<div role="columnheader" className="pt-2 pr-3 text-right text-xs font-semibold">
							{data.likelihoodLabel} / {data.impactLabel}
						</div>
						{data.impactLevels.map((impact) => (
							<div key={impact.value} role="columnheader" className="px-1 pt-2 text-center text-xs">
								<span className="block font-medium">{impact.label}</span>
								<span className="text-muted tabular-nums">{formatScore(impact.value)}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			<ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Risk bands">
				{data.bands.map((band) => (
					<li key={band.label} className="flex gap-3">
						<span aria-hidden className={`mt-1 size-3 shrink-0 rounded-sm ${riskSwatch[bandLevel(band)]}`} />
						<div className="min-w-0">
							<p className="text-sm font-medium">
								{band.label}{" "}
								<span className="font-normal text-muted tabular-nums">
									{formatScore(band.min)}–{formatScore(band.max)}
								</span>
							</p>
							<Paragraph size="xs" color="muted">{band.tolerance}</Paragraph>
						</div>
					</li>
				))}
			</ul>

			{data.hazards.length > 0 && (
				<details className="mt-6 border-t border-border pt-4 text-sm">
					<summary className="cursor-pointer font-medium">
						All {data.hazards.length} hazards
					</summary>
					<ul className="mt-3 divide-y divide-border">
						{data.hazards.map((hazard) => (
							<li key={hazard.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
								<span className="w-10 shrink-0 font-semibold tabular-nums">{hazard.id}</span>
								<span className="min-w-0 flex-1">{hazard.label}</span>
								<span className="flex items-center gap-2">
									<RiskScore score={hazard.likelihood * hazard.impact} bands={data.bands} />
									{hazard.residualLikelihood !== null && hazard.residualImpact !== null && (
										<>
											<ArrowRight aria-label="after controls" size={14} className="text-muted" />
											<RiskScore
												score={hazard.residualLikelihood * hazard.residualImpact}
												bands={data.bands}
											/>
										</>
									)}
								</span>
							</li>
						))}
					</ul>
				</details>
			)}
		</BlockSection>
	);
}

RiskMatrix.template = "risk-matrix" as const;
RiskMatrix.info =
	"Likelihood × impact heatmap with coloured risk bands and each hazard plotted by id, optionally before and after controls. Pick it for risk assessments.";
RiskMatrix.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
