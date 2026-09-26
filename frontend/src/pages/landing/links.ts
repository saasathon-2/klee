/** Landing page sections, shared by the navbar menus and the footer. */
export type LandingLink = { label: string; description: string; section?: string; to?: string };

export const navMenus: { label: string; links: LandingLink[] }[] = [
	{
		label: "Product",
		links: [
			{ label: "Create", description: "Turn any context into an artefact", section: "create" },
			{ label: "Review", description: "Diffs, feedback, commits, and checks", section: "review" },
			{ label: "Share", description: "Private until you share a link", section: "share" },
		],
	},
	{
		label: "Developers",
		links: [
			{ label: "For developers", description: "Bring context, code, and decisions together", to: "/developers" },
			{ label: "Developer templates", description: "Start with a purpose-built artefact", to: "/developer-templates" },
			{ label: "Integrations", description: "Connect Klee to the tools you already use", to: "/developer-integrations" },
		],
	},
	{
		label: "Enterprise",
		links: [
			{ label: "For business", description: "A shared view of the work that matters", to: "/business" },
			{ label: "Access control", description: "Keep every artefact in the right hands", to: "/access-control" },
			{ label: "Team integrations", description: "Bring the whole workspace into Klee", to: "/team-integrations" },
		],
	},
];

export const pricingPath = "/pricing";
