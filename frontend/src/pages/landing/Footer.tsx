import { Link, Paragraph, Separator } from "@heroui/react";
import { useSession } from "../../lib/auth-client";
import { navMenus, pricingSection } from "./links";

export function Footer() {
	const { data: session } = useSession();
	const columns = [
		...navMenus.slice(0, 2).map((menu) => ({
			label: menu.label,
			links: menu.links.map((link) => ({
				label: link.label,
				to: `/welcome#${link.section}`,
			})),
		})),
		{
			label: "Account",
			links: session?.user
				? [
						{ label: "Dashboard", to: "/" },
						{ label: "Integrations", to: "/integrations" },
					]
				: [
						{ label: "Sign in", to: "/login" },
						{ label: "Get started", to: "/register" },
					],
		},
		{
			label: "Pricing",
			links: [{ label: "Pricing", to: `/welcome#${pricingSection}` }],
		},
	];

	return (
		<footer>
			<div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
				<div className="flex h-full flex-col">
					<div className="flex items-center gap-2">
						<img src="/kleelogo.svg" alt="" className="size-10" />
						<img
							src="/klee.svg"
							alt="Klee"
							className="h-6 w-auto"
						/>
					</div>
					<div className="mt-auto pt-6">
						<Paragraph size="sm" color="muted" className="max-w-xs">
							"One eye sees, the other feels.”
						</Paragraph>
						<Paragraph size="sm" color="muted" className="mt-2 max-w-xs">
							- Paul Klee
						</Paragraph>
					</div>
				</div>
				{columns.map((column) => (
					<div key={column.label}>
						<Paragraph size="sm" weight="medium">
							{column.label}
						</Paragraph>
						<ul className="mt-3 space-y-2">
							{column.links.map((link) => (
								<li key={link.label}>
									<Link
										href={link.to}
										className="text-sm font-normal text-muted"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<Separator />
			<Paragraph
				size="xs"
				color="muted"
				className="mx-auto max-w-6xl px-6 py-6"
			>
				© 2026 Klee. All rights reserved.
			</Paragraph>
		</footer>
	);
}
