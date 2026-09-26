import type { RiskBand } from "../../model";

/** Whole-class strings so Tailwind generates them. Index = band level (1-5). */
export const riskSwatch = ["", "bg-risk-1", "bg-risk-2", "bg-risk-3", "bg-risk-4", "bg-risk-5"];
export const riskTint = [
	"bg-surface-secondary",
	"bg-risk-1/20",
	"bg-risk-2/25",
	"bg-risk-3/30",
	"bg-risk-4/30",
	"bg-risk-5/30",
];

/** The band a score falls in; scores outside every band get none. */
export function bandFor(score: number, bands: RiskBand[]) {
	return bands.find((band) => score >= band.min && score <= band.max);
}

/** Clamps a model-given level into the 1-5 colour scale. */
export const bandLevel = (band: RiskBand | undefined) =>
	band ? Math.min(5, Math.max(1, Math.round(band.level))) : 0;

/** Integers print plainly; other scores keep one decimal. */
export const formatScore = (score: number) =>
	Number.isInteger(score) ? String(score) : score.toFixed(1);
