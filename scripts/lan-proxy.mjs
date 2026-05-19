#!/usr/bin/env node
/**
 * LAN proxy — forwards TCP connections from a LAN-facing port to
 * localhost:5179 (the claudex production server).  Supports both
 * plain HTTP and WebSocket upgrade because it operates at the raw
 * TCP byte-stream level.
 *
 * Usage:
 *   node scripts/lan-proxy.mjs [listen-port] [lan-ip]
 *   # defaults: listen-port=5179  lan-ip=auto-detected
 *
 * The production server must already be running on 127.0.0.1:5179.
 */
import net from "node:net";

const LISTEN_PORT = Number(process.argv[2] ?? 5178);
const LAN_IP = process.argv[3] ?? "0.0.0.0";
const TARGET_HOST = "127.0.0.1";
const TARGET_PORT = 5179;

const server = net.createServer((clientSocket) => {
  const targetSocket = net.createConnection(
    { host: TARGET_HOST, port: TARGET_PORT },
    () => {
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    },
  );

  targetSocket.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => targetSocket.destroy());
});

server.listen(LISTEN_PORT, LAN_IP, () => {
  const addr = server.address();
  console.log(
    `lan-proxy: forwarding ${typeof addr === "object" ? addr.address : LAN_IP}:${LISTEN_PORT} → ${TARGET_HOST}:${TARGET_PORT}`,
  );
});
