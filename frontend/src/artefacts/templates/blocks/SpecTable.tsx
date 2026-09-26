import {
	Heading,
	Paragraph,
	Table,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { useState } from "react";
import type { SpecRow, SpecValue } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const format = (value: number | null) =>
	value === null ? "" : value.toLocaleString(undefined, { maximumSignificantDigits: 4 });

const numbers = (value: SpecValue) =>
	[value.min, value.typ, value.max].filter((part): part is number => part !== null);

/**
 * Where the selected variant's min-max span and typical value sit within
 * every variant's values for the row. Other variants show faintly behind.
 */
function RangeBar({ values, selected }: { values: SpecValue[]; selected: number }) {
	const all = values.flatMap(numbers);
	const value = values[selected];
	if (!value || numbers(value).length === 0 || all.length < 2) return null;
	const low = Math.min(...all);
	const high = Math.max(...all);
	const pad = (high - low) * 0.08 || Math.abs(high) * 0.1 || 1;
	const at = (part: number) => ((part - low + pad) / (high - low + pad * 2)) * 100;
	const span = (item: SpecValue) => {
		const parts = numbers(item);
		const from = at(item.min ?? Math.min(...parts));
		const to = at(item.max ?? Math.max(...parts));
		return { left: `${from}%`, width: `${Math.max(to - from, 0.8)}%` };
	};
	return (
		<div aria-hidden className="relative h-4 w-32">
			<div className="absolute top-1/2 h-px w-full bg-border" />
			{values.map((item, index) =>
				index === selected || numbers(item).length === 0 ? null : (
					<div
						key={index}
						className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted/30"
						style={span(item)}
					/>
				),
			)}
			<div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-chart-1" style={span(value)} />
			{value.typ !== null && (
				<div
					className="absolute top-0 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-surface"
					style={{ left: `${at(value.typ)}%` }}
				/>
			)}
		</div>
	);
}

export function SpecTable({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		conditions: string | null;
		variants: string[];
		sections: { name: string; rows: SpecRow[] }[];
	};
	const [variant, setVariant] = useState(0);
	return (
		<BlockSection
			title={data.title}
			description={data.description}
			edit={{ node, context }}
			action={
				data.variants.length > 1 && (
					<ToggleButtonGroup
						aria-label="Part variant"
						size="sm"
						selectionMode="single"
						disallowEmptySelection
						selectedKeys={[String(variant)]}
						onSelectionChange={(keys) => setVariant(Number([...keys][0]))}
						className="shrink-0"
					>
						{data.variants.map((name, index) => (
							<ToggleButton key={index} id={String(index)}>
								{name}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				)
			}
		>
			{data.conditions && (
				<Paragraph size="sm" color="muted" className="mb-4">
					Unless noted: {data.conditions}
				</Paragraph>
			)}
			<div className="space-y-6">
				{data.sections.map((section) => (
					<div key={section.name}>
						<Heading level={4} className="mb-2 text-overline uppercase text-muted">
							{section.name}
						</Heading>
						<Table>
							<Table.ScrollContainer>
								<Table.Content aria-label={`${section.name}, ${data.variants[variant]}`}>
									<Table.Header>
										<Table.Column isRowHeader>Parameter</Table.Column>
										<Table.Column>Conditions</Table.Column>
										<Table.Column className="text-right">Min</Table.Column>
										<Table.Column className="text-right">Typ</Table.Column>
										<Table.Column className="text-right">Max</Table.Column>
										<Table.Column>Unit</Table.Column>
										<Table.Column>
											<span className="sr-only">Range</span>
										</Table.Column>
									</Table.Header>
									<Table.Body>
										{section.rows.map((row, index) => {
											const value = row.values[variant] ?? row.values[0];
											return (
												<Table.Row key={index} id={index}>
													<Table.Cell className="font-medium">{row.parameter}</Table.Cell>
													<Table.Cell className="min-w-40 text-sm text-muted">
														{row.conditions ?? ""}
													</Table.Cell>
													<Table.Cell className="text-right font-mono text-sm tabular-nums">
														{format(value.min)}
													</Table.Cell>
													<Table.Cell className="text-right font-mono text-sm tabular-nums">
														{value.typ !== null ? (
															format(value.typ)
														) : value.note ? (
															// Text values such as formulas wrap instead of spilling into Min.
															<span className="inline-block max-w-40 text-left font-sans whitespace-normal">
																{value.note}
															</span>
														) : null}
													</Table.Cell>
													<Table.Cell className="text-right font-mono text-sm tabular-nums">
														{format(value.max)}
													</Table.Cell>
													<Table.Cell className="text-sm text-muted">{row.unit ?? ""}</Table.Cell>
													<Table.Cell>
														<RangeBar values={row.values} selected={variant} />
													</Table.Cell>
												</Table.Row>
											);
										})}
									</Table.Body>
								</Table.Content>
							</Table.ScrollContainer>
						</Table>
					</div>
				))}
			</div>
		</BlockSection>
	);
}

SpecTable.template = "spec-table" as const;
SpecTable.info =
	"Specification table grouped by section with min, typical, and max values per part variant and a range bar for each row. Pick it for datasheets and technical specifications.";
SpecTable.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
