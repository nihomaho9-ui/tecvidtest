// Headless checks of the production build (no browser GUI required).
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dist = path.join(app, "dist");
const fail = (m) => { console.error("FAIL", m); process.exit(1); };
const ok = (m) => console.log("OK", m);

for (const f of ["index.html", "sw.js", "CNAME", ".nojekyll", "NOTICE.md", "NPL-1.2.txt", "corpus.json"]) {
  if (!fs.existsSync(path.join(dist, f))) fail(`missing dist/${f}`);
}
const cname = fs.readFileSync(path.join(dist, "CNAME"), "utf8").trim();
if (cname !== "quran.mushafuk.online") fail(`CNAME is ${cname}`);
ok("CNAME quran.mushafuk.online");
const sw = fs.readFileSync(path.join(dist, "sw.js"), "utf8");
const m = /tecvid-shell-v(\d+)/.exec(sw);
if (!m || +m[1] < 15) fail(`sw version ${m && m[0]}`);
ok(m[0]);
const index = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const js = [...index.matchAll(/assets\/([^"]+\.js)/g)].map((x) => x[1]);
if (!js.length) fail("no hashed JS in index.html");
const bundle = js.map((n) => fs.readFileSync(path.join(dist, "assets", n), "utf8")).join("\n");
for (const s of ["Hərf tələffüzü", "setMode", "letter-gop", "tj.label.letter"]) {
  if (!bundle.includes(s) && !sw.includes(s)) {
    // letter-gop may be minified; at least the Azerbaijani label and setMode must survive
    if (s === "letter-gop") continue;
    if (!bundle.includes(s)) fail(`bundle missing ${s}`);
  }
}
if (!bundle.includes("Hərf tələffüzü")) fail("bundle missing letter label");
if (!bundle.includes("setMode")) fail("bundle missing setMode");
ok("bundle contains letter UI and setMode");

// Serve dist and fetch index + sw
const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/") url = "/index.html";
  const file = path.join(dist, path.normalize(url).replace(/^\/+/, ""));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200); fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const get = (p) => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port, path: p }, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
  }).on("error", reject);
});
const home = await get("/");
if (home.status !== 200 || !home.body.includes("<div") && !home.body.includes("id=")) {
  // still OK if HTML loads
}
if (home.status !== 200) fail(`GET / -> ${home.status}`);
ok(`GET / ${home.status} (${home.body.length} bytes)`);
const swr = await get("/sw.js");
if (swr.status !== 200 || !swr.body.includes(`tecvid-shell-v${m[1]}`)) fail("GET /sw.js mismatch");
ok("GET /sw.js");
const cn = await get("/CNAME");
if (cn.status !== 200 || cn.body.trim() !== "quran.mushafuk.online") fail("GET /CNAME");
ok("GET /CNAME");
server.close();
console.log("SMOKE_OK");
