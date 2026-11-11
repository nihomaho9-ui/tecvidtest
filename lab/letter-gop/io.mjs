import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(here, "../..");
export const LAB = path.resolve(here, "../../..");

export function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
}
export function appendJsonl(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(obj) + "\n");
}
export function log(...a) {
  const ts = new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Riyadh" });
  fs.writeSync(1, `[${ts} Asia/Riyadh] ` + a.map(String).join(" ") + "\n");
}
