import type { PilotRawState } from "../pilotSources";
import { createSourceRef } from "./shared";

export function mapProductDefinitionSourceRefs(rawState: PilotRawState, projectKey: string) {
  const definition = rawState.definitions.find((item) => item.projectKey === projectKey);
  if (!definition) {
    return [];
  }

  return [
    createSourceRef({
      sourceSystem: "definition_center",
      sourceObjectType: "definition",
      sourceObjectId: projectKey.toLowerCase(),
      externalKey: projectKey,
    }),
  ];
}
