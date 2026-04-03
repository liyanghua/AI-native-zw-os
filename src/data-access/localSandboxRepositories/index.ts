import type { ApiClient } from "../apiClient";
import { createLocalSandboxBrainRepository } from "./brainRepository";
import { createLocalSandboxExecutionRepository } from "./executionRepository";
import { createLocalSandboxKnowledgeRepository } from "./knowledgeRepository";
import { createLocalSandboxLifecycleRepository } from "./lifecycleRepository";
import { createLocalSandboxProjectsRepository } from "./projectsRepository";
import { createLocalSandboxRolesRepository } from "./rolesRepository";

export function createLocalSandboxRepositories(client: ApiClient) {
  const knowledge = createLocalSandboxKnowledgeRepository(client);
  const brain = createLocalSandboxBrainRepository(client);
  const roles = createLocalSandboxRolesRepository(client);
  const execution = createLocalSandboxExecutionRepository(client);
  return {
    brain,
    execution,
    knowledge,
    lifecycle: createLocalSandboxLifecycleRepository(client),
    projects: createLocalSandboxProjectsRepository(client, { brain, execution, knowledge }),
    roles,
  };
}

export type LocalSandboxRepositories = ReturnType<typeof createLocalSandboxRepositories>;
export * from "./types";
