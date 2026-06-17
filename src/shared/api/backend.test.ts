import { describe, expect, it } from "vitest";
import { buildBackendUrl, getBackendOrigin } from "./backend";

function makeLocation(overrides: Partial<Location>) {
  return {
    hostname: "localhost",
    protocol: "http:",
    ...overrides,
  } as Location;
}

describe("backend URL configuration", () => {
  it("uses localhost for local browser development", () => {
    expect(getBackendOrigin(makeLocation({ hostname: "localhost" }))).toBe("http://localhost:5000");
  });

  it("uses the same LAN host for mobile local development over HTTP", () => {
    expect(getBackendOrigin(makeLocation({ hostname: "192.168.1.12" }))).toBe("http://192.168.1.12:5000");
  });

  it("uses the Knight API tunnel for the deployed frontend domain", () => {
    expect(
      buildBackendUrl("/api/push/public-key", makeLocation({
        hostname: "knight.danangtoiiu.live",
        protocol: "https:",
      })),
    ).toBe("https://knight-api.danangtoiiu.live/api/push/public-key");
  });

  it("leaves unknown HTTPS preview domains backendless unless VITE_BACKEND_URL is set", () => {
    expect(getBackendOrigin(makeLocation({ hostname: "preview.pages.dev", protocol: "https:" }))).toBe("");
  });
});
