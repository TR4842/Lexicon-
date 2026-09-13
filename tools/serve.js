/* Tiny zero-dependency static server for local previews of the web app. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "app");
const PORT = Number(process.env.PORT || 8080);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") p = "/index.html";
    const file = path.join(ROOT, path.normalize(p).replace(/^([.][.][\/\\])+/, ""));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) {
        // SPA fallback
        return fs.readFile(path.join(ROOT, "index.html"), (e2, b2) => {
          if (e2) { res.writeHead(404); return res.end("not found"); }
          res.writeHead(200, { "Content-Type": MIME[".html"] });
          res.end(b2);
        });
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(buf);
    });
  })
  .listen(PORT, "0.0.0.0", () => console.log(`Vocab Ledger preview: http://0.0.0.0:${PORT}`));
