import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppShell, PhoneFrame } from "./design-system/AppShell";
import SplashPage from "./pages/SplashPage";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CareerScanPage from "./pages/CareerScanPage";
import ScanLoadingPage from "./pages/ScanLoadingPage";
import ScanResultsPage from "./pages/ScanResultsPage";
import CareerXRayPage from "./pages/CareerXRayPage";
import CareerXRayOpportunitiesPage from "./pages/CareerXRayOpportunitiesPage";
import CareerXRayOfferPage from "./pages/CareerXRayOfferPage";
import RoleIntelligencePage from "./pages/RoleIntelligencePage";
import UpgradePage from "./pages/UpgradePage";
import RadarPage from "./pages/RadarPage";
import ProfilePage from "./pages/ProfilePage";

/** Bottom nav visible on these routes only */
const withNav = { showNav: true as const };

export const router = createBrowserRouter([
  {
    element: (
      <PhoneFrame>
        <Outlet />
      </PhoneFrame>
    ),
    children: [
      {
        element: <AppShell />,
        children: [
          // Auth flow — no bottom nav
          { index: true, element: <SplashPage />, handle: { centered: true } },
          { path: "onboarding", element: <OnboardingPage /> },
          { path: "login", element: <LoginPage /> },
          { path: "scan-loading", element: <ScanLoadingPage />, handle: { centered: true } },
          {
            path: "canvas",
            element: <ScanResultsPage />,
            handle: withNav,
          },
          { path: "upgrade", element: <UpgradePage /> },
          { path: "career-xray", element: <CareerXRayOfferPage /> },

          // Main app — bottom nav
          { path: "home", element: <HomePage />, handle: withNav },
          { path: "scan", element: <CareerScanPage />, handle: withNav },
          {
            path: "results",
            element: <ScanResultsPage />,
            handle: withNav,
          },
          { path: "xray", element: <CareerXRayPage />, handle: withNav },
          { path: "xray/opportunities", element: <CareerXRayOpportunitiesPage />, handle: withNav },
          { path: "xray/role/:roleSlug", element: <RoleIntelligencePage /> },
          { path: "radar", element: <RadarPage />, handle: withNav },
          { path: "profile", element: <ProfilePage />, handle: withNav },

          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
