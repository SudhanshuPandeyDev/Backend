// Basic HTTP Server with Custom Routes in Node.js

const http = require("http");
const hostname = "127.0.0.1"; // localhost
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Do you want to open our webpage ? use /open734");
  } else if (req.url === "/open734") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("734 is opened");
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("404 Not found");
  }
});

server.listen(port, hostname, () => {
  console.log(`server is listening at http://${hostname}:${port}`);
});
