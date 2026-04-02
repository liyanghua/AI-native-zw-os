import type { MutationResult, QueryIssue, QueryResult } from "../domain/types/query";

function pickLatestTimestamp(values: Array<string | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? "2026-04-02T09:00:00+08:00";
}

export function latestTimestamp(...values: Array<string | undefined>) {
  return pickLatestTimestamp(values);
}

export function createQueryIssue(
  code: QueryIssue["code"],
  severity: QueryIssue["severity"],
  message: string,
  relatedProjectId?: string,
  relatedEntityId?: string,
): QueryIssue {
  return {
    code,
    severity,
    message,
    relatedProjectId,
    relatedEntityId,
  };
}

export function dedupeQueryIssues(issues: QueryIssue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}-${issue.relatedProjectId ?? ""}-${issue.relatedEntityId ?? ""}-${issue.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function createQueryResult<T>(input: {
  data: T;
  lastUpdatedAt: string;
  issues?: QueryIssue[];
  loading?: boolean;
}): QueryResult<T> {
  const issues = dedupeQueryIssues(input.issues ?? []);
  const errorIssue = issues.find((issue) => issue.severity === "error");
  return {
    data: input.data,
    loading: input.loading ?? false,
    error: errorIssue?.message ?? null,
    stale: issues.some((issue) => issue.code === "stale_kpi"),
    partial: issues.some((issue) =>
      issue.code === "identity_conflict" ||
      issue.code === "missing_evidence" ||
      issue.code === "partial_data",
    ),
    lastUpdatedAt: input.lastUpdatedAt,
    issues,
  };
}

export function createMutationResult<T>(input: {
  data: T;
  lastUpdatedAt: string;
  error?: string | null;
}): MutationResult<T> {
  return {
    data: input.data,
    ok: !input.error,
    error: input.error ?? null,
    lastUpdatedAt: input.lastUpdatedAt,
  };
}
