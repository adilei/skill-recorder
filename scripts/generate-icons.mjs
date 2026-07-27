// Regenerate app icons from build/icon.svg — the single source of truth.
//   node scripts/generate-icons.mjs   (or: npm run icons)
//
// Produces, next to the SVG:
//   - icon.png  (1024x1024, shared master / Linux / fallback)
//   - icon.icns (macOS; requires `iconutil`, so this step is macOS-only)
//   - icon.ico  (Windows; multi-resolution, PNG-compressed entries)
//
// Only `sharp` (already a dependency) is required; the .ico is written directly
// so there is no extra icon-encoder dependency.
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = join(here, "..", "build");
const svgPath = join(buildDir, "icon.svg");
const svg = readFileSync(svgPath);

/** Rasterize the SVG crisply at an exact square size. */
const render = (size) =>
  sharp(svg, { density: 384 }).resize(size, size, { fit: "contain" }).png().toBuffer();

async function main() {
  // Master PNG.
  const png1024 = await render(1024);
  writeFileSync(join(buildDir, "icon.png"), png1024);
  console.log("wrote build/icon.png (1024x1024)");

  // Windows .ico — PNG-compressed entries (supported since Windows Vista).
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoPngs = await Promise.all(icoSizes.map(async (s) => ({ size: s, buf: await render(s) })));
  writeFileSync(join(buildDir, "icon.ico"), buildIco(icoPngs));
  console.log(`wrote build/icon.ico (${icoSizes.join(", ")})`);

  // macOS .icns — needs `iconutil`, which only exists on macOS.
  if (process.platform === "darwin") {
    const iconset = mkdtempSync(join(tmpdir(), "sr-iconset-")) + ".iconset";
    mkdirSync(iconset, { recursive: true });
    const variants = [
      ["icon_16x16.png", 16], ["icon_16x16@2x.png", 32],
      ["icon_32x32.png", 32], ["icon_32x32@2x.png", 64],
      ["icon_128x128.png", 128], ["icon_128x128@2x.png", 256],
      ["icon_256x256.png", 256], ["icon_256x256@2x.png", 512],
      ["icon_512x512.png", 512], ["icon_512x512@2x.png", 1024],
    ];
    for (const [name, size] of variants) {
      writeFileSync(join(iconset, name), size === 1024 ? png1024 : await render(size));
    }
    execFileSync("iconutil", ["-c", "icns", iconset, "-o", join(buildDir, "icon.icns")]);
    rmSync(iconset, { recursive: true, force: true });
    console.log("wrote build/icon.icns");
  } else {
    console.warn("skipped build/icon.icns (iconutil is macOS-only); commit it from a Mac");
  }
}

/** Assemble an .ico container from PNG buffers. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  const blobs = [];
  entries.forEach(({ size, buf }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e); // width (0 => 256)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1); // height (0 => 256)
    dir.writeUInt8(0, e + 2); // palette count
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(buf.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += buf.length;
    blobs.push(buf);
  });
  return Buffer.concat([header, dir, ...blobs]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
