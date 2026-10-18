import { describe, expect, it, vi } from "vitest";
import { createDemoLibrary, VLOGS } from "../src/lib/portfolio/demo";

const STORAGE = "maximanim-portfolio:demo:v1";
const ids = VLOGS.map(video => video.id);

function memory(initial?: unknown) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE, typeof initial === "string" ? initial : JSON.stringify(initial));
  return { map, getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => void map.set(key, value) };
}
function setup(initial?: unknown) {
  const storage = memory(initial);
  let n = 0;
  return { storage, library: createDemoLibrary(storage, () => `id-${++n}`), saved: () => JSON.parse(storage.map.get(STORAGE) ?? "[]") as { key: string; sessionId: string; id: string; position: number }[] };
}

describe("new playback intent", () => {
  it("draws once from the approved catalogue and persists the session", () => {
    const { library, saved } = setup();
    const random = vi.fn(() => 0.99);
    const session = library.open("10:1", { kind: "new" }, random);
    expect(random).toHaveBeenCalledOnce();
    expect(session.id).toBe(VLOGS[2].id);
    expect(saved()).toHaveLength(1);
    expect(saved()[0]).toMatchObject({ key: "10:1", sessionId: session.sessionId, id: session.id, position: 0 });
  });

  it("never repeats the previous selection while another approved video exists", () => {
    const { library } = setup();
    for (const draw of [0, 0.34, 0.5, 0.67, 0.99, Number.NaN]) {
      const previous = library.open("10:1", { kind: "new" }, () => 0.5);
      const next = library.open("10:1", { kind: "new" }, () => draw);
      expect(next.id, `draw ${draw}`).not.toBe(previous.id);
      expect(ids).toContain(next.id);
    }
  });

  it("can reach every approved video over successive sessions, and gives each its own identity", () => {
    const { library } = setup();
    const seen = new Set<string>(); const sessionIds = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const session = library.open("10:1", { kind: "new" }, () => (i % 7) / 7);
      seen.add(session.id); sessionIds.add(session.sessionId);
    }
    expect(seen.size).toBe(ids.length);
    expect(sessionIds.size).toBe(12);
  });

  it("clamps an out-of-range random source instead of throwing", () => {
    const { library } = setup();
    expect(ids).toContain(library.open("10:1", { kind: "new" }, () => 7).id);
    expect(ids).toContain(library.open("10:2", { kind: "new" }, () => -3).id);
  });
});

describe("reload, resume and episode changes", () => {
  it("reloads the same session with its exact video and position, without drawing again", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0.8);
    expect(library.save({ ...first, position: 123, duration: 875 })).toBe(true);
    const random = vi.fn(() => 0);
    const reloaded = library.open("10:1", { kind: "session", sessionId: first.sessionId }, random);
    expect(random).not.toHaveBeenCalled();
    expect(reloaded).toMatchObject({ sessionId: first.sessionId, id: first.id, position: 123, duration: 875 });
    expect(reloaded.revision).not.toBe(first.revision);
  });

  it("resumes the latest session of that episode, not an older one, without drawing again", () => {
    const { library } = setup();
    const older = library.open("10:1", { kind: "new" }, () => 0);
    library.save({ ...older, position: 10, duration: 500 });
    const newer = library.open("10:1", { kind: "new" }, () => 0.99);
    library.save({ ...newer, position: 67, duration: 900 });
    const random = vi.fn(() => 0);
    expect(library.open("10:1", { kind: "resume" }, random)).toMatchObject({ sessionId: newer.sessionId, id: newer.id, position: 67 });
    expect(random).not.toHaveBeenCalled();
  });

  it("falls back to a new session when there is nothing to resume or reload", () => {
    const { library } = setup();
    const resumed = library.open("10:1", { kind: "resume" }, () => 0);
    expect(resumed).toMatchObject({ position: 0, id: VLOGS[0].id });
    const unknown = library.open("10:1", { kind: "session", sessionId: "never-existed" }, () => 0.5);
    expect(unknown.sessionId).not.toBe("never-existed");
    expect(unknown.position).toBe(0);
  });

  it("never lets a session of another episode be reloaded under the wrong episode", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0);
    library.save({ ...first, position: 50, duration: 500 });
    const other = library.open("10:2", { kind: "session", sessionId: first.sessionId }, () => 0.99);
    expect(other.key).toBe("10:2");
    expect(other.position).toBe(0);
    expect(other.sessionId).not.toBe(first.sessionId);
  });

  it("keeps episodes independent: entering a different episode starts a new session and leaves the first resumable", () => {
    const { library } = setup();
    const one = library.open("10:1", { kind: "new" }, () => 0);
    library.save({ ...one, position: 77, duration: 500 });
    const two = library.open("10:2", { kind: "new" }, () => 0);
    expect(two.id).not.toBe(one.id);
    expect(library.save({ ...two, position: 5, duration: 500 })).toBe(true);
    expect(library.open("10:1", { kind: "resume" })).toMatchObject({ sessionId: one.sessionId, position: 77 });
  });
});

