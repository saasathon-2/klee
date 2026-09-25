import { Button, Description, Dropdown, Label, Link } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { navMenus, pricingSection } from "../pages/landing/links";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const goToSection = (section: string) => navigate(`/welcome#${section}`);

	return (
		<header className="sticky top-0 z-40 border-b-2 border-divider bg-background">
			<nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
				<Link
					href="/welcome"
					aria-label="Klee home"
					className="justify-self-start"
				>
					<img src="/kleelogo.svg" alt="Klee" className="size-10" />
				</Link>

				<div className="hidden items-center gap-2 md:flex">
					{navMenus.map((menu) => (
						<Dropdown key={menu.label}>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 px-3 py-1.5"
							>
								{menu.label}
								<ChevronDown size={14} className="text-muted" />
							</Button>
							<Dropdown.Popover
								placement="bottom start"
								className="min-w-72"
							>
								<Dropdown.Menu
									aria-label={menu.label}
									onAction={(key) =>
										goToSection(String(key).split(":")[1])
									}
								>
									{menu.links.map((link) => (
										<Dropdown.Item
											key={link.label}
											id={`${link.label}:${link.section}`}
											textValue={link.label}
										>
											<div className="flex flex-col">
												<Label>{link.label}</Label>
												<Description>
													{link.description}
												</Description>
											</div>
										</Dropdown.Item>
									))}
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					))}
					<Button
						variant="ghost"
						size="sm"
						className="px-3 py-1.5"
						onPress={() => goToSection(pricingSection)}
					>
						Pricing
					</Button>
				</div>

				<div className="col-start-3 flex items-center justify-self-end gap-3">
					<Button
						variant="ghost"
						size="sm"
						onPress={() => navigate("/docs")}
					>
						Docs
					</Button>
					{isPending ? null : session?.user ? (
						<Button size="sm" onPress={() => navigate("/")}>
							Dashboard
						</Button>
					) : (
						<Button size="sm" onPress={() => navigate("/login")}>
							Sign in
						</Button>
					)}
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
