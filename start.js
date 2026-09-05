#!/usr/bin/env node
"use strict";

/**
 * Starter kecil untuk menjalankan http-server dengan output console
 * yang rapi (tanpa noise npm warning / detail konfigurasi bawaan).
 *
 * Memanggil http-server langsung sebagai modul Node (bukan spawn proses
 * terpisah), supaya tidak ada masalah escaping path yang mengandung
 * spasi di Windows (mis. "C:\Users\U S E R\...").
 *
 * Jalankan dengan: npm start
 */

const path = require("path");

const PORT = Number(process.env.PORT) || 8000;
const HOST = "127.0.0.1";
const ROOT = path.join(__dirname, "public");

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function printBanner() {
  const line = "─".repeat(42);
  console.log("");
  console.log(`${c.bold}${c.green}🌱  Binova — Smart Waste Recognition${c.reset}`);
  console.log(`${c.dim}${line}${c.reset}`);
  console.log(`  ${c.cyan}➜  Local:${c.reset}    http://${HOST}:${PORT}/`);
  console.log(`  ${c.dim}Serving:  ${ROOT}${c.reset}`);
  console.log(`${c.dim}${line}${c.reset}`);
  console.log(`  ${c.yellow}Tekan CTRL+C untuk menghentikan server${c.reset}`);
  console.log("");
}

let httpServer;
try {
  httpServer = require("http-server");
} catch (err) {
  console.error(
    `${c.red}Modul "http-server" belum ter-install. Jalankan "npm install" dulu, lalu "npm start" lagi.${c.reset}`,
  );
  process.exit(1);
}

const server = httpServer.createServer({
  root: ROOT,
  cache: -1, // matikan cache supaya perubahan file langsung terlihat
  logFn: () => {}, // matikan log per-request bawaan http-server
});

server.listen(PORT, HOST, () => {
  printBanner();
});

server.server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `${c.red}Port ${PORT} sudah dipakai proses lain. Coba: set PORT=8001 && npm start${c.reset}`,
    );
  } else {
    console.error(`${c.red}Server error: ${err.message}${c.reset}`);
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log(`\n${c.dim}Menghentikan server...${c.reset}`);
  server.close();
  process.exit(0);
});
