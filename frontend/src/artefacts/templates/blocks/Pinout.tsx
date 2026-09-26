import { Table, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useState } from "react";
import type { Pin, PinPackage } from "../../model";
import { sidePins, type Side } from "./pinout";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const pitch = 28;
const stub = 14;
const labelRoom = 112;
const clip = (name: string) => (name.length > 14 ? `${name.slice(0, 13)}…` : name);

function PackageDrawing({
	pack,
	selected,
	onSelect,
}: {
	pack: PinPackage;
	selected: number | undefined;
	onSelect: (pin: number) => void;
}) {
	const sides = {
		left: sidePins(pack.pins, "left"),
		right: sidePins(pack.pins, "right"),
		top: sidePins(pack.pins, "top"),
		bottom: sidePins(pack.pins, "bottom"),
	};
	const quad = sides.top.length > 0 || sides.bottom.length > 0;
	const across = Math.max(sides.top.length, sides.bottom.length, quad ? 3 : 0);
	const down = Math.max(sides.left.length, sides.right.length, 2);
	const bodyWidth = quad ? across * pitch + pitch : 120;
	const bodyHeight = down * pitch + pitch * (quad ? 1 : 0.5);
	const margin = labelRoom + stub;
	const topRoom = quad ? margin : 16;
	const width = bodyWidth + margin * 2;
	const height = bodyHeight + topRoom * 2;
	const x0 = margin;
	const y0 = topRoom;

	const placed: { pin: Pin; x: number; y: number; side: Side }[] = [
		...sides.left.map((pin, index) => ({ pin, side: "left" as const, x: x0, y: y0 + pitch * (index + (quad ? 1 : 0.75)) })),
		...sides.right.map((pin, index) => ({ pin, side: "right" as const, x: x0 + bodyWidth, y: y0 + pitch * (index + (quad ? 1 : 0.75)) })),
		...sides.top.map((pin, index) => ({ pin, side: "top" as const, x: x0 + pitch * (index + 1), y: y0 })),
		...sides.bottom.map((pin, index) => ({ pin, side: "bottom" as const, x: x0 + pitch * (index + 1), y: y0 + bodyHeight })),
	];

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			className="mx-auto block w-full max-w-lg"
			role="group"
			aria-label={`${pack.name} pinout`}
		>
			<rect
				x={x0}
				y={y0}
				width={bodyWidth}
				height={bodyHeight}
				rx={4}
				className="fill-surface-secondary stroke-border"
				strokeWidth={1.5}
			/>
			{quad ? (
				<circle cx={x0 + 12} cy={y0 + 12} r={4} className="fill-muted" />
			) : (
				<path
					d={`M ${x0 + bodyWidth / 2 - 10} ${y0} a 10 10 0 0 0 20 0`}
					className="fill-background stroke-border"
					strokeWidth={1.5}
				/>
			)}
			<text
				x={x0 + bodyWidth / 2}
				y={y0 + bodyHeight / 2}
				textAnchor="middle"
				dominantBaseline="middle"
				className="fill-muted text-xs font-medium"
			>
				{pack.name}
			</text>
			{placed.map(({ pin, x, y, side }) => {
				const active = pin.number === selected;
				const horizontal = side === "left" || side === "right";
				const out = side === "left" || side === "top" ? -1 : 1;
				const stubRect = horizontal
					? { x: side === "left" ? x - stub : x, y: y - 4, width: stub, height: 8 }
					: { x: x - 4, y: side === "top" ? y - stub : y, width: 8, height: stub };
				const labelX = horizontal ? x + out * (stub + 6) : x;
				const labelY = horizontal ? y : y + out * (stub + 6);
				const numberX = horizontal ? x - out * 12 : x;
				const numberY = horizontal ? y : y - out * 12;
				return (
					<g
						key={pin.number}
						role="button"
						tabIndex={0}
						aria-pressed={active}
						aria-label={`Pin ${pin.number}, ${pin.name}`}
						className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-focus"
						onClick={() => onSelect(pin.number)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onSelect(pin.number);
							}
						}}
					>
						<rect
							{...stubRect}
							rx={1.5}
							strokeWidth={2}
							className={active ? "fill-chart-1 stroke-transparent" : "fill-muted/50 stroke-transparent"}
						/>
						<text
							x={numberX}
							y={numberY}
							textAnchor="middle"
							dominantBaseline="middle"
							className="fill-muted text-[10px] tabular-nums"
						>
							{pin.number}
						</text>
						<text
							x={labelX}
							y={labelY}
							textAnchor={side === "left" || side === "bottom" ? "end" : "start"}
							dominantBaseline="middle"
							transform={horizontal ? undefined : `rotate(-90 ${labelX} ${labelY})`}
							className={`text-xs ${active ? "fill-foreground font-semibold" : "fill-foreground"}`}
						>
							{clip(pin.name)}
						</text>
					</g>
				);
			})}
		</svg>
	);
}

export function Pinout({ node, context }: TemplateProps) {
	const data = node.data as { title: string; description: string; packages: PinPackage[] };
	const [packageIndex, setPackageIndex] = useState(0);
	const [selected, setSelected] = useState<number>();
	const pack = data.packages[packageIndex] ?? data.packages[0];
	return (
		<BlockSection
			title={data.title}
			description={data.description}
			edit={{ node, context }}
			action={
				data.packages.length > 1 && (
					<ToggleButtonGroup
						aria-label="Package"
						size="sm"
						selectionMode="single"
						disallowEmptySelection
						selectedKeys={[String(packageIndex)]}
						onSelectionChange={(keys) => {
							setPackageIndex(Number([...keys][0]));
							setSelected(undefined);
						}}
						className="shrink-0"
					>
						{data.packages.map((item, index) => (
							<ToggleButton key={index} id={String(index)}>
								{item.name}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				)
			}
		>
			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<PackageDrawing pack={pack} selected={selected} onSelect={setSelected} />
				<Table>
					<Table.ScrollContainer>
						<Table.Content
							aria-label={`${pack.name} pins`}
							selectionMode="single"
							selectedKeys={selected === undefined ? [] : [selected]}
							onSelectionChange={(keys) => {
								const [key] = [...(keys === "all" ? [] : keys)];
								setSelected(key === undefined ? undefined : Number(key));
							}}
						>
							<Table.Header>
								<Table.Column className="w-12">Pin</Table.Column>
								<Table.Column isRowHeader>Name</Table.Column>
								<Table.Column>Function</Table.Column>
							</Table.Header>
							<Table.Body>
								{pack.pins.map((pin) => (
									<Table.Row key={pin.number} id={pin.number}>
										<Table.Cell className="tabular-nums">{pin.number}</Table.Cell>
										<Table.Cell className="font-mono text-sm font-medium">{pin.name}</Table.Cell>
										<Table.Cell className="text-sm text-muted">{pin.description}</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</div>
		</BlockSection>
	);
}

Pinout.template = "pinout" as const;
Pinout.info =
	"Interactive IC package drawing with numbered pins and a pin function table, switchable between packages. Pick it for datasheets that list pin assignments.";
Pinout.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
