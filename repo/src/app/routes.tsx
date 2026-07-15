import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { UserSetup } from "./pages/UserSetup";
import { DeviceStatus } from "./pages/DeviceStatus";
import { Insights } from "./pages/Insights";
import { AdminSimulation } from "./pages/AdminSimulation";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/setup",
    Component: UserSetup,
  },
  {
    path: "/device",
    Component: DeviceStatus,
  },
  {
    path: "/insights",
    Component: Insights,
  },
  {
    path: "/admin/simulation",
    Component: AdminSimulation,
  },
]);
