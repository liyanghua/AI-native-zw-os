import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { createApiClient } from "./apiClient";
import { createLocalSandboxRepositories } from "./localSandboxRepositories";
import { createMutationResult } from "./queryResult";
import { createPilotRepositories } from "./repositories";
import { createPilotRuntime } from "./pilotRuntime";

const PilotDataContext = createContext<ReturnType<typeof createContextValue> | null>(null);

function createContextValue(forceRefresh: () => void, runtime = createPilotRuntime()) {
  const repositories = createPilotRepositories(runtime);
  const sandboxRepositories = createLocalSandboxRepositories(
    createApiClient({ baseUrl: "/api" }),
  );
  return {
    repositories,
    sandboxRepositories,
    refresh() {
      runtime.refreshLiveData();
      forceRefresh();
    },
    actions: {
      approveAction(actionId: string) {
        const action = runtime.actionGateway.approveAction(actionId);
        forceRefresh();
        return createMutationResult({
          data: action,
          lastUpdatedAt: action.updatedAt,
        });
      },
      rejectAction(actionId: string, reason?: string) {
        const action = runtime.actionGateway.rejectAction(actionId, reason);
        forceRefresh();
        return createMutationResult({
          data: action,
          lastUpdatedAt: action.updatedAt,
        });
      },
      writeExecutionResult(actionId: string, input: Parameters<typeof runtime.actionGateway.writeExecutionResult>[1]) {
        const action = runtime.actionGateway.writeExecutionResult(actionId, input);
        forceRefresh();
        return createMutationResult({
          data: action,
          lastUpdatedAt: action.updatedAt,
          error: action.lastWritebackError ?? null,
        });
      },
      publishAssetCandidate(candidateId: string) {
        const asset = runtime.knowledgeGateway.publishAssetCandidate(candidateId);
        forceRefresh();
        return createMutationResult({
          data: asset,
          lastUpdatedAt: asset.updatedAt,
        });
      },
      compileDecisionContext(projectId: string) {
        const context = runtime.decisionGateway.compileDecisionContext(projectId);
        forceRefresh();
        return createMutationResult({
          data: context,
          lastUpdatedAt: context.updatedAt,
        });
      },
      compileDecisionObject(projectId: string) {
        const decision = runtime.decisionGateway.compileDecisionObject(projectId);
        forceRefresh();
        return createMutationResult({
          data: decision,
          lastUpdatedAt: decision.updatedAt,
        });
      },
      transitionProjectStage(projectId: string, nextStage: Parameters<typeof runtime.projectGateway.transitionProjectStage>[1], reason: string) {
        const project = repositories.projectWorkbench.transitionProjectStage(projectId, nextStage, reason);
        forceRefresh();
        return project;
      },
    },
  };
}

export function PilotDataProvider({ children }: PropsWithChildren) {
  const [, bumpVersion] = useReducer((value) => value + 1, 0);
  const runtimeRef = useRef(createPilotRuntime());

  const contextValue = useMemo(
    () => createContextValue(() => bumpVersion(), runtimeRef.current),
    [],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      contextValue.refresh();
    }, 45_000);
    return () => window.clearInterval(intervalId);
  }, [contextValue]);

  return <PilotDataContext.Provider value={contextValue}>{children}</PilotDataContext.Provider>;
}

export function usePilotData() {
  const context = useContext(PilotDataContext);
  if (!context) {
    throw new Error("usePilotData must be used inside PilotDataProvider.");
  }
  return context;
}
