import type { RiskBand } from "../../model";
import { bandFor, bandLevel, formatScore, riskSwatch } from "./risk";

/**
 * A risk score with its band. The colour is a swatch beside the text, never
 * the text itself, and the band's name always shows, so colour isn't the
 * only signal.
 */
export function RiskScore({ score, bands }: { score: number; bands: RiskBand[] }) {
	const band = bandFor(score, bands);
	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap">
			<span
				aria-hidden
				className={`size-2.5 shrink-0 rounded-full ${riskSwatch[bandLevel(band)] || "border border-border"}`}
			/>
			<span className="font-medium tabular-nums">{formatScore(score)}</span>
			{band && <span className="text-muted">{band.label}</span>}
		</span>
	);
}
