/**
 * Generates every raster and vector icon from one geometric definition, so the
 * favicon, PWA icons and standalone logo can never drift apart.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * The mark is a Rub' el Hizb (۞) — the eight-pointed star that divides the
 * Quran into quarters — built as two overlapping squares with softened joints.
 * No external dependencies: PNGs are encoded with Node's own zlib, and the ICO
 * is a container around those PNGs.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Brand constants (keep in sync with src/app/globals.css and docs/BRAND.md)
// ---------------------------------------------------------------------------

const COLORS = {
  brand100: "#D3ECE0",
  brand400: "#45A57F",
  brand500: "#2A8A66",
  brand600: "#1E6E51",
  brand700: "#1A5842",
  brand900: "#12382C",
  brand950: "#0A231B",
  accent300: "#E3C37C",
  accent500: "#C4913A",
  white: "#FFFFFF",
};

const SIZE = 512; // design grid
const CENTER = SIZE / 2;
const OUTER_R = 224; // star tip radius — leaves a 32px safe margin
// Where the two squares' edges cross: r/R = 2·sin(22.5°) ≈ 0.7654.
const INNER_RATIO = 2 * Math.sin(Math.PI / 8);
const INNER_R = OUTER_R * INNER_RATIO;
const TIP_ROUND = 12; // fillet at the eight points
const VALLEY_ROUND = 10; // fillet in the eight valleys
const HOLE_R = 44; // the circular void at the centre of ۞

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** The 16 alternating vertices of the octagram, before any rounding. */
function starVertices() {
  const points = [];
  for (let i = 0; i < 16; i++) {
    const isTip = i % 2 === 0;
    const radius = isTip ? OUTER_R : INNER_R;
    // Start at -90° so a tip points straight up.
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    points.push({
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
      round: isTip ? TIP_ROUND : VALLEY_ROUND,
    });
  }
  return points;
}

/**
 * Rounds every corner with a quadratic Bézier whose control point is the
 * original vertex. Returns the corner data so the SVG path and the rasteriser
 * can be built from exactly the same curve.
 */
