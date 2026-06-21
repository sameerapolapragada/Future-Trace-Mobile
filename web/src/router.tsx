import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import type { ComponentType } from "react";
import { GuestRoute } from "./auth/GuestRoute";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell, PhoneFrame } from "./design-system/AppShell";
import { RequireTransitionSubscriber } from "./lib/RequireTransitionSubscriber";

const withNav = { showNav: true as const };

function lazyPage(importFn: () => Promise<{ default: ComponentType }>) {
  return async () => {
    const { default: Component } = await importFn();
    return { Component };
  };
}

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
          { index: true, lazy: lazyPage(() => import("./pages/SplashPage")), handle: { centered: true } },
          { path: "onboarding", lazy: lazyPage(() => import("./pages/OnboardingPage")) },
          {
            element: <GuestRoute />,
            children: [{ path: "login", lazy: lazyPage(() => import("./pages/LoginPage")) }],
          },
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: "scan-loading",
                lazy: lazyPage(() => import("./pages/ScanLoadingPage")),
                handle: { centered: true },
              },
              { path: "scan", lazy: lazyPage(() => import("./pages/CareerScanPage")), handle: withNav },
              { path: "results/:scanId", lazy: lazyPage(() => import("./pages/ScanResultsPage")), handle: withNav },
              { path: "xray/:scanId", lazy: lazyPage(() => import("./pages/XRayDetailPage")), handle: withNav },
              { path: "xray-history", lazy: lazyPage(() => import("./pages/XRayHistoryPage")), handle: withNav },
              {
                path: "xray-complete/:xrayId",
                lazy: lazyPage(() => import("./pages/PostXrayPromptPage")),
                handle: withNav,
              },
              {
                path: "compare-goals/:newXrayId",
                lazy: lazyPage(() => import("./pages/CompareGoalsPage")),
                handle: withNav,
              },
              {
                path: "transition-paths/:scanId",
                lazy: lazyPage(() => import("./pages/TransitionPathsPage")),
                handle: withNav,
              },
              { path: "upgrade", lazy: lazyPage(() => import("./pages/UpgradePage")) },
              {
                path: "checkout/success",
                lazy: lazyPage(() => import("./pages/CheckoutSuccessPage")),
                handle: { centered: true },
              },
              {
                element: <RequireTransitionSubscriber />,
                children: [
                  {
                    path: "transition",
                    lazy: lazyPage(() => import("./pages/TransitionDashboardPage")),
                    handle: withNav,
                  },
                  {
                    path: "transition/week/:milestoneId",
                    lazy: lazyPage(() => import("./pages/WeeklyMilestonePage")),
                    handle: withNav,
                  },
                  {
                    path: "transition/plan/:goalId",
                    lazy: lazyPage(() => import("./pages/TransitionPlanPage")),
                    handle: withNav,
                  },
                  {
                    path: "transition/plan-updates/:recommendationId",
                    lazy: lazyPage(() => import("./pages/PlanUpdateDetailPage")),
                    handle: withNav,
                  },
                  {
                    path: "notifications",
                    lazy: lazyPage(() => import("./pages/NotificationsPage")),
                    handle: withNav,
                  },
                ],
              },
              { path: "radar", element: <Navigate to="/transition" replace /> },
              { path: "radar-legacy", lazy: lazyPage(() => import("./pages/RadarPage")), handle: withNav },
              { path: "profile", lazy: lazyPage(() => import("./pages/ProfilePage")), handle: withNav },
              { path: "privacy", lazy: lazyPage(() => import("./pages/PrivacyPolicyPage")), handle: withNav },
              { path: "terms", lazy: lazyPage(() => import("./pages/TermsPage")), handle: withNav },
              { path: "home", lazy: lazyPage(() => import("./pages/HomePage")), handle: withNav },
              { path: "xray/role/:roleSlug", lazy: lazyPage(() => import("./pages/RoleIntelligencePage")) },
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
