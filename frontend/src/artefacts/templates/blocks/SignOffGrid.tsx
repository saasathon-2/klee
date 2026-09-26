import { Chip, Table } from "@heroui/react";
import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import type { SignOffResponse } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const responses = {
	yes: { color: "success", label: "Yes", icon: CircleCheck },
	no: { color: "danger", label: "No", icon: CircleX },
	pending: { color: "default", label: "Pending", icon: CircleDashed },
} as const;

export function SignOffGrid({ node, context }: TemplateProps) {
	const data = node.data as {
		title: string;
		description: string;
		people: string[];
		statements: { text: string; responses: SignOffResponse[] }[];
	};
	const answered = data.statements.flatMap((statement) => statement.responses);
	const complete = answered.filter((response) => response === "yes").length;
	return (
		<BlockSection title={data.title} description={data.description} edit={{ node, context }}>
			<p className="mb-3 text-sm text-muted">
				{complete} of {answered.length} confirmations given
			</p>
			<Table>
				<Table.ScrollContainer>
					<Table.Content aria-label={data.title}>
						<Table.Header>
							<Table.Column isRowHeader>Statement</Table.Column>
							{data.people.map((person, index) => (
								<Table.Column key={index}>{person}</Table.Column>
							))}
						</Table.Header>
						<Table.Body>
							{data.statements.map((statement, row) => (
								<Table.Row key={row} id={row}>
									<Table.Cell className="min-w-64">{statement.text}</Table.Cell>
									{data.people.map((_, column) => {
										const response = responses[statement.responses[column]] ?? responses.pending;
										const Icon = response.icon;
										return (
											<Table.Cell key={column}>
												<Chip size="sm" color={response.color}>
													<Icon size={12} />
													{response.label}
												</Chip>
											</Table.Cell>
										);
									})}
								</Table.Row>
							))}
						</Table.Body>
					</Table.Content>
				</Table.ScrollContainer>
			</Table>
		</BlockSection>
	);
}

SignOffGrid.template = "sign-off-grid" as const;
SignOffGrid.info =
	"Grid of declarations or approvals against the people who must confirm them, each marked yes, no, or pending.";
SignOffGrid.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
