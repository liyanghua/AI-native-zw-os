import type { PilotRawState } from "../pilotSources";
import { createSourceRef } from "./shared";

export function mapExecutionEventSourceRefs(rawState: PilotRawState, projectKey: string) {
  return rawState.actions
    .filter((action) => action.projectKey === projectKey)
    .map((action) =>
      createSourceRef({
        sourceSystem: "approval_center",
        sourceObjectType: "action",
        sourceObjectId: action.actionKey,
        externalKey: projectKey,
      }),
    );
}
