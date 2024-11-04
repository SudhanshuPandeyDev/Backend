// Simple HTTP Server with Routes Using Bun.js
// Bun doesn't officially support Windows yet so just see the code don't run

import { Serve } from "bun";
import { hostname } from "os";

serve({
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response("Hello ice tea", { status: 200 });
    } else if (url.pathname === "/ice-tea") {
      return new Response("Ice tea is a good option", { status: 200 });
    } else {
      return new Response("404 not found", { status: 404 });
    }
  },
  port: 3000,
  hostname: "127.0.0.1",
});
