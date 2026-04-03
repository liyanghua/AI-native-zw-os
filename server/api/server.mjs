import { createServer } from "node:http";
import { DEFAULT_API_PORT, DEFAULT_DB_PATH } from "../config.mjs";
import { openDatabase } from "../db/client.mjs";
import {
  compileDecisionContext,
  compileDecisionObject,
  compileRoleStory,
} from "../db/brain.mjs";
import {
  approveAction,
  generateReview,
  getProjectLineage,
  publishAssetCandidate,
  rejectAction,
  runMockExecution,
  triggerAgent,
  writebackExecutionRun,
} from "../db/execution.mjs";
import {
  listBridgeAdapters,
  listSyncRecords,
  getProjectBridgeSummary,
  runBridgeSync,
} from "../db/bridge.mjs";
import {
  getProjectEvalSummary,
  getEvalRun,
  listEvalCases,
  listEvalRuns,
  listEvalSuites,
  runEvalSuite,
} from "../db/eval.mjs";
import {
  getProjectKnowledge,
  searchKnowledge,
} from "../db/knowledge.mjs";
import {
  feedbackToKnowledge,
  getProjectGovernance,
  listActionCenter,
  listAssetLibrary,
  listEvaluations,
  listReviewCenter,
  promoteReviewToAsset,
  publishAsset,
  runEvaluations,
} from "../db/governance.mjs";
import {
  activateOntologyItem,
  deprecateOntologyItem,
  getOntologyRegistryItem,
  getProjectOntologyReferences,
  listOntologyRegistry,
} from "../db/ontology.mjs";
import { getRoleDashboard } from "../db/roles.mjs";
import { getProjectDetail, listProjects } from "../db/projects.mjs";
import {
  cancelRuntimeTask,
  getRuntimeWorkflow,
  getProjectRuntimeSummary,
  listRuntimeWorkflows,
  retryRuntimeTask,
} from "../db/runtime.mjs";
import { jsonError, sendJson } from "./errors.mjs";

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_json_body");
  }
}

