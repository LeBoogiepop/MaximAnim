import { beforeEach, expect, it, vi } from "vitest";
import { chooseDemo, storeDemo, nextDemo, VLOGS } from "../src/lib/portfolio/demo";
beforeEach(() => localStorage.clear());
it("randomizes new playback once and restores the exact vlog and position, including legacy mode records", () => {
  const random = vi.fn(() => 0.8);
  const selected = chooseDemo("10:1", random);
  expect(selected.id).toBe(VLOGS[2].id);
  storeDemo({ ...selected, position: 123, duration: 875 });
  expect(chooseDemo("10:1", random)).toMatchObject({ id: selected.id, position: 123 });
  expect(random).toHaveBeenCalledOnce();
  const legacy = { ...selected, mode: "html5", position: 124, duration: 875 };
  localStorage.setItem("maximanim-portfolio:demo:v1", JSON.stringify([legacy]));
  expect(chooseDemo("10:1", random)).toMatchObject({ id: selected.id, position: 124 });
  expect(chooseDemo("10:1", random)).not.toHaveProperty("mode");
  expect(chooseDemo("10:2", () => 0).id).toBe(VLOGS[0].id);
});
it("rejects unknown videos and malformed saved positions", () => {
  localStorage.setItem("maximanim-portfolio:demo:v1", JSON.stringify([null, { key: "10:1", id: "foreign", position: 0, duration: 100 }, { key: "10:1", id: VLOGS[1].id, position: -1, duration: 100 }]));
  expect(chooseDemo("10:1", () => 0).id).toBe(VLOGS[0].id);
});
it("tries only remaining approved media, resets its position, and terminates after exhaustion", () => {
  const first = chooseDemo("10:1", () => 0);
  storeDemo({ ...first, position: 99, duration: 400 });
  const second = nextDemo(first, [first.id], () => 0)!;
  expect(second).toMatchObject({ id: VLOGS[1].id, position: 0, duration: 0 });
  expect(chooseDemo("10:1").id).toBe(second.id);
  const third = nextDemo(second, [first.id, second.id], () => 0)!;
  expect(third.id).toBe(VLOGS[2].id);
  expect(nextDemo(third, VLOGS.map(v => v.id))).toBeNull();
});
it("ignores a destroyed player's late progress after failover", () => {
  const first = chooseDemo("10:1", () => 0);
  const replacement = nextDemo(first, [first.id], () => 0)!;
  storeDemo({ ...first, position: 200, duration: 400 });
  expect(chooseDemo("10:1")).toMatchObject({ id: replacement.id, position: 0 });
});
it("keeps at most 64 episode selections", () => {
  for (let i = 0; i < 70; i++) chooseDemo(`10:${i}`, () => 0);
  expect(JSON.parse(localStorage.getItem("maximanim-portfolio:demo:v1")!)).toHaveLength(64);
});
