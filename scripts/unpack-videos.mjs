import fs from 'node:fs';
import path from 'node:path';

const assets = [
  ['scripts/assets/startup.mp4.b64', 'public/videos/startup.mp4'],
  ['scripts/assets/whats-new.mp4.b64', 'public/videos/whats-new.mp4'],
];

for (const [src, dest] of assets) {
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const b64 = fs.readFileSync(src, 'utf8').trim();
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
}
