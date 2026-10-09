import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const mod = await server.ssrLoadModule("/src/__preview.tsx");
const body = mod.renderPreview();

const assetsDir = path.join(root, "dist", "assets");
const cssFile = fs.readdirSync(assetsDir).find((file) => file.endsWith(".css"));
const css = fs.readFileSync(path.join(assetsDir, cssFile), "utf8");

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<title>preview</title>
<style>${css}</style>
<style>body { margin: 0; }</style>
</head>
<body>${body}
<script>
window.addEventListener("load", () => {
  const scrollW = document.documentElement.scrollWidth;
  const rows = ["innerWidth=" + window.innerWidth + " pageScrollW=" + scrollW];
  document.querySelectorAll("article[data-tank-type]").forEach((el, i) => {
    const svg = el.querySelector("svg");
    const r = el.getBoundingClientRect();
    const s = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
    rows.push(
      i + " type=" + el.dataset.tankType +
      " tile=" + Math.round(r.width) + "x" + Math.round(r.height) +
      " top=" + Math.round(r.top) + " left=" + Math.round(r.left) +
      " tank=" + Math.round(s.width) + "x" + Math.round(s.height) +
      " overflow=" + (el.scrollWidth > el.clientWidth)
    );
  });
  const pre = document.createElement("pre");
  pre.id = "metrics";
  pre.style.whiteSpace = "pre-wrap";
  pre.textContent = rows.join("\\n");
  document.body.appendChild(pre);
});
</script>
</body>
</html>`;

fs.writeFileSync(path.join(root, "__preview.html"), html);
await server.close();
console.log("preview written with", cssFile);
