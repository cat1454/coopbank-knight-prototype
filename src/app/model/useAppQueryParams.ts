import { useMemo } from "react";

export type CaptureMode = "split" | "phone" | "agent";

export function useAppQueryParams() {
  const queryParams = useMemo(() => {
    return typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  }, []);

  const isTestMode = useMemo(() => {
    return import.meta.env.MODE === "test" || queryParams.get("env") === "test";
  }, [queryParams]);

  const captureMode = useMemo<CaptureMode>(() => {
    const requestedMode = queryParams.get("capture");
    return requestedMode === "phone" || requestedMode === "agent" ? requestedMode : "split";
  }, [queryParams]);

  const requestedShot = queryParams.get("shot");
  const guardianDemoEnabled = queryParams.get("demo") === "true";

  return {
    captureMode,
    guardianDemoEnabled,
    isTestMode,
    queryParams,
    requestedShot,
  };
}
