import {
	Button,
	Checkbox,
	Description,
	Input,
	Label,
	ListBox,
	Select,
	TextField,
} from "@heroui/react";
import { useDocumentTitle } from "../useDocumentTitle";

export function FormsExample() {
	useDocumentTitle("Account form - Klee");
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<h1 className="mt-2 text-4xl font-semibold">Account form</h1>

			<div className="mt-10 grid gap-8 lg:grid-cols-2">
				<form className="space-y-6 rounded-2xl p-8">
					<TextField name="email" type="email" isRequired>
						<Label>Your email</Label>
						<Input placeholder="john@email.com" />
						<Description>We won't share your email.</Description>
					</TextField>

					<Select placeholder="Select one" aria-label="State">
						<Label>State</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id="auckland">
									Auckland
								</ListBox.Item>
								<ListBox.Item id="wellington">
									Wellington
								</ListBox.Item>
								<ListBox.Item id="christchurch">
									Christchurch
								</ListBox.Item>
							</ListBox>
						</Select.Popover>
					</Select>

					<Checkbox defaultSelected>
						<Checkbox.Content>
							<Checkbox.Control>
								<Checkbox.Indicator />
							</Checkbox.Control>
							Send me product updates
						</Checkbox.Content>
					</Checkbox>

					<Button type="button" fullWidth>
						Continue
					</Button>
				</form>

				<div className="rounded-2xl bg-surface-secondary p-8">
					<p className="text-sm font-medium text-accent-text">
						Why this pattern works
					</p>
					<h2 className="mt-3 text-2xl font-semibold">
						Let the next step stay obvious.
					</h2>
					<p className="mt-4 text-muted">
						A compact form, useful helper text, and one clear
						primary action keep attention where it belongs.
					</p>
				</div>
			</div>
		</main>
	);
}
