// tests/services/googleCalendar.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listEvents, createEvent, deleteEvent,
  CalendarAuthError, CalendarApiError,
} from "@/services/googleCalendar";

const TOKEN = "tok-123";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("listEvents", () => {
  it("sends bearer token + query params and returns items", async () => {
    const items = [{ id: "e1", start: {}, end: {} }];
    const f = mockFetch(200, { items });
    vi.stubGlobal("fetch", f);
    const result = await listEvents(TOKEN, "2026-06-01T00:00:00Z", "2026-06-30T23:59:59Z");
    expect(result).toEqual(items);
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toContain("singleEvents=true");
    expect(String(url)).toContain("orderBy=startTime");
    expect((init as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer tok-123");
  });

  it("throws CalendarAuthError on 401", async () => {
    vi.stubGlobal("fetch", mockFetch(401, { error: "unauth" }));
    await expect(listEvents(TOKEN, "a", "b")).rejects.toBeInstanceOf(CalendarAuthError);
  });

  it("throws CalendarApiError on 500", async () => {
    vi.stubGlobal("fetch", mockFetch(500, { error: "boom" }));
    await expect(listEvents(TOKEN, "a", "b")).rejects.toBeInstanceOf(CalendarApiError);
  });
});

describe("createEvent", () => {
  it("POSTs JSON payload", async () => {
    const f = mockFetch(200, { id: "new" });
    vi.stubGlobal("fetch", f);
    const out = await createEvent(TOKEN, { summary: "x", start: {}, end: {} });
    expect(out).toEqual({ id: "new" });
    const init = f.mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).summary).toBe("x");
  });
});

describe("deleteEvent", () => {
  it("resolves on 204 with no body", async () => {
    vi.stubGlobal("fetch", mockFetch(204, null));
    await expect(deleteEvent(TOKEN, "e1")).resolves.toBeUndefined();
  });
});
