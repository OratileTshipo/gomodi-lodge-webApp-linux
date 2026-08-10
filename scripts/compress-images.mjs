// One-shot image compression for 3G delivery.
// Re-encodes every JPEG under public/images at quality 72 (mozjpeg),
// strips metadata, and caps the longest edge at 1600px. Safe to re-run.
import { readdirSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "public/images");
const MAX_EDGE = 1600;
const QUALITY = 72;

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".jpg", ".jpeg"].includes(extname(p).toLowerCase())) files.push(p);
  }
}
walk(DIR);

let totalBefore = 0;
let totalAfter = 0;
let errors = 0;

for (const f of files) {
  const before = statSync(f).size;
  totalBefore += before;
  try {
    const img = sharp(f, { failOn: "none" });
    const meta = await img.metadata();
    const longEdge = Math.max(meta.width || 0, meta.height || 0);
    let out = img;
    if (longEdge > MAX_EDGE) out = out.resize({ width: MAX_EDGE, withoutEnlargement: true });
    const buf = await out.jpeg({ quality: QUALITY, mozjpeg: true, progressive: true }).toBuffer();
    await import("fs/promises").then((fs) => fs.writeFile(f, buf));
    const after = buf.length;
    totalAfter += after;
    const pct = ((1 - after / before) * 100).toFixed(0);
    console.log(`${pct.padStart(3)}%  ${(before / 1024).toFixed(0).padStart(5)}KB -> ${(after / 1024).toFixed(0).padStart(5)}KB  ${f.replace(ROOT, "")}`);
  } catch (e) {
    errors++;
    console.log(`ERR  ${f}: ${e.message}`);
  }
}

console.log("\n=== SUMMARY ===");
console.log(`Files: ${files.length} | Errors: ${errors}`);
console.log(`Total: ${(totalBefore / 1048576).toFixed(2)}MB -> ${(totalAfter / 1048576).toFixed(2)}MB  (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% smaller)`);
