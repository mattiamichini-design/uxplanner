// Rasterizes app/icon.svg into the favicon set: favicon.ico, apple-icon.png and the manifest icons.
// Run after changing the mark: node scripts/generate-icons.mjs (sharp ships with next).
import fs from 'node:fs';
import sharp from 'sharp';

const svg = fs.readFileSync('src/app/icon.svg', 'utf8');
const path = svg.match(/<path[^>]* d="([^"]+)"/)[1];
const background = svg.match(/<rect[^>]* fill="([^"]+)"/)[1];

// The same tile as icon.svg with a different mark size (out of 480) and corner radius.
const tile = (markSize, radius) => {
  const offset = (480 - markSize) / 2;
  return `<svg width="32" height="32" viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg"><rect width="480" height="480" rx="${radius}" fill="${background}"/><path fill="#FFFFFF" transform="translate(${offset} ${offset}) scale(${markSize / 336})" d="${path}"/></svg>`;
};
// At 16px the standard padding leaves the mark 11px wide and its gaps blur; a tighter tile keeps them apart.
const small = tile(384, 72);
// Full bleed for surfaces that apply their own mask (iOS home screen, Android maskable icons).
// The mark covers 55% of the side so its corners stay inside the 80% maskable safe zone.
const fullBleed = tile(264, 0);

const png = (source, size, opaque = false) => {
  const image = sharp(Buffer.from(source), { density: 72 * (size / 32) * 4 }).resize(size, size);
  return (opaque ? image.removeAlpha() : image).png().toBuffer();
};

// ICO container with PNG payloads (supported by every browser that still asks for favicon.ico). Keeping 32px as
// the largest entry makes Next declare sizes="32x32", so Chrome still prefers icon.svg.
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

const favicon = ico([
  { size: 16, data: await png(small, 16) },
  { size: 32, data: await png(svg, 32) },
]);
const apple = await png(fullBleed, 180, true);

for (const app of ['src/app', 'site/app']) {
  fs.writeFileSync(`${app}/favicon.ico`, favicon);
  fs.writeFileSync(`${app}/apple-icon.png`, apple);
}

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.png', await png(svg, 192));
fs.writeFileSync('public/icons/icon-512.png', await png(svg, 512));
fs.writeFileSync('public/icons/icon-maskable-512.png', await png(fullBleed, 512, true));
