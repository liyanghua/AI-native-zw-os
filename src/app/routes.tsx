import { Navigate, createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { BossDashboard } from "./components/dashboards/BossDashboard";
import { ProductDirectorDashboard } from "./components/dashboards/ProductDirectorDashboard";
import { OperationsDirectorDashboard } from "./components/dashboards/OperationsDirectorDashboard";
import { VisualDirectorDashboard } from "./components/dashboards/VisualDirectorDashboard";
import { LifecycleOverview } from "./components/lifecycle/LifecycleOverview";
import { ProjectDetail } from "./components/projects/ProjectDetail";
import { OpportunityPool } from "./components/lifecycle/OpportunityPool";
import { NewProductIncubation } from "./components/lifecycle/NewProductIncubation";
import { LaunchVerification } from "./components/lifecycle/LaunchVerification";
import { GrowthOptimization } from "./components/lifecycle/GrowthOptimization";
import { ProductUpgrade } from "./components/lifecycle/ProductUpgrade";
import { ActionCenter } from "./components/actions/ActionCenter";
import { RiskAndApproval } from "./components/risk/RiskAndApproval";
import { ReviewAndAssets } from "./components/review/ReviewAndAssets";
import { AssetLibrary } from "./components/assets/AssetLibrary";
import { NotFound } from "./components/NotFound";

function LegacyProductDirectorRedirect() {
  return <Navigate to="/product-rnd-director" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: BossDashboard },
      { path: "boss", Component: BossDashboard },
      { path: "product-rnd-director", Component: ProductDirectorDashboard },
      { path: "product-director", Component: LegacyProductDirectorRedirect },
      { path: "operations-director", Component: OperationsDirectorDashboard },
      { path: "visual-director", Component: VisualDirectorDashboard },
      { path: "lifecycle", Component: LifecycleOverview },
      { path: "project/:id", Component: ProjectDetail },
      { path: "opportunity-pool", Component: OpportunityPool },
      { path: "new-product-incubation", Component: NewProductIncubation },
      { path: "launch-verification", Component: LaunchVerification },
      { path: "growth-optimization", Component: GrowthOptimization },
      { path: "product-upgrade", Component: ProductUpgrade },
      { path: "action-center", Component: ActionCenter },
      { path: "risk-approval", Component: RiskAndApproval },
      { path: "review-assets", Component: ReviewAndAssets },
      { path: "asset-library", Component: AssetLibrary },
      { path: "*", Component: NotFound },
    ],
  },
]);
