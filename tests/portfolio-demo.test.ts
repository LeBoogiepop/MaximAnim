import { beforeEach, expect, it, vi } from "vitest";
import { chooseDemo, storeDemo, setDemoMode, VLOGS } from "../src/lib/portfolio/demo";
beforeEach(() => localStorage.clear());
it("randomizes a new play intent once and restores its exact vlog/position across reloads", () => {
  const random = vi.fn(() => 0.8);
  const selected = chooseDemo("10:1", random);
  expect(selected.id).toBe(VLOGS[2].id);
  storeDemo({ ...selected, position: 123, duration: 875 });
  setDemoMode("10:1", "html5");
  storeDemo({ ...selected, position: 124, duration: 875 });
  expect(chooseDemo("10:1", random)).toMatchObject({ mode: "html5", position: 124 });
  setDemoMode("10:1", "youtube");
  storeDemo({ ...selected, position: 123, duration: 875 });
  expect(chooseDemo("10:1", random)).toMatchObject({ id: selected.id, position: 123 });
  expect(random).toHaveBeenCalledOnce();
  expect(chooseDemo("10:2", () => 0).id).toBe(VLOGS[0].id);
});
it("rejects unknown videos and malformed saved positions instead of embedding arbitrary ids", () => {
  localStorage.setItem("maximanim-portfolio:demo:v1", JSON.stringify([{ key: "10:1", id: "foreign", position: 0, duration: 100 }]));
  expect(chooseDemo("10:1", () => 0).id).toBe(VLOGS[0].id);
});
it("keeps at most 64 episode selections", () => {
  for (let i = 0; i < 70; i++) chooseDemo(`10:${i}`, () => 0);
  expect(JSON.parse(localStorage.getItem("maximanim-portfolio:demo:v1")!)).toHaveLength(64);
});
