import { useEffect } from "react";

interface UseAlertLaunchOptions {
  isTestMode: boolean;
  startScenario: () => void;
}

export function useAlertLaunch({ isTestMode, startScenario }: UseAlertLaunchOptions) {
  useEffect(() => {
    if (isTestMode) {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.get("alert") !== "1") {
      return;
    }

    url.searchParams.delete("alert");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const timeoutId = window.setTimeout(() => {
      startScenario();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isTestMode, startScenario]);
}
