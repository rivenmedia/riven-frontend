import { handler } from "./build/handler.js";
import http from "node:http";
import httpProxy from "http-proxy";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.BACKEND_API_KEY || process.env.RIVEN_SETTING__API_KEY;

if (!BACKEND_URL) {
    throw new Error("BACKEND_URL environment variable is required");
}
if (!API_KEY) {
    throw new Error("BACKEND_API_KEY or RIVEN_SETTING__API_KEY environment variable is required");
}

const proxy = httpProxy.createProxyServer({
    target: BACKEND_URL,
    ws: true,
    changeOrigin: true,
    xfwd: true
});

proxy.on("proxyReqWs", (proxyReq) => {
    proxyReq.setHeader("x-api-key", API_KEY);
    proxyReq.setHeader("authorization", `Bearer ${API_KEY}`);
});

proxy.on("error", (err, _req, resOrSocket) => {
    console.error("[ws-proxy] error:", err);
    if (resOrSocket && "destroy" in resOrSocket) resOrSocket.destroy();
});

const server = http.createServer((req, res) => handler(req, res));

server.on("upgrade", async (req, socket, head) => {
    if (!req.url || !req.url.startsWith("/graphql")) {
        socket.destroy();
        return;
    }

    try {
        const cookieHeader = req.headers.cookie ?? "";
        if (!cookieHeader) {
            socket.destroy();
            return;
        }
        const check = await fetch(`http://127.0.0.1:${PORT}/api/auth/get-session`, {
            headers: { cookie: cookieHeader }
        });
        if (!check.ok) {
            socket.destroy();
            return;
        }
        const body = await check.json().catch(() => null);
        if (!body || !body.user) {
            socket.destroy();
            return;
        }
    } catch (err) {
        console.error("[ws-proxy] session check failed:", err);
        socket.destroy();
        return;
    }

    proxy.ws(req, socket, head);
});

server.listen(PORT, HOST, () => {
    console.log(`riven-frontend listening on http://${HOST}:${PORT}`);
    console.log(`proxying /graphql (HTTP via SvelteKit, WS via http-proxy) -> ${BACKEND_URL}`);
});
