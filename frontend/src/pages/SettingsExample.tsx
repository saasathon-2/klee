import { Alert, Button, InputOTP, Switch, Tabs } from "@heroui/react";

export function SettingsExample() {
	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="mt-2 text-4xl font-semibold">Settings</h1>

			<Alert className="mt-10" status="warning">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>You have 2 credits left</Alert.Title>
					<Alert.Description>
						Upgrade when you are ready for more.
					</Alert.Description>
				</Alert.Content>
				<Button size="sm" variant="ghost">
					Upgrade
				</Button>
			</Alert>

			<Tabs className="mt-10" defaultSelectedKey="notifications">
				<Tabs.ListContainer>
					<Tabs.List aria-label="Settings sections">
						<Tabs.Tab id="notifications">Notifications</Tabs.Tab>
						<Tabs.Tab id="security">Security</Tabs.Tab>
					</Tabs.List>
				</Tabs.ListContainer>

				<Tabs.Panel
					id="notifications"
					className="mt-6 rounded-2xl bg-surface p-6"
				>
					<div className="flex items-center justify-between gap-6">
						<div>
							<h2 className="font-semibold">
								Allow notifications
							</h2>
							<p className="mt-1 text-sm text-muted">
								Receive a note when something needs you.
							</p>
						</div>
						<Switch
							defaultSelected
							aria-label="Allow notifications"
						>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch>
					</div>
				</Tabs.Panel>

				<Tabs.Panel
					id="security"
					className="mt-6 rounded-2xl bg-surface p-6"
				>
					<h2 className="font-semibold">Verify account</h2>
					<p className="mt-1 text-sm text-muted">
						Enter the code sent to a****@gmail.com.
					</p>
					<InputOTP
						className="mt-5"
						maxLength={6}
						aria-label="Verification code"
					>
						<InputOTP.Group>
							{[0, 1, 2].map((index) => (
								<InputOTP.Slot key={index} index={index} />
							))}
						</InputOTP.Group>
						<InputOTP.Separator />
						<InputOTP.Group>
							{[3, 4, 5].map((index) => (
								<InputOTP.Slot key={index} index={index} />
							))}
						</InputOTP.Group>
					</InputOTP>
				</Tabs.Panel>
			</Tabs>
		</main>
	);
}
