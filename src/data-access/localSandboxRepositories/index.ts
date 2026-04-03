import type { ApiClient } from "../apiClient";
import { createLocalSandboxBrainRepository } from "./brainRepository";
import { createLocalSandboxBridgeRepository } from "./bridgeRepository";
import { createLocalSandboxEvalRepository } from "./evalRepository";
import { createLocalSandboxExecutionRepository } from "./executionRepository";
import { createLocalSandboxGovernanceRepository } from "./governanceRepository";
import { createLocalSandboxKnowledgeRepository } from "./knowledgeRepository";
import { createLocalSandboxLifecycleRepository } from "./lifecycleRepository";
import { createLocalSandboxOntologyRepository } from "./ontologyRepository";
import { createLocalSandboxProjectsRepository } from "./projectsRepository";
import { createLocalSandboxRolesRepository } from "./rolesRepository";
import { createLocalSandboxRuntimeRepository } from "./runtimeRepository";

export function createLocalSandboxRepositories(client: ApiClient) {
  const knowledge = createLocalSandboxKnowledgeRepository(client);
  const brain = createLocalSandboxBrainRepository(client);
  const roles = createLocalSandboxRolesRepository(client);
  const execution = createLocalSandboxExecutionRepository(client);
  const governance = createLocalSandboxGovernanceRepository(client);
  const runtime = createLocalSandboxRuntimeRepository(client);
  const evalRepository = createLocalSandboxEvalRepository(client);
  const ontology = createLocalSandboxOntologyRepository(client);
  const bridge = createLocalSandboxBridgeRepository(client);
  return {
    brain,
    bridge,
    eval: evalRepository,
    execution,
    governance,
    knowledge,
    lifecycle: createLocalSandboxLifecycleRepository(client),
    ontology,
    projects: createLocalSandboxProjectsRepository(client, {
      brain,
      bridge,
      eval: evalRepository,
      execution,
      governance,
      knowledge,
      ontology,
      runtime,
    }),
    roles,
    runtime,
  };
}

export type LocalSandboxRepositories = ReturnType<typeof createLocalSandboxRepositories>;
export * from "./types";
