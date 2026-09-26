/** Pages linked from the navbar menus and the footer. */
export type LandingLink = { label: string; description: string; to: string };

export const navMenus: { label: string; links: LandingLink[] }[] = [
	{
		label: "Product",
		links: [
			{ label: "Create", description: "How a prompt becomes an artefact", to: "/create" },
			{ label: "Review", description: "Pages for pull requests", to: "/review" },
			{ label: "Share", description: "Invites, organisations, and links", to: "/share" },
		],
	},
	{
		label: "Developers",
		links: [
			{ label: "For developers", description: "Blocks for engineering work", to: "/developers" },
			{ label: "Templates", description: "Example artefacts", to: "/developer-templates" },
			{ label: "Integrations", description: "GitHub, Slack, and Jira", to: "/developer-integrations" },
		],
	},
	{
		label: "Teams",
		links: [
			{ label: "For teams", description: "Status, releases, and decisions", to: "/business" },
			{ label: "Access control", description: "Who can view, comment, and edit", to: "/access-control" },
			{ label: "Team setup", description: "Organisations and shared apps", to: "/team-integrations" },
		],
	},
];

export const pricingPath = "/pricing";
export const docsLink: LandingLink = { label: "Docs", description: "Setup guides and reference", to: "/docs" };

export const repositoryUrl = "https://github.com/saasathon-2/app";