function roundedCorners(points) {
  const len = points.length;
  return points.map((vertex, i) => {
    const prev = points[(i - 1 + len) % len];
    const next = points[(i + 1) % len];

    const toPrev = normalize(prev.x - vertex.x, prev.y - vertex.y);
    const toNext = normalize(next.x - vertex.x, next.y - vertex.y);

    return {
      start: { x: vertex.x + toPrev.x * vertex.round, y: vertex.y + toPrev.y * vertex.round },
      control: { x: vertex.x, y: vertex.y },
      end: { x: vertex.x + toNext.x * vertex.round, y: vertex.y + toNext.y * vertex.round },
    };
  });
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

const CORNERS = roundedCorners(starVertices());

function svgPath() {
  const parts = CORNERS.map((corner, i) => {
    const move = i === 0 ? `M${round(corner.start)}` : `L${round(corner.start)}`;
    return `${move} Q${round(corner.control)} ${round(corner.end)}`;
  });
  return `${parts.join(" ")} Z`;
}

const round = (p) => `${+p.x.toFixed(2)} ${+p.y.toFixed(2)}`;

/** Flattens the same curves into a polygon for the rasteriser. */
function flattenedPolygon(stepsPerCorner = 14) {
  const polygon = [];
  for (const { start, control, end } of CORNERS) {
    for (let s = 0; s <= stepsPerCorner; s++) {
      const t = s / stepsPerCorner;
      const inv = 1 - t;
      polygon.push({
        x: inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
        y: inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y,
      });
    }
  }
  return polygon;
}

const POLYGON = flattenedPolygon();

function insideStar(x, y) {
  let inside = false;
  for (let i = 0, j = POLYGON.length - 1; i < POLYGON.length; j = i++) {
    const a = POLYGON[i];
    const b = POLYGON[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

// ---------------------------------------------------------------------------
// SVG
// ---------------------------------------------------------------------------

const PATH = svgPath();

function markSvg({ gradient, flat, background, holeColor }) {
  const fill = gradient ? "url(#itqan)" : flat;
  const defs = gradient
    ? `\n  <defs>\n    <linearGradient id="itqan" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="${gradient[0]}"/>\n      <stop offset="1" stop-color="${gradient[1]}"/>\n    </linearGradient>\n  </defs>`
    : "";
  const bg = background
    ? `\n  <rect width="${SIZE}" height="${SIZE}" rx="112" fill="${background}"/>`
    : "";
  // A filled dot reads better than a transparent hole when the mark sits on a
  // coloured tile; otherwise the hole is punched out with even-odd fill.
  const hole = holeColor
    ? `\n  <circle cx="${CENTER}" cy="${CENTER}" r="${HOLE_R}" fill="${holeColor}"/>`
    : "";
  const rule = holeColor ? "" : ` fill-rule="evenodd"`;
  const holePath = holeColor ? "" : holeSubpath();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Itqan Academy">${defs}${bg}
  <path d="${PATH}${holePath}"${rule} fill="${fill}"/>${hole}
</svg>
`;
}

/**
 * Horizontal lockup: mark plus wordmark. The text stays live rather than being
 * converted to outlines, so these files need Cairo (and Amiri for the Arabic
 * wordmark) available — inside the app the web fonts are already loaded.
 */
function lockupSvg({ dir, name, tagline, family, nameSize, color, muted }) {
  const width = 460;
  const height = 120;
  const markSize = 76;
  const rtl = dir === "rtl";

  const markX = rtl ? width - markSize - 8 : 8;
  const textX = rtl ? width - markSize - 28 : markSize + 28;
  const anchor = rtl ? "end" : "start";
  const scale = markSize / SIZE;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="itqan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.brand400}"/>
      <stop offset="1" stop-color="${COLORS.brand700}"/>
    </linearGradient>
  </defs>
  <g transform="translate(${markX} ${(height - markSize) / 2}) scale(${+scale.toFixed(5)})">
    <path d="${PATH}${holeSubpath()}" fill-rule="evenodd" fill="url(#itqan)"/>
  </g>
  <text x="${textX}" y="62" text-anchor="${anchor}" direction="${dir}"
        font-family="${family}" font-size="${nameSize}" font-weight="700" fill="${color}">${name}</text>
  <text x="${textX}" y="88" text-anchor="${anchor}" direction="${dir}"
        font-family="Cairo, 'Segoe UI', system-ui, sans-serif" font-size="16" fill="${muted}">${tagline}</text>
</svg>
`;
}

function holeSubpath() {
  return ` M${CENTER} ${CENTER - HOLE_R} A${HOLE_R} ${HOLE_R} 0 1 0 ${CENTER} ${CENTER + HOLE_R} A${HOLE_R} ${HOLE_R} 0 1 0 ${CENTER} ${CENTER - HOLE_R} Z`;
}

// ---------------------------------------------------------------------------
// PNG encoding (no dependencies)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // One filter byte (0 = None) per scanline.
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const from = y * width * 4;
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, from, from + width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Rasteriser
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const SAMPLES = 3; // 3×3 supersampling

/**
 * Draws the mark at an arbitrary size. `background` null means transparent,
 * which suits the favicon; the PWA and Apple icons need an opaque tile.
 */
function renderMark(size, { gradient, background, holeColor, padding = 0 }) {
  const [g0, g1] = gradient.map(hexToRgb);
  const bg = background ? hexToRgb(background) : null;
  const hole = holeColor ? hexToRgb(holeColor) : null;
  const scale = SIZE / size;
  const inset = padding * SIZE;
  const shapeScale = (SIZE - 2 * inset) / SIZE;

  const rgba = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let coverage = 0;
      let holeCoverage = 0;

      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          // Sample position in the 512-unit design grid.
          const dx = (px + (sx + 0.5) / SAMPLES) * scale;
          const dy = (py + (sy + 0.5) / SAMPLES) * scale;
          // Undo the padding scale so the star shrinks inside the tile.
          const gx = CENTER + (dx - CENTER) / shapeScale;
          const gy = CENTER + (dy - CENTER) / shapeScale;

          if (insideStar(gx, gy)) {
            coverage++;
            if (Math.hypot(gx - CENTER, gy - CENTER) <= HOLE_R) holeCoverage++;
          }
        }
      }

      const total = SAMPLES * SAMPLES;
      const alpha = coverage / total;
      const holeAlpha = holeCoverage / total;
      const offset = (py * size + px) * 4;

      // Diagonal gradient across the tile.
      const t = (px + py) / (2 * size);
      const star = [0, 1, 2].map((i) => Math.round(g0[i] + (g1[i] - g0[i]) * t));

      let color = star;
      let outAlpha = alpha;

      if (hole && holeAlpha > 0) {
        color = [0, 1, 2].map((i) =>
          Math.round(star[i] * (1 - holeAlpha) + hole[i] * holeAlpha),
        );
      } else if (!hole && holeAlpha > 0) {
        outAlpha = alpha - holeAlpha; // punch the void straight through
      }

      if (bg) {
        const blended = [0, 1, 2].map((i) =>
          Math.round(bg[i] * (1 - outAlpha) + color[i] * outAlpha),
        );
        rgba[offset] = blended[0];
        rgba[offset + 1] = blended[1];
        rgba[offset + 2] = blended[2];
        rgba[offset + 3] = 255;
      } else {
        rgba[offset] = color[0];
        rgba[offset + 1] = color[1];
        rgba[offset + 2] = color[2];
        rgba[offset + 3] = Math.round(outAlpha * 255);
      }
    }
  }

  return encodePng(size, size, rgba);
}

