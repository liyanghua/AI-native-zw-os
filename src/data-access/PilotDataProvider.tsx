import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import { createPilotRuntime } from "./pilotRuntime";

const PilotDataContext = createContext<ReturnType<typeof createContextValue> | null>(null);

function createContextValue(forceRefresh: () => void, runtime = createPilotRuntime()) {
  return {
    runtime,
    refresh() {
      runtime.refreshLiveData();
      forceRefresh();
    },
    approveAction(actionId: string) {
      const action = runtime.actionGateway.approveAction(actionId);
      forceRefresh();
      return action;
    },
    rejectAction(actionId: string, reason?: string) {
      const action = runtime.actionGateway.rejectAction(actionId, reason);
      forceRefresh();
      return action;
    },
    writeExecutionResult(actionId: string, input: Parameters<typeof runtime.actionGateway.writeExecutionResult>[1]) {
      const action = runtime.actionGateway.writeExecutionResult(actionId, input);
      forceRefresh();
      return action;
    },
    publishAssetCandidate(candidateId: string) {
      const asset = runtime.knowledgeGateway.publishAssetCandidate(candidateId);
      forceRefresh();
      return asset;
    },
    compileDecisionObject(projectId: string) {
      const decision = runtime.decisionGateway.compileDecisionObject(projectId);
      forceRefresh();
      return decision;
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
