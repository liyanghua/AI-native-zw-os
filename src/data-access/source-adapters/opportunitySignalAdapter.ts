import type { PilotRawState } from "../pilotSources";
import { createSourceRef } from "./shared";

export function mapOpportunitySignalSourceRefs(rawState: PilotRawState, projectKey: string) {
  return rawState.opportunitySignals
    .filter((signal) => signal.projectKey === projectKey)
    .map((signal) =>
      createSourceRef({
        sourceSystem: "opportunity_signal_hub",
        sourceObjectType: "signal",
        sourceObjectId: signal.signalKey,
        externalKey: signal.projectKey,
      }),
    );
}
