import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock EventSource globally for JSDOM testing
class MockEventSource {
  url: string;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  onerror: (() => any) | null = null;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close() {}
}

global.EventSource = MockEventSource as any;

// Mock fetch globally for JSDOM testing
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: "ok" }),
  })
) as any;
