/**
 * Where the subject of a picture is, so the phone frame crops AROUND it instead of around a fixed point. Pure (no imports, no DOM):
 * it reads a small downscaled grid of the picture.
 *
 * "Subject" is detail: the places where luminance changes (faces, hair, eyes, linework) and colour is saturated count; flat sky,
 * walls and pipes do not. The frame shows only a window of the picture (the share it can hold) and only the upper part of that
 * window stays at full strength (the rest dissolves), so the window is chosen to put the most detail inside that opaque part.
 */
export interface PixelGrid { width: number; height: number; data: ArrayLike<number> }

/** Offsets as the CSS `object-position` wants them: 0 = the picture's start edge sits at the frame's start edge, 1 = its end edge does. */
export interface Focus { x: number; y: number }

export interface FocusWindow {
  /** Share of the picture's width / height the frame can show (1 = all of it). */
  visibleX: number;
  visibleY: number;
  /** Share of the window's height that stays at full strength before the dissolve begins. */
  opaque: number;
}

const luma = (d: ArrayLike<number>, i: number) => 0.2126 * d[i]! + 0.7152 * d[i + 1]! + 0.0722 * d[i + 2]!;

/** Detail weight of every cell: gradient magnitude + a share of saturation. */
export function detailMap(grid: PixelGrid): Float32Array {
  const { width: w, height: h, data } = grid;
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const gx = luma(data, i + 4) - luma(data, i - 4);
      const gy = luma(data, i + w * 4) - luma(data, i - w * 4);
      const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
      out[y * w + x] = Math.hypot(gx, gy) + 0.35 * (Math.max(r, g, b) - Math.min(r, g, b));
    }
  }
  return out;
}

/** The window position (in `object-position` terms) holding the most detail in its opaque part. A mild pull to the centre breaks ties. */
export function findFocus(grid: PixelGrid, win: FocusWindow): Focus {
  const { width: w, height: h } = grid;
  const map = detailMap(grid);
  // Summed-area table, so any window sum is four lookups.
  const sat = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += map[y * w + x]!;
      sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1]! + row;
    }
  }
  const sum = (x0: number, y0: number, x1: number, y1: number) => sat[y1 * (w + 1) + x1]! - sat[y0 * (w + 1) + x1]! - sat[y1 * (w + 1) + x0]! + sat[y0 * (w + 1) + x0]!;
  const vw = Math.max(1, Math.round(w * Math.min(1, win.visibleX)));
  const vh = Math.max(1, Math.round(h * Math.min(1, win.visibleY)));
  const oh = Math.max(1, Math.round(vh * Math.min(1, Math.max(0.3, win.opaque))));
  const slackX = w - vw, slackY = h - vh;
  let best = { x: slackX / 2, y: slackY / 2, score: -1 };
  for (let oy = 0; oy <= slackY; oy++) {
    for (let ox = 0; ox <= slackX; ox++) {
      const raw = sum(ox, oy, ox + vw, oy + oh);
      const away = Math.hypot(slackX ? (ox - slackX / 2) / (slackX / 2) : 0, slackY ? (oy - slackY / 2) / (slackY / 2) : 0);
      const score = raw * (1 - 0.06 * Math.min(1, away)) - away * 1e-6;   // equal detail (or none): the window closest to the centre
      if (score > best.score) best = { x: ox, y: oy, score };
    }
  }
  return { x: slackX > 0 ? best.x / slackX : 0.5, y: slackY > 0 ? best.y / slackY : 0.5 };
}

const cache = new WeakMap<PixelGrid, Map<string, Focus>>();
/** `findFocus`, remembered per grid and window: the page asks again on every render, the scan is done once. */
export function focusOf(grid: PixelGrid, win: FocusWindow): Focus {
  const key = `${win.visibleX.toFixed(3)}|${win.visibleY.toFixed(3)}|${win.opaque.toFixed(2)}`;
  const per = cache.get(grid) ?? new Map<string, Focus>();
  cache.set(grid, per);
  const known = per.get(key);
  if (known) return known;
  const found = findFocus(grid, win);
  per.set(key, found);
  return found;
}