// ---------------------------------------------------------------------------
// ICO container (each entry is a whole PNG)
// ---------------------------------------------------------------------------

function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = header.length + directory.length;

  entries.forEach((entry, i) => {
    const at = i * 16;
    directory[at] = entry.size >= 256 ? 0 : entry.size;
    directory[at + 1] = entry.size >= 256 ? 0 : entry.size;
    directory[at + 2] = 0; // palette
    directory[at + 3] = 0; // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(entry.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function write(relativePath, contents) {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  const kb = (contents.length / 1024).toFixed(1);
  console.log(`  ${relativePath.padEnd(34)} ${kb.padStart(7)} KB`);
}

console.log("Itqan Academy — brand assets\n");

// Vector
write(
  "public/brand/mark.svg",
  markSvg({ gradient: [COLORS.brand400, COLORS.brand700] }),
);
write("public/brand/mark-light.svg", markSvg({ flat: COLORS.white }));
write("public/brand/mark-ink.svg", markSvg({ flat: COLORS.brand900 }));
write(
  "public/brand/mark-tile.svg",
  markSvg({
    gradient: [COLORS.brand100, COLORS.brand400],
    background: COLORS.brand950,
    holeColor: COLORS.brand950,
  }),
);
write(
  "public/brand/lockup-ar.svg",
  lockupSvg({
    dir: "rtl",
    name: "أكاديمية إتقان",
    tagline: "منصة إدارة حلقات القرآن الكريم",
    family: "Amiri, Cairo, 'Segoe UI', serif",
    nameSize: 34,
    color: COLORS.brand900,
    muted: "#5A6E66",
  }),
);
write(
  "public/brand/lockup-en.svg",
  lockupSvg({
    dir: "ltr",
    name: "Itqan Academy",
    tagline: "Quran circles management platform",
    family: "Cairo, 'Segoe UI', system-ui, sans-serif",
    nameSize: 30,
    color: COLORS.brand900,
    muted: "#5A6E66",
  }),
);

// Favicon: brighter gradient so it survives both light and dark browser chrome.
write(
  "src/app/icon.svg",
  markSvg({ gradient: [COLORS.brand400, COLORS.brand600] }),
);

// Raster
const faviconGradient = [COLORS.brand400, COLORS.brand600];
const tile = {
  gradient: [COLORS.brand100, COLORS.brand400],
  background: COLORS.brand950,
  holeColor: COLORS.brand950,
  padding: 0.12,
};

write("public/icon-192.png", renderMark(192, tile));
write("public/icon-512.png", renderMark(512, tile));
write("src/app/apple-icon.png", renderMark(180, tile));

const ico = [16, 32, 48].map((size) => ({
  size,
  png: renderMark(size, { gradient: faviconGradient }),
}));
write("src/app/favicon.ico", encodeIco(ico));

console.log("\nDone.");
