// All graphics/text/audio are original. No downloaded footage or fonts beyond the app's OFL Archivo.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
const frames = path.resolve('.postrelease/media');
const out = path.resolve('public/demo-media');
fs.mkdirSync(frames, { recursive: true }); fs.mkdirSync(out, { recursive: true });
const scenes = [
  ['LE DERNIER BUG', 'Une histoire de 59 pixels', 'Un court métrage original de MaximAnim'],
  ['793', 'Tout était à sa place.', 'Enfin… presque.'],
  ['+59', 'Un scroll plus tard.', 'Le dock avait pris l’ascenseur.'],
  ['852', 'Le pixel a ses raisons.', 'Que le viewport ignore.'],
  ['À SUIVRE', 'Dans le prochain navigateur.', 'Démo originale · Aucun anime n’a été streamé.'],
];
for (const [i, [title, line, caption]] of scenes.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#080809"/><path d="M80 100H1200M80 620H1200" stroke="#303035"/><text x="80" y="155" font-family="sans-serif" font-size="22" letter-spacing="6" fill="#F2768D">MAXIMANIM / ORIGINAL</text><text x="80" y="355" font-family="sans-serif" font-weight="bold" font-size="${i===0?105:150}" fill="#F6F3EE">${title}</text><text x="84" y="435" font-family="sans-serif" font-size="42" fill="#F2768D">${line}</text><text x="84" y="505" font-family="sans-serif" font-size="25" fill="#C4C1BE">${caption}</text><rect x="1110" y="${i===1?515:574}" width="59" height="25" rx="4" fill="#F2768D"/><text x="80" y="665" font-family="sans-serif" font-size="18" fill="#99969D">${String(i+1).padStart(2,'0')} / 05</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(frames, `${i}.png`));
}
const common = ['-y', '-hide_banner', '-loglevel', 'error', ...scenes.flatMap((_, i) => ['-loop', '1', '-t', '4', '-i', path.join(frames, `${i}.png`)]), '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=48000:duration=20', '-filter_complex', `${scenes.map((_, i) => `[${i}:v]scale=960:540,fps=24,setsar=1,fade=t=in:st=0:d=0.2[v${i}]`).join(';')};${scenes.map((_,i)=>`[v${i}]`).join('')}concat=n=5:v=1:a=0[v];[5:a]volume=0.025,afade=t=in:d=1,afade=t=out:st=18:d=2[a]`, '-map', '[v]', '-map', '[a]', '-t', '20'];
for (const ext of ['mp4', 'webm']) {
  const codecs = ext === 'mp4' ? ['-c:v','libx264','-preset','veryfast','-crf','28','-pix_fmt','yuv420p','-c:a','aac','-b:a','48k','-movflags','+faststart'] : ['-c:v','libvpx-vp9','-b:v','0','-crf','38','-pix_fmt','yuv420p','-deadline','realtime','-cpu-used','8','-c:a','libopus','-b:a','32k'];
  const result = spawnSync('ffmpeg', [...common, ...codecs, path.join(out, `last-bug.${ext}`)], { stdio: 'inherit' });
  if (result.status !== 0) throw Error('ffmpeg generation failed');
}
console.log('Original 20-second HTML5 demo generated. Reproducible, no external footage.');
