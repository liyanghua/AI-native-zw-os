export type QueryIssueCode =
  | "connector_error"
  | "stale_kpi"
  | "missing_evidence"
  | "writeback_failure"
  | "low_confidence_suggestion"
  | "identity_conflict"
  | "partial_data";

export type QueryIssueSeverity = "info" | "warning" | "error";

export interface QueryIssue {
  code: QueryIssueCode;
  severity: QueryIssueSeverity;
  message: string;
  relatedProjectId?: string;
  relatedEntityId?: string;
}

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  stale: boolean;
  partial: boolean;
  lastUpdatedAt: string;
  issues: QueryIssue[];
}

export interface MutationResult<T> {
  data: T;
  ok: boolean;
  error: string | null;
  lastUpdatedAt: string;
}
