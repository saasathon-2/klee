import { Link, Paragraph, Separator } from "@heroui/react";
import { useSession } from "../../lib/auth-client";
import { useTheme } from "../../lib/use-theme";
import { Scallop } from "../../artefacts/templates/page/Scallop";
import { navMenus, pricingPath } from "./links";
import { KleeLogo } from "../../components/KleeLogo";

export function Footer() {
	const { data: session } = useSession();
	const { theme } = useTheme();
	const columns = [
		...navMenus.map((menu) => ({
			label: menu.label,
			links: menu.links.map((link) => ({
				label: link.label,
				to: link.to ?? `/welcome#${link.section}`,
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
						{ label: "Sign in", to: "/?auth=signin" },
						{ label: "Get started", to: "/?auth=signup" },
					],
		},
		{
			label: "Pricing",
			links: [{ label: "Pricing", to: pricingPath }],
		},
	];

	return (
		<>
			<div aria-hidden className="relative z-10">
				<Scallop edge="top" />
				<div className="h-16 bg-brand" />
			</div>
		<footer>
			<div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
				<div className="flex h-full flex-col">
					<div className="flex items-center gap-2">
						<KleeLogo alt="" className="size-10" />
						<img
							src={theme === "dark" ? "/kleelight.svg" : "/klee.svg"}
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
		</>
	);
}
