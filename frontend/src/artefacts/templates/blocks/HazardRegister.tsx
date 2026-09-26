import {
	Heading,
	Table,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { useState } from "react";
import type { RegisterHazard, RiskBand } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";
import { bandFor, bandLevel, riskSwatch } from "./risk";
import { RiskScore } from "./RiskScore";

type Row = RegisterHazard & { group: string; score: number };
type Order = "grouped" | "risk";

function HazardTable({
	label,
	rows,
	bands,
	likelihoodLabel,
	impactLabel,
	showGroup,
}: {
	label: string;
	rows: Row[];
	bands: RiskBand[];
	likelihoodLabel: string;
	impactLabel: string;
	showGroup: boolean;
}) {
	const hasOwner = rows.some((row) => row.owner);
	const hasResidual = rows.some((row) => row.residualLikelihood !== null);
	return (
		<Table>
			<Table.ScrollContainer>
				<Table.Content aria-label={label}>
					<Table.Header>
						<Table.Column className="w-14">ID</Table.Column>
						<Table.Column isRowHeader>Hazard</Table.Column>
						<Table.Column>Risk</Table.Column>
						<Table.Column>Controls</Table.Column>
						{hasOwner ? <Table.Column>Owner</Table.Column> : null}
						{hasResidual ? <Table.Column>Residual</Table.Column> : null}
					</Table.Header>
					<Table.Body>
						{rows.map((row) => (
							<Table.Row key={`${row.group}-${row.id}`} id={`${row.group}-${row.id}`}>
								<Table.Cell className="font-semibold tabular-nums">{row.id}</Table.Cell>
								<Table.Cell>
									<span className="font-medium">{row.hazard}</span>
									{showGroup && <span className="block text-xs text-muted">{row.group}</span>}
								</Table.Cell>
								<Table.Cell>
									<RiskScore score={row.score} bands={bands} />
									<span
										className="block text-xs text-muted tabular-nums"
										title={`${likelihoodLabel} × ${impactLabel}`}
									>
										{row.likelihood} × {row.impact}
									</span>
								</Table.Cell>
								<Table.Cell className="min-w-56 text-muted">{row.controls}</Table.Cell>
								{hasOwner ? <Table.Cell>{row.owner ?? "—"}</Table.Cell> : null}
								{hasResidual ? (
									<Table.Cell>
										{row.residualLikelihood !== null && row.residualImpact !== null ? (
											<RiskScore score={row.residualLikelihood * row.residualImpact} bands={bands} />
										) : (
											<span className="text-muted">—</span>
										)}
									</Table.Cell>
								) : null}
							</Table.Row>
						))}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
}

export function HazardRegister({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		likelihoodLabel: string;
		impactLabel: string;
		bands: RiskBand[];
		groups: { name: string; hazards: RegisterHazard[] }[];
	};
	const [order, setOrder] = useState<Order>("grouped");
	// Band filter: empty means every band.
	const [shownBands, setShownBands] = useState<Set<string>>(new Set());
	const rows: Row[] = data.groups.flatMap((group) =>
		group.hazards.map((hazard) => ({
			...hazard,
			group: group.name,
			score: hazard.likelihood * hazard.impact,
		})),
	);
	const visible = (row: Row) =>
		shownBands.size === 0 || shownBands.has(bandFor(row.score, data.bands)?.label ?? "");
	const shown = rows.filter(visible);
	const table = { bands: data.bands, likelihoodLabel: data.likelihoodLabel, impactLabel: data.impactLabel };

	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<ToggleButtonGroup
					aria-label="Order hazards"
					size="sm"
					selectionMode="single"
					disallowEmptySelection
					selectedKeys={[order]}
					onSelectionChange={(keys) => setOrder([...keys][0] as Order)}
				>
					<ToggleButton id="grouped">By group</ToggleButton>
					<ToggleButton id="risk">Highest risk</ToggleButton>
				</ToggleButtonGroup>
				<ToggleButtonGroup
					aria-label="Filter by risk band"
					size="sm"
					selectionMode="multiple"
					selectedKeys={shownBands}
					onSelectionChange={(keys) => setShownBands(new Set([...keys].map(String)))}
				>
					{[...data.bands].reverse().map((band) => (
						<ToggleButton key={band.label} id={band.label}>
							<span aria-hidden className={`size-2 rounded-full ${riskSwatch[bandLevel(band)]}`} />
							{band.label}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
				<span className="text-sm text-muted">
					{shown.length} of {rows.length} hazards
				</span>
			</div>

			{shown.length === 0 ? (
				<p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
					No hazards in the selected bands.
				</p>
			) : order === "risk" ? (
				<HazardTable
					label={data.title}
					rows={[...shown].sort((a, b) => b.score - a.score)}
					showGroup
					{...table}
				/>
			) : (
				<div className="space-y-6">
					{data.groups.map((group) => {
						const groupRows = shown.filter((row) => row.group === group.name);
						if (!groupRows.length) return null;
						return (
							<div key={group.name}>
								<Heading level={4} className="mb-2 text-heading-3">
									{group.name}
								</Heading>
								<HazardTable label={group.name} rows={groupRows} showGroup={false} {...table} />
							</div>
						);
					})}
				</div>
			)}
		</BlockSection>
	);
}

HazardRegister.template = "hazard-register" as const;
HazardRegister.info =
	"Risk register table of hazards grouped by task or sub-system, with scored, colour-banded risk, controls, owners, and residual risk; sortable by risk and filterable by band.";
HazardRegister.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
