import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock EventSource globally for JSDOM testing
class MockEventSource {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close() {}
}

vi.stubGlobal("EventSource", MockEventSource);

// Mock fetch globally for JSDOM testing
vi.stubGlobal(
  "fetch",
  vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 })),
);
