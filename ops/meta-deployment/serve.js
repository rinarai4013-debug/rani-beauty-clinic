const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "3006", 10);
const DIR = __dirname;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".md": "text/plain",
  ".py": "text/plain",
};

http
  .createServer((req, res) => {
    let url = req.url.split("?")[0];
    if (url === "/") url = "/dashboard.html";
    const file = path.join(DIR, url);
    const ext = path.extname(file);
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`Dashboard at http://localhost:${PORT}`));
