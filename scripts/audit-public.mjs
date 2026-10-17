import fs from 'node:fs';
import path from 'node:path';
const deniedPath = /(^|\/)(\.git|\.vercel|sandbox)(\/|$)|^src\/server\/|^src\/lib\/(extensions|cloud|sync)\/|^src\/lib\/repositories\/(?!types\.ts$)|^src\/features\/sources\/|^src\/app\/api\/(?!version\/|health\/)/;
const deniedText = /hianime|justanime|voiranime|anime-sama|animeheaven|PLAYBACK_RELAY_SECRET|SUPABASE_SERVICE_ROLE|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}/i;
const retiredMedia = /(^public\/demo-media\/|^scripts\/generate-portfolio-media\.mjs$|^src\/features\/player\/VideoPlayer\.tsx$)/;
const failures = [];
let count = 0;
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // The public repository's own Git database is normal after cloning.
    // Nested/copied histories remain rejected below.
    if (dir === '.' && entry.name === '.git' && entry.isDirectory()) continue;
    if (['node_modules', '.next'].includes(entry.name)) continue;
    const file = path.posix.join(dir === '.' ? '' : dir, entry.name);
    if (!entry.isDirectory() && (deniedPath.test(file) || retiredMedia.test(file) || /^\.env(?!\.example$)/.test(file))) failures.push(file);
    if (entry.isDirectory() && ['.git', '.vercel', 'sandbox'].includes(entry.name)) failures.push(file);
    if (entry.isSymbolicLink()) { failures.push(`symlink: ${file}`); continue; }
    if (entry.isDirectory()) { scan(file); continue; }
    count++;
    if (file !== 'scripts/audit-public.mjs' && /\.(ts|tsx|js|mjs|json|md|yml|yaml|template)$/.test(file) && deniedText.test(fs.readFileSync(file, 'utf8'))) failures.push(`content: ${file}`);
  }
}
scan('.');
if (process.argv.includes('--build')) {
  const manifest = JSON.parse(fs.readFileSync('.next/server/app-paths-manifest.json', 'utf8'));
  const routes = Object.keys(manifest).filter(route => route.startsWith('/api/'));
  for (const route of routes) if (!['/api/health/route', '/api/version/route'].includes(route)) failures.push(`compiled route: ${route}`);
  const inspect = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (/\.(js|json)$/.test(file) && deniedText.test(fs.readFileSync(file, 'utf8'))) failures.push(`compiled content: ${file}`);
    }
  };
  inspect('.next/static'); inspect('.next/server');
  console.log(`Compiled API allowlist: ${routes.join(', ')}`);
}
if (failures.length) throw Error(`Public export rejected:\n${failures.join('\n')}`);
console.log(`PASS: ${count} files; private path/name/credential checks. Also inspect compiled routes and bundles after build.`);
