import type { PilotRawState } from "../pilotSources";
import { createSourceRef } from "./shared";

export function mapKpiSnapshotSourceRefs(rawState: PilotRawState, projectKey: string) {
  const performance = rawState.performance.find((item) => item.projectKey === projectKey);
  if (!performance) {
    return [];
  }

  return [
    createSourceRef({
      sourceSystem:
        performance.kpis.some((metric) => metric.key === "roi")
          ? "growth_console"
          : "launch_dashboard",
      sourceObjectType: "performance_snapshot",
      sourceObjectId: `${projectKey.toLowerCase()}-kpi`,
      externalKey: projectKey,
    }),
  ];
}