function createRequestHandler(db) {
  return async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && url.pathname === "/api/projects") {
        const stage = url.searchParams.get("stage") ?? undefined;
        const projects = listProjects(db, { stage });
        sendJson(response, 200, { projects });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/runtime/workflows") {
        const result = listRuntimeWorkflows(db, {
          projectId: url.searchParams.get("projectId") ?? undefined,
          actionId: url.searchParams.get("actionId") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      const runtimeWorkflowMatch = url.pathname.match(/^\/api\/runtime\/workflows\/([^/]+)$/);
      if (request.method === "GET" && runtimeWorkflowMatch) {
        const workflowId = decodeURIComponent(runtimeWorkflowMatch[1]);
        const result = getRuntimeWorkflow(db, workflowId);
        if (!result) {
          sendJson(response, 404, jsonError("workflow_not_found", `Workflow ${workflowId} not found.`));
          return;
        }
        sendJson(response, 200, result);
        return;
      }

      const retryTaskMatch = url.pathname.match(/^\/api\/runtime\/tasks\/([^/]+)\/retry$/);
      if (request.method === "POST" && retryTaskMatch) {
        const taskId = decodeURIComponent(retryTaskMatch[1]);
        const payload = await readJsonBody(request);
        const result = retryRuntimeTask(db, taskId, payload);
        sendJson(response, 200, result);
        return;
      }

      const cancelTaskMatch = url.pathname.match(/^\/api\/runtime\/tasks\/([^/]+)\/cancel$/);
      if (request.method === "POST" && cancelTaskMatch) {
        const taskId = decodeURIComponent(cancelTaskMatch[1]);
        const payload = await readJsonBody(request);
        const result = cancelRuntimeTask(db, taskId, payload);
        sendJson(response, 200, result);
        return;
      }

      const projectKnowledgeMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/knowledge$/);
      if (request.method === "GET" && projectKnowledgeMatch) {
        const projectId = decodeURIComponent(projectKnowledgeMatch[1]);
        const knowledge = getProjectKnowledge(db, projectId);
        if (!knowledge) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, knowledge);
        return;
      }

      const projectLineageMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/lineage$/);
      if (request.method === "GET" && projectLineageMatch) {
        const projectId = decodeURIComponent(projectLineageMatch[1]);
        const lineage = getProjectLineage(db, projectId);
        if (!lineage) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, lineage);
        return;
      }

      const projectRuntimeMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/runtime$/);
      if (request.method === "GET" && projectRuntimeMatch) {
        const projectId = decodeURIComponent(projectRuntimeMatch[1]);
        const summary = getProjectRuntimeSummary(db, projectId);
        if (!summary) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, summary);
        return;
      }

      const projectEvalMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/eval$/);
      if (request.method === "GET" && projectEvalMatch) {
        const projectId = decodeURIComponent(projectEvalMatch[1]);
        const summary = getProjectEvalSummary(db, projectId);
        sendJson(response, 200, summary);
        return;
      }

      const projectOntologyMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/ontology$/);
      if (request.method === "GET" && projectOntologyMatch) {
        const projectId = decodeURIComponent(projectOntologyMatch[1]);
        const references = getProjectOntologyReferences(db, projectId);
        if (!references) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, references);
        return;
      }

      const projectBridgeMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/bridge$/);
      if (request.method === "GET" && projectBridgeMatch) {
        const projectId = decodeURIComponent(projectBridgeMatch[1]);
        const summary = getProjectBridgeSummary(db, projectId);
        if (!summary) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, summary);
        return;
      }

      const projectGovernanceMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/governance$/);
      if (request.method === "GET" && projectGovernanceMatch) {
        const projectId = decodeURIComponent(projectGovernanceMatch[1]);
        const governance = getProjectGovernance(db, projectId);
        if (!governance) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, governance);
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/api/projects/")) {
        const projectId = decodeURIComponent(url.pathname.replace("/api/projects/", ""));
        const detail = getProjectDetail(db, projectId);
        if (!detail) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${projectId} not found.`));
          return;
        }
        sendJson(response, 200, detail);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/knowledge/search") {
        const payload = await readJsonBody(request);
        const result = searchKnowledge(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/knowledge/feedback") {
        const payload = await readJsonBody(request);
        const result = feedbackToKnowledge(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/brain/compile-context") {
        const payload = await readJsonBody(request);
        const result = compileDecisionContext(db, payload.projectId);
        if (!result) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${payload.projectId} not found.`));
          return;
        }
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/brain/compile-decision") {
        const payload = await readJsonBody(request);
        const result = compileDecisionObject(db, payload.projectId);
        if (!result) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${payload.projectId} not found.`));
          return;
        }
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/brain/compile-role-story") {
        const payload = await readJsonBody(request);
        const roleStory = compileRoleStory(db, payload.projectId, payload.role);
        if (!roleStory) {
          sendJson(response, 404, jsonError("project_not_found", `Project ${payload.projectId} not found.`));
          return;
        }
        sendJson(response, 200, { roleStory });
        return;
      }

      const approveActionMatch = url.pathname.match(/^\/api\/actions\/([^/]+)\/approve$/);
      if (request.method === "POST" && approveActionMatch) {
        const actionId = decodeURIComponent(approveActionMatch[1]);
        const payload = await readJsonBody(request);
        const result = approveAction(db, actionId, payload);
        sendJson(response, 200, result);
        return;
      }

      const rejectActionMatch = url.pathname.match(/^\/api\/actions\/([^/]+)\/reject$/);
      if (request.method === "POST" && rejectActionMatch) {
        const actionId = decodeURIComponent(rejectActionMatch[1]);
        const payload = await readJsonBody(request);
        const result = rejectAction(db, actionId, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/agent/trigger") {
        const payload = await readJsonBody(request);
        const result = triggerAgent(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/execution/mock-run") {
        const payload = await readJsonBody(request);
        const result = runMockExecution(db, payload);
        sendJson(response, 200, result);
        return;
      }

      const writebackMatch = url.pathname.match(/^\/api\/execution\/([^/]+)\/writeback$/);
      if (request.method === "POST" && writebackMatch) {
        const runId = decodeURIComponent(writebackMatch[1]);
        const result = writebackExecutionRun(db, runId);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/review/generate") {
        const payload = await readJsonBody(request);
        const result = generateReview(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/assets/publish-candidate") {
        const payload = await readJsonBody(request);
        const result = publishAssetCandidate(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/actions") {
        const result = listActionCenter(db, {
          role: url.searchParams.get("role") ?? undefined,
          actionDomain: url.searchParams.get("actionDomain") ?? undefined,
          approvalStatus: url.searchParams.get("approvalStatus") ?? undefined,
          executionStatus: url.searchParams.get("executionStatus") ?? undefined,
          projectId: url.searchParams.get("projectId") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/reviews") {
        const result = listReviewCenter(db, {
          projectId: url.searchParams.get("projectId") ?? undefined,
          reviewStatus: url.searchParams.get("reviewStatus") ?? undefined,
          reviewType: url.searchParams.get("reviewType") ?? undefined,
          sourceActionId: url.searchParams.get("sourceActionId") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      const reviewPromoteMatch = url.pathname.match(/^\/api\/reviews\/([^/]+)\/promote-to-asset$/);
      if (request.method === "POST" && reviewPromoteMatch) {
        const reviewId = decodeURIComponent(reviewPromoteMatch[1]);
        const payload = await readJsonBody(request);
        const result = promoteReviewToAsset(db, reviewId, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/assets") {
        const result = listAssetLibrary(db, {
          projectId: url.searchParams.get("projectId") ?? undefined,
          publishStatus: url.searchParams.get("publishStatus") ?? undefined,
          assetType: url.searchParams.get("assetType") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      const publishAssetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/publish$/);
      if (request.method === "POST" && publishAssetMatch) {
        const candidateId = decodeURIComponent(publishAssetMatch[1]);
        const payload = await readJsonBody(request);
        const result = publishAsset(db, candidateId, payload);
        sendJson(response, 200, result);
        return;
      }

      const assetFeedbackMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/feedback-to-knowledge$/);
      if (request.method === "POST" && assetFeedbackMatch) {
        const assetId = decodeURIComponent(assetFeedbackMatch[1]);
        const payload = await readJsonBody(request);
        const result = feedbackToKnowledge(db, {
          ...payload,
          sourceType: "published_asset",
          sourceId: assetId,
        });
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/evaluations") {
        const result = listEvaluations(db, {
          projectId: url.searchParams.get("projectId") ?? undefined,
          evaluationType: url.searchParams.get("evaluationType") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/evaluations/run") {
        const payload = await readJsonBody(request);
        const result = runEvaluations(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/eval/cases") {
        const result = listEvalCases(db);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/eval/suites") {
        const result = listEvalSuites(db);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/eval/run") {
        const payload = await readJsonBody(request);
        const result = runEvalSuite(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/eval/runs") {
        const result = listEvalRuns(db, {
          projectId: url.searchParams.get("projectId") ?? undefined,
          suiteId: url.searchParams.get("suiteId") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      const evalRunMatch = url.pathname.match(/^\/api\/eval\/runs\/([^/]+)$/);
      if (request.method === "GET" && evalRunMatch) {
        const runId = decodeURIComponent(evalRunMatch[1]);
        const result = getEvalRun(db, runId);
        if (!result) {
          sendJson(response, 404, jsonError("eval_run_not_found", `Eval run ${runId} not found.`));
          return;
        }
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/ontology/registry") {
        const result = listOntologyRegistry(db, {
          itemType: url.searchParams.get("itemType") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      const ontologyItemMatch = url.pathname.match(/^\/api\/ontology\/registry\/([^/]+)$/);
      if (request.method === "GET" && ontologyItemMatch) {
        const registryId = decodeURIComponent(ontologyItemMatch[1]);
        const result = getOntologyRegistryItem(db, registryId);
        if (!result) {
          sendJson(response, 404, jsonError("ontology_item_not_found", `Ontology item ${registryId} not found.`));
          return;
        }
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/ontology/activate") {
        const payload = await readJsonBody(request);
        const result = activateOntologyItem(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/ontology/deprecate") {
        const payload = await readJsonBody(request);
        const result = deprecateOntologyItem(db, payload);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/bridge/adapters") {
        const result = listBridgeAdapters(db);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/bridge/sync-records") {
        const result = listSyncRecords(db, {
          adapterId: url.searchParams.get("adapterId") ?? undefined,
        });
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/bridge/sync") {
        const payload = await readJsonBody(request);
        const result = await runBridgeSync(db, payload);
        sendJson(response, 200, result);
        return;
      }

      const roleDashboardMatch = url.pathname.match(/^\/api\/roles\/([^/]+)\/dashboard$/);
      if (request.method === "GET" && roleDashboardMatch) {
        const role = decodeURIComponent(roleDashboardMatch[1]);
        const dashboard = getRoleDashboard(db, role);
        if (!dashboard) {
          sendJson(response, 404, jsonError("role_not_found", `Role ${role} not found.`));
          return;
        }
        sendJson(response, 200, dashboard);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { ok: true });
        return;
      }

      sendJson(response, 404, jsonError("route_not_found", `No route for ${request.method} ${url.pathname}`));
    } catch (error) {
      if (error instanceof Error && error.message === "invalid_json_body") {
        sendJson(response, 400, jsonError("invalid_json_body", "Request body is not valid JSON."));
        return;
      }
      if (error instanceof Error && "statusCode" in error && "code" in error) {
        sendJson(
          response,
          error.statusCode,
          jsonError(error.code, error.message, "details" in error ? error.details : undefined),
        );
        return;
      }
      sendJson(
        response,
        500,
        jsonError("internal_server_error", error instanceof Error ? error.message : "Unknown server error."),
      );
    }
  };
}

export async function startLocalSandboxApiServer({
  dbPath = DEFAULT_DB_PATH,
  port = DEFAULT_API_PORT,
} = {}) {
  const db = openDatabase(dbPath);
  const server = createServer(createRequestHandler(db));

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : port;

  return {
    port: resolvedPort,
    baseUrl: `http://127.0.0.1:${resolvedPort}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      db.close();
    },
  };
}