describe("storage resilience", () => {
  it("reads the per-episode format that predates sessions, dropping obsolete fields, and keeps its position", () => {
    const { library, saved } = setup([{ key: "10:1", id: VLOGS[1].id, mode: "html5", position: 124, duration: 875, updatedAt: 5 }]);
    const resumed = library.open("10:1", { kind: "resume" }, () => 0);
    expect(resumed).toMatchObject({ id: VLOGS[1].id, position: 124 });
    expect(resumed).not.toHaveProperty("mode");
    expect(saved()[0]).not.toHaveProperty("mode");
  });

  it("starts a fresh bounded library from corrupted JSON and overwrites it on the next write", () => {
    const { library, storage, saved } = setup("{ not json");
    const session = library.open("10:1", { kind: "new" }, () => 0);
    expect(session.id).toBe(VLOGS[0].id);
    expect(saved()).toHaveLength(1);
    expect(storage.map.get(STORAGE)).toContain(session.sessionId);
  });

  it("ignores non-array payloads", () => {
    const { library } = setup({ key: "10:1" });
    expect(library.open("10:1", { kind: "resume" }, () => 0).position).toBe(0);
  });

  it("rejects unknown videos, foreign shapes and malformed positions or durations", () => {
    const { library } = setup([
      null, "x", 3,
      { key: "10:1", id: "foreign", position: 0, duration: 100 },
      { key: "10:1", id: VLOGS[1].id, position: -1, duration: 100 },
      { key: "10:1", id: VLOGS[1].id, position: "9", duration: 100 },
      { key: "10:1", id: VLOGS[1].id, position: 9, duration: -4 },
      { key: 12, id: VLOGS[1].id, position: 9, duration: 100 },
    ]);
    expect(library.open("10:1", { kind: "resume" }, () => 0)).toMatchObject({ id: VLOGS[0].id, position: 0 });
  });

  it("keeps a bounded in-memory session when storage is blocked or full", () => {
    const blocked = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("quota"); } };
    let n = 0;
    const library = createDemoLibrary(blocked, () => `m-${++n}`);
    const session = library.open("10:1", { kind: "new" }, () => 0.5);
    expect(library.save({ ...session, position: 42, duration: 300 })).toBe(true);
    expect(library.open("10:1", { kind: "resume" })).toMatchObject({ sessionId: session.sessionId, position: 42 });
  });

  it("works without any storage object (server render)", () => {
    const library = createDemoLibrary(undefined, () => "x");
    expect(ids).toContain(library.open("10:1", { kind: "new" }, () => 0).id);
  });

  it("keeps at most 64 sessions", () => {
    const { library, saved } = setup();
    for (let i = 0; i < 70; i++) library.open(`10:${i}`, { kind: "new" }, () => 0);
    expect(saved()).toHaveLength(64);
    expect(saved().at(-1)!.key).toBe("10:69");
  });
});

describe("failed media and late callbacks", () => {
  it("tries only remaining approved media, resets position, and terminates after exhaustion", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0);
    library.save({ ...first, position: 99, duration: 400 });
    const second = library.replace(first, [first.id], () => 0)!;
    expect(second).toMatchObject({ id: VLOGS[1].id, position: 0, duration: 0, sessionId: first.sessionId });
    const third = library.replace(second, [first.id, second.id], () => 0)!;
    expect(third.id).toBe(VLOGS[2].id);
    expect(library.replace(third, ids)).toBeNull();
    expect(library.open("10:1", { kind: "resume" }).id).toBe(third.id);
  });

  it("ignores progress from a player that was replaced after a rejection", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0);
    const replacement = library.replace(first, [first.id], () => 0)!;
    expect(library.save({ ...first, position: 200, duration: 400 })).toBe(false);
    expect(library.current(first)).toBe(false);
    expect(library.current(replacement)).toBe(true);
    expect(library.open("10:1", { kind: "resume" })).toMatchObject({ id: replacement.id, position: 0 });
  });

  it("refuses to replace a session that is no longer current", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0);
    library.replace(first, [first.id], () => 0);
    expect(library.replace(first, [first.id])).toBeNull();
  });

  it("ignores a late callback from the previous page load once the session was reopened", () => {
    const { library } = setup();
    const first = library.open("10:1", { kind: "new" }, () => 0);
    const reopened = library.open("10:1", { kind: "session", sessionId: first.sessionId });
    expect(library.save({ ...first, position: 300, duration: 400 })).toBe(false);
    expect(library.save({ ...reopened, position: 12, duration: 400 })).toBe(true);
    expect(library.open("10:1", { kind: "resume" }).position).toBe(12);
  });

  it("ignores a late callback from a session superseded by a new viewing of the same episode", () => {
    const { library } = setup();
    const old = library.open("10:1", { kind: "new" }, () => 0);
    const fresh = library.open("10:1", { kind: "new" }, () => 0.5);
    expect(library.save({ ...old, position: 90, duration: 400 })).toBe(false);
    expect(library.open("10:1", { kind: "resume" })).toMatchObject({ sessionId: fresh.sessionId, position: 0 });
  });

  it("rejects non-finite or negative samples without touching the saved position", () => {
    const { library } = setup();
    const session = library.open("10:1", { kind: "new" }, () => 0);
    library.save({ ...session, position: 20, duration: 100 });
    for (const bad of [{ position: Number.NaN }, { position: -1 }, { duration: Number.POSITIVE_INFINITY }, { duration: -5 }]) expect(library.save({ ...session, position: 30, duration: 100, ...bad })).toBe(false);
    expect(library.open("10:1", { kind: "resume" }).position).toBe(20);
  });
});
