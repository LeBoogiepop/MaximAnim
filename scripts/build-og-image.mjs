// Builds public/og.png (link-preview image) from the README's own English captures,
// so the preview never shows a screen that differs from what the app really renders.
// Usage: node scripts/build-og-image.mjs
import sharp from "sharp";

const SIZE = { width: 1200, height: 630 };
const PHONE_HEIGHT = 560;
const GAP = 36;
const BACKGROUND = "#000000"; // the app's own ground colour
const SCREENS = ["home", "anime", "player"];

const phones = await Promise.all(
  SCREENS.map(name => sharp(`docs/images/${name}.webp`).resize({ height: PHONE_HEIGHT }).png().toBuffer({ resolveWithObject: true })),
);
const rowWidth = phones.reduce((sum, { info }) => sum + info.width, 0) + GAP * (phones.length - 1);
let left = Math.round((SIZE.width - rowWidth) / 2);
const top = Math.round((SIZE.height - PHONE_HEIGHT) / 2);
const layers = phones.map(({ data, info }) => {
  const layer = { input: data, left, top };
  left += info.width + GAP;
  return layer;
});

await sharp({ create: { ...SIZE, channels: 3, background: BACKGROUND } })
  .composite(layers)
  .png({ compressionLevel: 9, palette: false })
  .toFile("public/og.png");
console.log(`public/og.png ${SIZE.width}x${SIZE.height}`);
