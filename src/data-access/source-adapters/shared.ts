import type {
  SourceObjectRef,
  SourceObjectType,
  SourceSystem,
} from "../../domain/types/model";

const firstSeenAt = "2026-04-02T09:00:00+08:00";
const lastSeenAt = "2026-04-02T10:15:00+08:00";

export function createSourceRef(input: {
  sourceSystem: SourceSystem;
  sourceObjectType: SourceObjectType;
  sourceObjectId: string;
  externalKey?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
}): SourceObjectRef {
  return {
    sourceSystem: input.sourceSystem,
    sourceObjectType: input.sourceObjectType,
    sourceObjectId: input.sourceObjectId,
    externalKey: input.externalKey,
    firstSeenAt: input.firstSeenAt ?? firstSeenAt,
    lastSeenAt: input.lastSeenAt ?? lastSeenAt,
  };
}
