import { useEffect, useState, type DependencyList } from "react";
import type { QueryResult } from "../domain/types/query";

export function useRemoteQuery<T>(
  load: () => Promise<QueryResult<T>>,
  dependencies: DependencyList,
  options: { pollMs?: number } = {},
) {
  const [query, setQuery] = useState<QueryResult<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const execute = async () => {
      if (!cancelled) {
        setIsLoading(true);
      }

      const nextQuery = await load();
      if (!cancelled) {
        setQuery(nextQuery);
        setIsLoading(false);
      }
    };

    void execute();

    if (!options.pollMs) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void execute();
    }, options.pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, dependencies);

  return {
    query,
    isLoading,
  };
}
