const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. Read source image
const srcBuf = fs.readFileSync(path.join(__dirname, '../frontend/public/brand-logo.png'));

// Parse PNG chunks
let pos = 8;
const chunks = [];
while (pos < srcBuf.length) {
  const len = srcBuf.readUInt32BE(pos);
  const type = srcBuf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') {
    chunks.push(srcBuf.subarray(pos + 8, pos + 8 + len));
  }
  pos += 12 + len;
}

const raw = zlib.inflateSync(Buffer.concat(chunks));
const srcW = 1024;
const srcH = 660;
const bpp = 4;

// Defilter PNG (all scanlines in this PNG use Filter 2: Up)
const defiltered = Buffer.alloc(srcW * srcH * bpp);
for (let y = 0; y < srcH; y++) {
  const rowStart = y * (1 + srcW * bpp);
  const filter = raw[rowStart];
  for (let x = 0; x < srcW * bpp; x++) {
    const rawVal = raw[rowStart + 1 + x];
    let prior = 0;
    if (filter === 1) {
      prior = x >= bpp ? defiltered[y * srcW * bpp + x - bpp] : 0;
    } else if (filter === 2) {
      prior = y > 0 ? defiltered[(y - 1) * srcW * bpp + x] : 0;
    }
    defiltered[y * srcW * bpp + x] = (rawVal + prior) & 0xFF;
  }
}

// Helper to get pixel from defiltered buffer
function getSrcPixel(x, y) {
  if (x < 0 || x >= srcW || y < 0 || y >= srcH) {
    return [0, 0, 0, 255];
  }
  const idx = (y * srcW + x) * 4;
  return [
    defiltered[idx],
    defiltered[idx + 1],
    defiltered[idx + 2],
    defiltered[idx + 3]
  ];
}

// Bilinear interpolation for smooth sampling
function sampleSrc(fx, fy) {
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(srcW - 1, x0 + 1);
  const y1 = Math.min(srcH - 1, y0 + 1);
  const wx = fx - x0;
  const wy = fy - y0;

  const p00 = getSrcPixel(x0, y0);
  const p10 = getSrcPixel(x1, y0);
  const p01 = getSrcPixel(x0, y1);
  const p11 = getSrcPixel(x1, y1);

  const out = [0, 0, 0, 255];
  for (let c = 0; c < 3; c++) {
    const top = p00[c] * (1 - wx) + p10[c] * wx;
    const btm = p01[c] * (1 - wx) + p11[c] * wx;
    out[c] = Math.round(top * (1 - wy) + btm * wy);
  }
  return out;
}

// 2. Generate target square image (512 x 512)
const targetSize = 512;
// Text center in src is (511.5, 383). Text width is 722.
// Target text width = 450 (fills ~88% of width, leaving ~31px margin on left and right)
const targetTextWidth = 450;
const scale = targetTextWidth / 722;

const srcCenterX = 511.5;
const srcCenterY = 383;
const targetCenterX = targetSize / 2;
const targetCenterY = targetSize / 2;

// Create raw scanline buffer for target: each row has 1 filter byte (0) + targetSize * 4
const rawTarget = Buffer.alloc(targetSize * (1 + targetSize * 4));

for (let y = 0; y < targetSize; y++) {
  const rowStart = y * (1 + targetSize * 4);
  rawTarget[rowStart] = 0; // Filter None

  for (let x = 0; x < targetSize; x++) {
    const fx = srcCenterX + (x - targetCenterX) / scale;
    const fy = srcCenterY + (y - targetCenterY) / scale;

    const pixel = sampleSrc(fx, fy);
    const pIdx = rowStart + 1 + x * 4;
    rawTarget[pIdx] = pixel[0];     // R
    rawTarget[pIdx + 1] = pixel[1]; // G
    rawTarget[pIdx + 2] = pixel[2]; // B
    rawTarget[pIdx + 3] = 255;      // A
  }
}

// 3. PNG Chunk encoding
function crc32(buf) {
  let c = ~0;
  for (let b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function makeChunk(type, data) {
  const tBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const payload = Buffer.concat([tBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([len, payload, crc]);
}

const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(targetSize, 0);
ihdr.writeUInt32BE(targetSize, 4);
ihdr[8] = 8;
ihdr[9] = 6; // RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idatData = zlib.deflateSync(rawTarget, { level: 9 });

const pngBuffer = Buffer.concat([
  pngSig,
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', idatData),
  makeChunk('IEND', Buffer.alloc(0))
]);

// Write favicon.png and apple-touch-icon.png
const publicDir = path.join(__dirname, '../frontend/public');
fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffer);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffer);

// Write favicon.ico
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);

const icoDirEntry = Buffer.alloc(16);
icoDirEntry[0] = 0;
icoDirEntry[1] = 0;
icoDirEntry[2] = 0;
icoDirEntry[3] = 0;
icoDirEntry.writeUInt16LE(1, 4);
icoDirEntry.writeUInt16LE(32, 6);
icoDirEntry.writeUInt32LE(pngBuffer.length, 8);
icoDirEntry.writeUInt32LE(22, 12);

const icoBuffer = Buffer.concat([icoHeader, icoDirEntry, pngBuffer]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

// Write SVG favicon with embedded high-res PNG
const base64Png = pngBuffer.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#000000" rx="80" />
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>
`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('All favicon formats generated successfully!');
