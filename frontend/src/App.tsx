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
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { FormsExample } from "./pages/FormsExample";
import { SocialExample } from "./pages/SocialExample";
import { SettingsExample } from "./pages/SettingsExample";
import { Artefacts } from "./pages/Artefacts";
import { useSession } from "./lib/auth-client";

function RequireUser() {
	const { data: session, isPending } = useSession();
	if (isPending) return null;
	return session?.user ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
	const { data: session, isPending } = useSession();
	if (isPending) return null;
	return session?.user ? <Navigate to="/" replace /> : <Outlet />;
}

function Home() {
	const { data: session, isPending } = useSession();
	if (isPending) return null;
	return session?.user ? <Artefacts /> : <Landing />;
}

function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: session } = useSession();
	const isWorkspace = location.pathname.startsWith("/artefacts") || (["/", "/profile", "/integrations"].includes(location.pathname) && Boolean(session?.user));

	return (
		// Lets HeroUI links and menu items navigate with react-router.
		<RouterProvider navigate={navigate} useHref={useHref}>
			<div className="min-h-screen">
				{!isWorkspace && <Navbar />}
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/welcome" element={<Landing />} />
					<Route element={<GuestOnly />}>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
					</Route>
					<Route element={<RequireUser />}>
						<Route path="/profile" element={<Artefacts />} />
						<Route path="/integrations" element={<Artefacts />} />
					</Route>
					<Route path="/artefacts" element={<Navigate to="/" replace />} />
					<Route path="/artefacts/:id" element={<Navigate to="/" replace />} />
					<Route path="/artefacts/shared/:shareId" element={<Artefacts />} />
					<Route path="/artefacts/shared/:shareId/full" element={<Artefacts />} />
					<Route path="/examples/forms" element={<FormsExample />} />
					<Route path="/examples/social" element={<SocialExample />} />
					<Route path="/examples/settings" element={<SettingsExample />} />
				</Routes>
			</div>
		</RouterProvider>
	);
}

export default App;
