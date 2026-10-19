import { useCallback, useEffect, useState } from "react";
export function useRemote<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    data?: T;
    loading: boolean;
    error?: Error;
    forLoad?: typeof load;
    forVersion?: number;
  }>({ loading: true });
  const refresh = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true, error: undefined }));
    setVersion((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({
            data,
            loading: false,
            forLoad: load,
            forVersion: version,
          });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState((previous) => ({
            ...previous,
            loading: false,
            forLoad: load,
            forVersion: version,
            error:
              error instanceof Error
                ? error
                : new Error("Unable to load data."),
          }));
      });
    return () => controller.abort();
  }, [load, version]);
  const current = state.forLoad === load && state.forVersion === version;
  return {
    data: state.data,
    error: current ? state.error : undefined,
    loading: state.loading || !current,
    refresh,
  };
}
