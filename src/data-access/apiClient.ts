import type {
  ApiActionCenterResponseDto,
  ApiAgentTriggerRequestDto,
  ApiAgentTriggerResponseDto,
  ApiAssetLibraryResponseDto,
  ApiBridgeAdaptersResponseDto,
  ApiBridgeSyncRecordsResponseDto,
  ApiBridgeSyncRequestDto,
  ApiBridgeSyncResponseDto,
  ApiApproveActionRequestDto,
  ApiApproveActionResponseDto,
  ApiCompileContextRequestDto,
  ApiCompileContextResponseDto,
  ApiCompileDecisionRequestDto,
  ApiCompileDecisionResponseDto,
  ApiCompileRoleStoryRequestDto,
  ApiCompileRoleStoryResponseDto,
  ApiEvalCasesResponseDto,
  ApiEvalRunResponseDto,
  ApiEvalRunsResponseDto,
  ApiEvalSuitesResponseDto,
  ApiEvaluationsResponseDto,
  ApiErrorPayload,
  ApiFeedbackToKnowledgeRequestDto,
  ApiFeedbackToKnowledgeResponseDto,
  ApiGenerateReviewRequestDto,
  ApiGenerateReviewResponseDto,
  ApiKnowledgeSearchRequestDto,
  ApiKnowledgeSearchResultDto,
  ApiMockRunRequestDto,
  ApiMockRunResponseDto,
  ApiOntologyRegistryDetailResponseDto,
  ApiOntologyRegistryResponseDto,
  ApiOntologyStatusMutationRequestDto,
  ApiOntologyStatusMutationResponseDto,
  ApiProjectGovernanceResponseDto,
  ApiProjectLineageResponseDto,
  ApiProjectKnowledgeResponseDto,
  ApiProjectBridgeSummaryDto,
  ApiProjectDetailDto,
  ApiProjectEvalSummaryDto,
  ApiProjectListResponseDto,
  ApiProjectOntologyReferencesDto,
  ApiProjectRuntimeSummaryDto,
  ApiPromoteReviewToAssetRequestDto,
  ApiPromoteReviewToAssetResponseDto,
  ApiPublishAssetRequestDto,
  ApiPublishAssetResponseDto,
  ApiPublishAssetCandidateRequestDto,
  ApiPublishAssetCandidateResponseDto,
  ApiRejectActionRequestDto,
  ApiRejectActionResponseDto,
  ApiReviewCenterResponseDto,
  ApiRoleDashboardResponseDto,
  ApiRunEvalRequestDto,
  ApiRuntimeCancelTaskResponseDto,
  ApiRuntimeRetryTaskResponseDto,
  ApiRuntimeTaskOperatorRequestDto,
  ApiRuntimeWorkflowDetailResponseDto,
  ApiRuntimeWorkflowsResponseDto,
  ApiRunEvaluationsRequestDto,
  ApiWritebackResponseDto,
} from "../domain/types/api";
import type { LifecycleStage } from "../domain/types/model";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      "error" in value &&
      value.error &&
      typeof value.error === "object" &&
      "code" in value.error &&
      "message" in value.error,
  );
}

function ensureResponseKeys(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") {
    throw new ApiClientError({
      status: 500,
      code: "invalid_api_payload",
      message: "API 返回了无效对象。",
      details: value,
    });
  }

  const missingKey = keys.find((key) => !(key in value));
  if (missingKey) {
    throw new ApiClientError({
      status: 500,
      code: "invalid_api_payload",
      message: `API payload missing key: ${missingKey}`,
      details: value,
    });
  }
}

