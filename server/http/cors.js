import os from "os";

export function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

export function createCorsHandlers(allowedOrigins) {
  function resolveCorsOrigin(req) {
    const origin = req.headers.origin;

    if (!origin) {
      return allowedOrigins[0] || "*";
    }

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return origin;
    }

    return "";
  }

  function applyCors(req, res) {
    const corsOrigin = resolveCorsOrigin(req);

    if (!corsOrigin) {
      return false;
    }

    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Vary", "Origin");
    return true;
  }

  return { applyCors, resolveCorsOrigin };
}
