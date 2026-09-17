const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname);
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript"
};

function serve(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(400);
    response.end("Invalid path");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "Not found" : "Unable to read file");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  http.createServer(serve).listen(port, () => {
    process.stdout.write(`Career matcher running at http://localhost:${port}\n`);
  });
}

module.exports = { serve };
