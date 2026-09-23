// Copies the static client build into ./www for Capacitor.
// Works with every build layout (dist/client, dist/public, .output/public).
import { existsSync, cpSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const candidates = ["dist/client", "dist/public", ".output/public"];
const src = candidates.find((c) => existsSync(c) && existsSync(resolve(c, "index.html")));

if (!src) {
  console.error(
    `No client build with index.html found. Looked in: ${candidates.join(", ")}. Run "npm run build" first.`
  );
  process.exit(1);
}

const dest = "www";
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });

const top = readdirSync(dest).join(", ");
console.log(`Copied ${src} -> ${dest} (${top})`);
