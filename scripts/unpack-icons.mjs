import fs from 'node:fs';
import path from 'node:path';

/**
 * Unpacks the official SilentWatch App and Setup RGBA PNG icons from base64 text
 * assets and generates multi-resolution Windows .ico files (PNG-in-ICO format,
 * natively supported by Windows Vista/7/10/11, Tauri, and winresource).
 */
function readB64(relPath) {
  return Buffer.from(fs.readFileSync(relPath, 'utf8').trim(), 'base64');
}

function buildIcoFromPngs(entries) {
  const count = entries.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const parts = [];

  const dir = Buffer.alloc(headerSize);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(count, 4);

  entries.forEach(({ size, png }, idx) => {
    const pos = 6 + idx * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, pos);
    dir.writeUInt8(size >= 256 ? 0 : size, pos + 1);
    dir.writeUInt8(0, pos + 2);
    dir.writeUInt8(0, pos + 3);
    dir.writeUInt16LE(1, pos + 4);
    dir.writeUInt16LE(32, pos + 6);
    dir.writeUInt32LE(png.length, pos + 8);
    dir.writeUInt32LE(offset, pos + 12);
    offset += png.length;
    parts.push(png);
  });

  return Buffer.concat([dir, ...parts]);
}

const app32 = readB64('scripts/assets/app-icon-32.png.b64');
const app128 = readB64('scripts/assets/app-icon-128.png.b64');
const setup32 = readB64('scripts/assets/setup-icon-32.png.b64');
const setup128 = readB64('scripts/assets/setup-icon-128.png.b64');

const appIco = buildIcoFromPngs([
  { size: 32, png: app32 },
  { size: 128, png: app128 },
]);
const setupIco = buildIcoFromPngs([
  { size: 32, png: setup32 },
  { size: 128, png: setup128 },
]);

const writes = [
  ['src-tauri/icons/32x32.png', app32],
  ['src-tauri/icons/128x128.png', app128],
  ['src-tauri/icons/128x128@2x.png', app128],
  ['src-tauri/icons/icon.ico', appIco],
  ['src-tauri/icons/installer.ico', setupIco],
  ['crates/silentwatch-installer/assets/setup-icon.ico', setupIco],
  ['public/icons/app-logo.png', app128],
  ['public/icons/setup-logo.png', setup128],
];

for (const [dest, buf] of writes) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}
console.log('Unpacked official SilentWatch App & Setup icons (.png + .ico).');
