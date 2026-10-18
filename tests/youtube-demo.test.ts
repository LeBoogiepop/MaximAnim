import { createElement } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { YoutubeDemo } from "../src/features/player/YoutubeDemo";
import type { DemoSession } from "../src/lib/portfolio/demo";

type PlayerConfig = { events: { onReady(): void; onStateChange(event: { data: number }): void; onError(event: { data: number }): void } };
const session: DemoSession = { key: "1:1", sessionId: "s", revision: "r", id: "p58g3idAiqc", title: "HOKKAIDO ROAD TRIP", position: 0, duration: 0, updatedAt: 0 };

// Like the real IFrame API: the object returned by `new YT.Player` has no methods until `onReady` fires.
function installPlayer() {
  const created: PlayerConfig[] = [];
  Object.assign(window, { YT: { Player: function (this: object, _element: HTMLElement, config: PlayerConfig) { created.push(config); } } });
  return created;
}

const uncaught: unknown[] = [];
const record = (event: ErrorEvent) => { uncaught.push(event.error); event.preventDefault(); };
window.addEventListener("error", record);

afterEach(() => { cleanup(); uncaught.length = 0; delete window.YT; });

describe("leaving the watch screen while the YouTube player is still loading", () => {
  it("does not throw from the effect cleanup (Next or Back right after opening an episode)", async () => {
    const created = installPlayer();
    const view = render(createElement(YoutubeDemo, { session, animeId: 1, episodeNumber: 1, onProgress: () => true }));
    await waitFor(() => expect(created).toHaveLength(1));
    expect(() => view.unmount()).not.toThrow();
    expect(uncaught).toEqual([]);
  });

  it("ignores a state change that arrives before the player is ready", async () => {
    const created = installPlayer();
    const view = render(createElement(YoutubeDemo, { session, animeId: 1, episodeNumber: 1, onProgress: () => true }));
    await waitFor(() => expect(created).toHaveLength(1));
    created[0]!.events.onStateChange({ data: 1 });
    view.unmount();
    expect(uncaught).toEqual([]);
  });
});
