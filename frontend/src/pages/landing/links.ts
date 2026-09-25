/** Landing page sections, shared by the navbar menus and the footer. */
export type LandingLink = { label: string; description: string; section: string };

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
			{ label: "Developer templates", description: "Code diff, review, commit, and CI blocks", section: "review" },
			{ label: "GitHub Action", description: "An artefact for every pull request", section: "integrate" },
			{ label: "Slack and Jira", description: "Previews where your team works", section: "integrate" },
		],
	},
	{
		label: "Enterprise",
		links: [
			{ label: "Access control", description: "Artefacts stay private by default", section: "share" },
			{ label: "Team integrations", description: "Install once for your workspace", section: "integrate" },
		],
	},
];

export const pricingSection = "pricing";
