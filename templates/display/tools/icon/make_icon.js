"use strict";
// My VSIX アイコン生成（セミオーダー）
// 使い方: node tools/icon/make_icon.js <ベース色> <モチーフ> <モチーフの色> [出力先]
//   ベース色: teal / indigo / green / plum / amber / charcoal（または #RRGGBB）
//   モチーフ: star / bolt / heart / bookmark / check / note / leaf / gear
//   モチーフの色: white / amber / sky / pink（または #RRGGBB）
//   出力先: 省略時は icon.png
// 純 Node（標準ライブラリのみ）で PNG を生成する。依存なし・通信なし。
const zlib = require("zlib");
const fs = require("fs");

const PALETTE = {
  teal: "#0D8F9F",
  indigo: "#3E4FA3",
  green: "#3E8E5A",
  plum: "#7A4E8C",
  amber: "#C77F2A",
  charcoal: "#3A3F44",
};
const INK = { white: "#FFFFFF", amber: "#E8B33D", sky: "#9ADBE8", pink: "#F5B8C9" };

const S = 512; // 描画サイズ（この4倍で描いて縮小し、縁をなめらかにする）
const OUT = 128; // VSIX のアイコンサイズ

function newBuf() { return new Float32Array(S * S * 4); }
function setPx(b, x, y, c) {
  const i = (y * S + x) * 4;
  const ia = c[3] / 255, oa = b[i + 3] / 255;
  const na = ia + oa * (1 - ia);
  if (na <= 0) return;
  b[i] = (c[0] * ia + b[i] * oa * (1 - ia)) / na;
  b[i + 1] = (c[1] * ia + b[i + 1] * oa * (1 - ia)) / na;
  b[i + 2] = (c[2] * ia + b[i + 2] * oa * (1 - ia)) / na;
  b[i + 3] = na * 255;
}
function fillWhere(b, color, test) {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (test(x + 0.5, y + 0.5)) setPx(b, x, y, color);
  }
}
function roundedRect(cx, cy, w, h, r) {
  return (x, y) => {
    const dx = Math.max(Math.abs(x - cx) - (w / 2 - r), 0);
    const dy = Math.max(Math.abs(y - cy) - (h / 2 - r), 0);
    return dx * dx + dy * dy <= r * r && Math.abs(x - cx) <= w / 2 && Math.abs(y - cy) <= h / 2;
  };
}
function circle(cx, cy, r) { return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r; }
function ring(cx, cy, rO, rI) { return (x, y) => { const d = (x - cx) ** 2 + (y - cy) ** 2; return d <= rO * rO && d >= rI * rI; }; }
function polygon(pts) {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}
function starPts(cx, cy, rO, rI, n, rot) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rO : rI, a = rot + (i * Math.PI) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

const C = S / 2;
const MOTIFS = {
  star: (b, ink, base) => fillWhere(b, ink, polygon(starPts(C, C, 150, 62, 5, -Math.PI / 2))),
  bolt: (b, ink) => fillWhere(b, ink, polygon([[286, 96], [176, 288], [246, 288], [218, 416], [340, 216], [268, 216]])),
  heart: (b, ink) => {
    fillWhere(b, ink, circle(196, 208, 62));
    fillWhere(b, ink, circle(316, 208, 62));
    fillWhere(b, ink, polygon([[140, 238], [372, 238], [256, 396]]));
  },
  bookmark: (b, ink, base) => {
    fillWhere(b, ink, roundedRect(C, C, 168, 264, 14));
    fillWhere(b, base, polygon([[212, 388], [300, 388], [256, 330]]));
  },
  check: (b, ink) => {
    fillWhere(b, ink, polygon([[150, 262], [224, 336], [366, 168], [404, 204], [224, 386], [114, 298]]));
  },
  note: (b, ink) => {
    fillWhere(b, ink, circle(196, 356, 50));
    fillWhere(b, ink, polygon([[238, 356], [238, 140], [358, 116], [358, 322], [316, 322], [316, 172], [238, 188]]));
    fillWhere(b, ink, circle(316, 322, 42));
  },
  leaf: (b, ink, base) => {
    const inLeaf = (x, y) => {
      const dx = (x - C) / 150, dy = (y - C) / 190;
      return dx * dx + dy * dy <= 1 && (x - C) * (y - C) <= 9000;
    };
    fillWhere(b, ink, inLeaf);
    fillWhere(b, base, polygon([[176, 360], [330, 160], [344, 172], [192, 372]]));
  },
  gear: (b, ink, base) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      fillWhere(b, ink, circle(C + 132 * Math.cos(a), C + 132 * Math.sin(a), 42));
    }
    fillWhere(b, ink, circle(C, C, 140));
    fillWhere(b, base, circle(C, C, 58));
  },
};

function hexToRgba(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
}
function downscale(b) {
  const out = Buffer.alloc(OUT * OUT * 4);
  const k = S / OUT;
  for (let y = 0; y < OUT; y++) for (let x = 0; x < OUT; x++) {
    let r = 0, g = 0, bl = 0, a = 0;
    for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
      const i = ((y * k + dy) * S + (x * k + dx)) * 4;
      r += b[i]; g += b[i + 1]; bl += b[i + 2]; a += b[i + 3];
    }
    const o = (y * OUT + x) * 4, n = k * k;
    out[o] = r / n; out[o + 1] = g / n; out[o + 2] = bl / n; out[o + 3] = a / n;
  }
  return out;
}
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(OUT, 0); ihdr.writeUInt32BE(OUT, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(OUT * (OUT * 4 + 1));
  for (let y = 0; y < OUT; y++) { raw[y * (OUT * 4 + 1)] = 0; rgba.copy(raw, y * (OUT * 4 + 1) + 1, y * OUT * 4, (y + 1) * OUT * 4); }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

function resolveColor(table, value, label) {
  if (!value) return null;
  if (value.startsWith("#") && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (table[value]) return table[value];
  console.error(`${label}は ${Object.keys(table).join(" / ")} から選ぶか、#RRGGBB で指定してください: ${value}`);
  process.exit(1);
}

function main() {
  const [baseArg, motifArg, inkArg, outArg] = process.argv.slice(2);
  const baseHex = resolveColor(PALETTE, baseArg, "ベース色");
  const inkHex = resolveColor(INK, inkArg, "モチーフの色");
  if (!baseHex || !inkHex || !MOTIFS[motifArg]) {
    console.error("使い方: node tools/icon/make_icon.js <ベース色> <モチーフ> <モチーフの色> [出力先]");
    console.error(`ベース色: ${Object.keys(PALETTE).join(" / ")}`);
    console.error(`モチーフ: ${Object.keys(MOTIFS).join(" / ")}`);
    console.error(`モチーフの色: ${Object.keys(INK).join(" / ")}`);
    process.exit(1);
  }
  const base = hexToRgba(baseHex), ink = hexToRgba(inkHex);
  const b = newBuf();
  fillWhere(b, base, roundedRect(C, C, S, S, S * 0.22));
  MOTIFS[motifArg](b, ink, base);
  const out = outArg || "icon.png";
  fs.writeFileSync(out, encodePNG(downscale(b)));
  console.log(`アイコンを生成しました: ${out}（ベース ${baseArg}／モチーフ ${motifArg}／モチーフの色 ${inkArg}）`);
}
main();
