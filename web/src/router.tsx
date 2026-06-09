import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { GuestRoute } from "./auth/GuestRoute";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell, PhoneFrame } from "./design-system/AppShell";
import SplashPage from "./pages/SplashPage";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CareerScanPage from "./pages/CareerScanPage";
import ScanLoadingPage from "./pages/ScanLoadingPage";
import ScanResultsPage from "./pages/ScanResultsPage";
import XRayHistoryPage from "./pages/XRayHistoryPage";
import XRayDetailPage from "./pages/XRayDetailPage";
import TransitionPathsPage from "./pages/TransitionPathsPage";
import RoleIntelligencePage from "./pages/RoleIntelligencePage";
import UpgradePage from "./pages/UpgradePage";
import RadarPage from "./pages/RadarPage";
import ProfilePage from "./pages/ProfilePage";

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
          { index: true, element: <SplashPage />, handle: { centered: true } },
          { path: "onboarding", element: <OnboardingPage /> },
          {
            element: <GuestRoute />,
            children: [{ path: "login", element: <LoginPage /> }],
          },
          {
            element: <ProtectedRoute />,
            children: [
              { path: "scan-loading", element: <ScanLoadingPage />, handle: { centered: true } },
              { path: "scan", element: <CareerScanPage />, handle: withNav },
              { path: "results/:scanId", element: <ScanResultsPage />, handle: withNav },
              { path: "xray/:scanId", element: <XRayDetailPage />, handle: withNav },
              { path: "xray-history", element: <XRayHistoryPage />, handle: withNav },
              { path: "transition-paths/:scanId", element: <TransitionPathsPage />, handle: withNav },
              { path: "upgrade", element: <UpgradePage /> },
              { path: "radar", element: <RadarPage />, handle: withNav },
              { path: "profile", element: <ProfilePage />, handle: withNav },
              { path: "home", element: <HomePage />, handle: withNav },
              { path: "xray/role/:roleSlug", element: <RoleIntelligencePage /> },
              { path: "canvas", element: <Navigate to="/scan" replace /> },
              { path: "career-xray", element: <Navigate to="/xray-history" replace /> },
              { path: "xray", element: <Navigate to="/xray-history" replace /> },
              { path: "career-opportunities", element: <Navigate to="/xray-history" replace /> },
            ],
          },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
