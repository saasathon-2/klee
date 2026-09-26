import { RouterProvider } from "@heroui/react";
import {
	Navigate,
	Outlet,
	Route,
	Routes,
	useHref,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { AuthModal } from "./components/AuthModal";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { FormsExample } from "./pages/FormsExample";
import { SocialExample } from "./pages/SocialExample";
import { SettingsExample } from "./pages/SettingsExample";
import { Artefacts } from "./pages/Artefacts";
import { Docs } from "./pages/Docs";
import { MarketingPage } from "./pages/MarketingPage";
import { useSession } from "./lib/auth-client";

function RequireUser() {
	const { data: session, isPending } = useSession();
	if (isPending) return null;
	return session?.user ? <Outlet /> : <Navigate to="/?auth=signin" replace />;
}

function Home() {
	const { data: session, isPending } = useSession();
	if (window.location.hostname === "docs.klee.work") return <Docs />;
	if (isPending) return null;
	return session?.user ? <Artefacts /> : <Landing />;
}

function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const isWorkspace = location.pathname.startsWith("/artefacts") || (["/", "/profile", "/integrations", "/organisations"].includes(location.pathname) && Boolean(session?.user));

	return (
		// Lets HeroUI links and menu items navigate with react-router.
		<RouterProvider navigate={navigate} useHref={useHref}>
			<div className="min-h-screen">
				{!isWorkspace && <Navbar />}
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/welcome" element={<Landing />} />
					<Route path="/docs" element={<Docs />} />
					<Route path="/developers" element={<MarketingPage page="developers" />} />
					<Route path="/developer-templates" element={<MarketingPage page="developer-templates" />} />
					<Route path="/developer-integrations" element={<MarketingPage page="developer-integrations" />} />
					<Route path="/business" element={<MarketingPage page="business" />} />
					<Route path="/access-control" element={<MarketingPage page="access-control" />} />
					<Route path="/team-integrations" element={<MarketingPage page="team-integrations" />} />
					<Route path="/pricing" element={<MarketingPage page="pricing" />} />
					{/* Sign-in lives in a modal now; keep the old links working. */}
					<Route path="/login" element={<Navigate to="/?auth=signin" replace />} />
					<Route path="/register" element={<Navigate to="/?auth=signup" replace />} />
					<Route element={<RequireUser />}>
						<Route path="/profile" element={<Artefacts />} />
						<Route path="/integrations" element={<Artefacts />} />
						<Route path="/organisations" element={<Artefacts />} />
					</Route>
					<Route path="/artefacts" element={<Navigate to="/" replace />} />
					<Route path="/artefacts/:id" element={<Navigate to="/" replace />} />
					<Route path="/artefacts/shared/:shareId" element={<Artefacts />} />
					<Route path="/artefacts/shared/:shareId/full" element={<Artefacts />} />
					<Route path="/examples/forms" element={<FormsExample />} />
					<Route path="/examples/social" element={<SocialExample />} />
					<Route path="/examples/settings" element={<SettingsExample />} />
				</Routes>
				{!isPending && !session?.user && <AuthModal />}
			</div>
		</RouterProvider>
	);
}

export default App;
