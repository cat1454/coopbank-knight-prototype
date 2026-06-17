const DEFAULT_PRODUCTION_BACKEND_URL = "https://knight-api.danangtoiiu.live";

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getBackendOrigin(location: Location = window.location) {
  const configuredUrl = import.meta.env.VITE_BACKEND_URL?.trim();

  if (configuredUrl) {
    return trimTrailingSlashes(configuredUrl);
  }

  if (location.hostname === "knight.danangtoiiu.live") {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  if (isLocalHost(location.hostname)) {
    return "http://localhost:5000";
  }

  if (location.protocol === "http:") {
    return `http://${location.hostname}:5000`;
  }

  return "";
}

export function buildBackendUrl(path: string, location?: Location) {
  const origin = getBackendOrigin(location);

  if (!origin) {
    return "";
  }

  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
