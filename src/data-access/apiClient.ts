import type {
  ApiCompileContextRequestDto,
  ApiCompileContextResponseDto,
  ApiCompileDecisionRequestDto,
  ApiCompileDecisionResponseDto,
  ApiCompileRoleStoryRequestDto,
  ApiCompileRoleStoryResponseDto,
  ApiErrorPayload,
  ApiKnowledgeSearchRequestDto,
  ApiKnowledgeSearchResultDto,
  ApiRoleDashboardResponseDto,
  ApiProjectKnowledgeResponseDto,
  ApiProjectDetailDto,
  ApiProjectListResponseDto,
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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
