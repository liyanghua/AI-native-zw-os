import { createServer } from "node:http";
import { DEFAULT_API_PORT, DEFAULT_DB_PATH } from "../config.mjs";
import { openDatabase } from "../db/client.mjs";
import {
  compileDecisionContext,
  compileDecisionObject,
  compileRoleStory,
} from "../db/brain.mjs";
import {
  getProjectKnowledge,
  searchKnowledge,
} from "../db/knowledge.mjs";
import { getRoleDashboard } from "../db/roles.mjs";
import { getProjectDetail, listProjects } from "../db/projects.mjs";
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
