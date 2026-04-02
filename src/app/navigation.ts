import {
  Activity,
  AlertTriangle,
  Database,
  FileText,
  LayoutDashboard,
  Package,
  RefreshCw,
  Rocket,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export const roles = [
  { id: "boss", name: "老板", path: "/boss" },
  { id: "product", name: "产品研发总监", path: "/product-director" },
  { id: "operations", name: "运营与营销总监", path: "/operations-director" },
  { id: "visual", name: "视觉总监", path: "/visual-director" },
] as const;

export const navigation = [
  { name: "经营指挥台", icon: LayoutDashboard, path: "/boss" },
  { name: "生命周期总览", icon: Activity, path: "/lifecycle" },
  { type: "separator" as const },
  { name: "商机池", icon: TrendingUp, path: "/opportunity-pool" },
  { name: "新品孵化", icon: Package, path: "/new-product-incubation" },
  { name: "首发验证", icon: Rocket, path: "/launch-verification" },
  { name: "增长优化", icon: Zap, path: "/growth-optimization" },
  { name: "老品升级", icon: RefreshCw, path: "/product-upgrade" },
  { type: "separator" as const },
  { name: "动作中心", icon: Target, path: "/action-center" },
  { name: "风险与审批", icon: AlertTriangle, path: "/risk-approval" },
  { name: "复盘沉淀", icon: FileText, path: "/review-assets" },
  { name: "经验资产库", icon: Database, path: "/asset-library" },
] as const;

export function getPageTitle(pathname: string) {
  if (pathname === "/" || pathname === "/boss") return "经营指挥台";
  if (pathname.startsWith("/project/")) return "商品项目详情";
  if (pathname === "/product-director") return "产品研发总监工作台";
  if (pathname === "/operations-director") return "运营与营销总监工作台";
  if (pathname === "/visual-director") return "视觉总监工作台";
  const item = navigation.find((entry) => "path" in entry && entry.path === pathname);
  return item?.name ?? "控制台";
}