export function createApiClient({ baseUrl = "/api" }: { baseUrl?: string } = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${normalizedBaseUrl}${path}`, init);
    const payload = await readJson(response);

    if (!response.ok) {
      if (isApiErrorPayload(payload)) {
        throw new ApiClientError({
          status: response.status,
          code: payload.error.code,
          message: payload.error.message,
          details: payload.error.details,
        });
      }

      throw new ApiClientError({
        status: response.status,
        code: "unknown_api_error",
        message: `Request failed: ${response.status}`,
        details: payload,
      });
    }

    return payload as T;
  }

  return {
    async getProjects(input: { stage?: LifecycleStage } = {}) {
      const searchParams = new URLSearchParams();
      if (input.stage) {
        searchParams.set("stage", input.stage);
      }
      const query = searchParams.toString();
      return request<ApiProjectListResponseDto>(`/projects${query ? `?${query}` : ""}`);
    },
    async getProjectDetail(projectId: string) {
      return request<ApiProjectDetailDto>(`/projects/${encodeURIComponent(projectId)}`);
    },
    async getProjectLineage(projectId: string) {
      const payload = await request<ApiProjectLineageResponseDto>(
        `/projects/${encodeURIComponent(projectId)}/lineage`,
      );
      ensureResponseKeys(payload, ["projectId", "actions"]);
      return payload;
    },
    async getProjectGovernance(projectId: string) {
      const payload = await request<ApiProjectGovernanceResponseDto>(
        `/projects/${encodeURIComponent(projectId)}/governance`,
      );
      ensureResponseKeys(payload, ["projectId", "actionsSummary", "reviewSummary", "assetSummary"]);
      return payload;
    },
    async getProjectRuntimeSummary(projectId: string) {
      const payload = await request<ApiProjectRuntimeSummaryDto>(
        `/projects/${encodeURIComponent(projectId)}/runtime`,
      );
      ensureResponseKeys(payload, ["projectId", "counts", "latestWorkflow"]);
      return payload;
    },
    async getProjectEvalSummary(projectId: string) {
      const payload = await request<ApiProjectEvalSummaryDto>(
        `/projects/${encodeURIComponent(projectId)}/eval`,
      );
      ensureResponseKeys(payload, ["summary", "latestRun", "latestGateDecision"]);
      return payload;
    },
    async getProjectOntologyReferences(projectId: string) {
      const payload = await request<ApiProjectOntologyReferencesDto>(
        `/projects/${encodeURIComponent(projectId)}/ontology`,
      );
      ensureResponseKeys(payload, ["projectId", "references"]);
      return payload;
    },
    async getProjectBridgeSummary(projectId: string) {
      const payload = await request<ApiProjectBridgeSummaryDto>(
        `/projects/${encodeURIComponent(projectId)}/bridge`,
      );
      ensureResponseKeys(payload, ["projectId", "adapterSummary"]);
      return payload;
    },
    async searchKnowledge(input: ApiKnowledgeSearchRequestDto) {
      const payload = await request<ApiKnowledgeSearchResultDto>("/knowledge/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["matchedAssets", "matchedChunks", "resultCount"]);
      return payload;
    },
    async getProjectKnowledge(projectId: string) {
      const payload = await request<ApiProjectKnowledgeResponseDto>(
        `/projects/${encodeURIComponent(projectId)}/knowledge`,
      );
      ensureResponseKeys(payload, ["matchedAssets", "matchedChunks", "resultCount"]);
      return payload;
    },
    async feedbackToKnowledge(input: ApiFeedbackToKnowledgeRequestDto) {
      const payload = await request<ApiFeedbackToKnowledgeResponseDto>("/knowledge/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["feedback"]);
      return payload;
    },
    async compileDecisionContext(input: ApiCompileContextRequestDto) {
      const payload = await request<ApiCompileContextResponseDto>("/brain/compile-context", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["decisionContext", "matchedKnowledge"]);
      return payload;
    },
    async compileDecision(input: ApiCompileDecisionRequestDto) {
      const payload = await request<ApiCompileDecisionResponseDto>("/brain/compile-decision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["decisionObject", "evidencePack"]);
      return payload;
    },
    async compileRoleStory(input: ApiCompileRoleStoryRequestDto) {
      const payload = await request<ApiCompileRoleStoryResponseDto>("/brain/compile-role-story", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["roleStory"]);
      return payload;
    },
    async getRoleDashboard(role: string) {
      const payload = await request<ApiRoleDashboardResponseDto>(`/roles/${encodeURIComponent(role)}/dashboard`);
      ensureResponseKeys(payload, ["role", "roleProfile", "summary", "projectCards", "decisionQueue"]);
      return payload;
    },
    async approveAction(actionId: string, input: ApiApproveActionRequestDto) {
      const payload = await request<ApiApproveActionResponseDto>(`/actions/${encodeURIComponent(actionId)}/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["action", "approval"]);
      return payload;
    },
    async rejectAction(actionId: string, input: ApiRejectActionRequestDto) {
      const payload = await request<ApiRejectActionResponseDto>(`/actions/${encodeURIComponent(actionId)}/reject`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["action", "approval"]);
      return payload;
    },
    async triggerAgent(input: ApiAgentTriggerRequestDto) {
      const payload = await request<ApiAgentTriggerResponseDto>("/agent/trigger", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["action", "run", "latestLog"]);
      return payload;
    },
    async runMockExecution(input: ApiMockRunRequestDto) {
      const payload = await request<ApiMockRunResponseDto>("/execution/mock-run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["run", "executionResult", "latestLog"]);
      return payload;
    },
    async writebackExecutionRun(runId: string) {
      const payload = await request<ApiWritebackResponseDto>(`/execution/${encodeURIComponent(runId)}/writeback`, {
        method: "POST",
      });
      ensureResponseKeys(payload, ["action", "writebackRecord", "latestLog"]);
      return payload;
    },
    async generateReview(input: ApiGenerateReviewRequestDto) {
      const payload = await request<ApiGenerateReviewResponseDto>("/review/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["review"]);
      return payload;
    },
    async publishAssetCandidate(input: ApiPublishAssetCandidateRequestDto) {
      const payload = await request<ApiPublishAssetCandidateResponseDto>("/assets/publish-candidate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["assetCandidate"]);
      return payload;
    },
    async getActionCenter(input: {
      role?: string;
      actionDomain?: string;
      approvalStatus?: string;
      executionStatus?: string;
      projectId?: string;
    } = {}) {
      const searchParams = new URLSearchParams();
      if (input.role) {
        searchParams.set("role", input.role);
      }
      if (input.actionDomain) {
        searchParams.set("actionDomain", input.actionDomain);
      }
      if (input.approvalStatus) {
        searchParams.set("approvalStatus", input.approvalStatus);
      }
      if (input.executionStatus) {
        searchParams.set("executionStatus", input.executionStatus);
      }
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      const query = searchParams.toString();
      const payload = await request<ApiActionCenterResponseDto>(`/actions${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["items", "summary", "filters"]);
      return payload;
    },
    async getReviewCenter(input: {
      projectId?: string;
      reviewStatus?: string;
      reviewType?: string;
      sourceActionId?: string;
    } = {}) {
      const searchParams = new URLSearchParams();
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      if (input.reviewStatus) {
        searchParams.set("reviewStatus", input.reviewStatus);
      }
      if (input.reviewType) {
        searchParams.set("reviewType", input.reviewType);
      }
      if (input.sourceActionId) {
        searchParams.set("sourceActionId", input.sourceActionId);
      }
      const query = searchParams.toString();
      const payload = await request<ApiReviewCenterResponseDto>(`/reviews${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["items", "summary", "filters"]);
      return payload;
    },
    async promoteReviewToAsset(reviewId: string, input: ApiPromoteReviewToAssetRequestDto) {
      const payload = await request<ApiPromoteReviewToAssetResponseDto>(
        `/reviews/${encodeURIComponent(reviewId)}/promote-to-asset`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );
      ensureResponseKeys(payload, ["review", "assetCandidate"]);
      return payload;
    },
    async getAssetLibrary(input: {
      projectId?: string;
      publishStatus?: string;
      assetType?: string;
    } = {}) {
      const searchParams = new URLSearchParams();
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      if (input.publishStatus) {
        searchParams.set("publishStatus", input.publishStatus);
      }
      if (input.assetType) {
        searchParams.set("assetType", input.assetType);
      }
      const query = searchParams.toString();
      const payload = await request<ApiAssetLibraryResponseDto>(`/assets${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["items", "summary", "filters"]);
      return payload;
    },
    async publishAsset(assetId: string, input: ApiPublishAssetRequestDto) {
      const payload = await request<ApiPublishAssetResponseDto>(`/assets/${encodeURIComponent(assetId)}/publish`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["publishedAsset"]);
      return payload;
    },
    async feedbackAssetToKnowledge(assetId: string, input: ApiFeedbackToKnowledgeRequestDto) {
      const payload = await request<ApiFeedbackToKnowledgeResponseDto>(
        `/assets/${encodeURIComponent(assetId)}/feedback-to-knowledge`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );
      ensureResponseKeys(payload, ["feedback"]);
      return payload;
    },
    async getEvaluations(input: { projectId?: string; evaluationType?: string } = {}) {
      const searchParams = new URLSearchParams();
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      if (input.evaluationType) {
        searchParams.set("evaluationType", input.evaluationType);
      }
      const query = searchParams.toString();
      const payload = await request<ApiEvaluationsResponseDto>(`/evaluations${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["records", "summary"]);
      return payload;
    },
    async runEvaluations(input: ApiRunEvaluationsRequestDto) {
      const payload = await request<ApiEvaluationsResponseDto>("/evaluations/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["records", "summary"]);
      return payload;
    },
    async getRuntimeWorkflows(input: {
      projectId?: string;
      actionId?: string;
      status?: string;
    } = {}) {
      const searchParams = new URLSearchParams();
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      if (input.actionId) {
        searchParams.set("actionId", input.actionId);
      }
      if (input.status) {
        searchParams.set("status", input.status);
      }
      const query = searchParams.toString();
      const payload = await request<ApiRuntimeWorkflowsResponseDto>(`/runtime/workflows${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["workflows", "filters"]);
      return payload;
    },
    async getRuntimeWorkflow(workflowId: string) {
      const payload = await request<ApiRuntimeWorkflowDetailResponseDto>(
        `/runtime/workflows/${encodeURIComponent(workflowId)}`,
      );
      ensureResponseKeys(payload, ["workflow", "tasks", "events", "retryRecords"]);
      return payload;
    },
    async retryRuntimeTask(taskId: string, input: ApiRuntimeTaskOperatorRequestDto) {
      const payload = await request<ApiRuntimeRetryTaskResponseDto>(
        `/runtime/tasks/${encodeURIComponent(taskId)}/retry`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );
      ensureResponseKeys(payload, ["workflow", "originalTask", "newTask", "retryRecord", "latestEvent"]);
      return payload;
    },
    async cancelRuntimeTask(taskId: string, input: ApiRuntimeTaskOperatorRequestDto) {
      const payload = await request<ApiRuntimeCancelTaskResponseDto>(
        `/runtime/tasks/${encodeURIComponent(taskId)}/cancel`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );
      ensureResponseKeys(payload, ["workflow", "task", "latestEvent"]);
      return payload;
    },
    async getEvalCases() {
      const payload = await request<ApiEvalCasesResponseDto>("/eval/cases");
      ensureResponseKeys(payload, ["cases"]);
      return payload;
    },
    async getEvalSuites() {
      const payload = await request<ApiEvalSuitesResponseDto>("/eval/suites");
      ensureResponseKeys(payload, ["suites"]);
      return payload;
    },
    async runEvalSuite(input: ApiRunEvalRequestDto) {
      const payload = await request<ApiEvalRunResponseDto>("/eval/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["run", "results", "gateDecision"]);
      return payload;
    },
    async getEvalRuns(input: { projectId?: string; suiteId?: string; status?: string } = {}) {
      const searchParams = new URLSearchParams();
      if (input.projectId) {
        searchParams.set("projectId", input.projectId);
      }
      if (input.suiteId) {
        searchParams.set("suiteId", input.suiteId);
      }
      if (input.status) {
        searchParams.set("status", input.status);
      }
      const query = searchParams.toString();
      const payload = await request<ApiEvalRunsResponseDto>(`/eval/runs${query ? `?${query}` : ""}`);
      ensureResponseKeys(payload, ["runs"]);
      return payload;
    },
    async getEvalRun(runId: string) {
      const payload = await request<ApiEvalRunResponseDto>(`/eval/runs/${encodeURIComponent(runId)}`);
      ensureResponseKeys(payload, ["run", "results", "gateDecision"]);
      return payload;
    },
    async getOntologyRegistry(input: { itemType?: string; status?: string } = {}) {
      const searchParams = new URLSearchParams();
      if (input.itemType) {
        searchParams.set("itemType", input.itemType);
      }
      if (input.status) {
        searchParams.set("status", input.status);
      }
      const query = searchParams.toString();
      const payload = await request<ApiOntologyRegistryResponseDto>(
        `/ontology/registry${query ? `?${query}` : ""}`,
      );
      ensureResponseKeys(payload, ["items", "filters"]);
      return payload;
    },
    async getOntologyRegistryItem(registryId: string) {
      const payload = await request<ApiOntologyRegistryDetailResponseDto>(
        `/ontology/registry/${encodeURIComponent(registryId)}`,
      );
      ensureResponseKeys(payload, ["item", "latestPayload", "versions", "lineageReferences"]);
      return payload;
    },
    async activateOntologyItem(input: ApiOntologyStatusMutationRequestDto) {
      const payload = await request<ApiOntologyStatusMutationResponseDto>("/ontology/activate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["item", "latestPayload", "versions", "lineageReferences"]);
      return payload;
    },
    async deprecateOntologyItem(input: ApiOntologyStatusMutationRequestDto) {
      const payload = await request<ApiOntologyStatusMutationResponseDto>("/ontology/deprecate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["item", "latestPayload", "versions", "lineageReferences"]);
      return payload;
    },
    async getBridgeAdapters() {
      const payload = await request<ApiBridgeAdaptersResponseDto>("/bridge/adapters");
      ensureResponseKeys(payload, ["adapters", "connectors"]);
      return payload;
    },
    async runBridgeSync(input: ApiBridgeSyncRequestDto) {
      const payload = await request<ApiBridgeSyncResponseDto>("/bridge/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      ensureResponseKeys(payload, ["adapter", "syncRecord"]);
      return payload;
    },
    async getBridgeSyncRecords(input: { adapterId?: string } = {}) {
      const searchParams = new URLSearchParams();
      if (input.adapterId) {
        searchParams.set("adapterId", input.adapterId);
      }
      const query = searchParams.toString();
      const payload = await request<ApiBridgeSyncRecordsResponseDto>(
        `/bridge/sync-records${query ? `?${query}` : ""}`,
      );
      ensureResponseKeys(payload, ["records", "filters"]);
      return payload;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
