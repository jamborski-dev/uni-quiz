/**
 * Production HTTPS server for LAN PWA testing.
 * Generates a mkcert cert for the LAN IP, then serves the Next.js
 * production build over HTTPS on port 3000 — all interfaces.
 *
 * Usage: pnpm preview:lan  (runs `next build` first)
 * Requires: brew install mkcert && mkcert -install
 */

import { networkInterfaces } from "os"
import { execSync } from "child_process"
import { existsSync, mkdirSync, readFileSync } from "fs"
import { createServer } from "https"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")
const require = createRequire(import.meta.url)

// ── 1. Find LAN IP ────────────────────────────────────────────────────────────
const nets = networkInterfaces()
let lanIP = null
for (const addrs of Object.values(nets)) {
  for (const addr of addrs) {
    if (addr.family === "IPv4" && !addr.internal) {
      lanIP = addr.address
      break
    }
  }
  if (lanIP) break
}
if (!lanIP) {
  console.error("  No LAN interface found — is the machine on a network?")
  process.exit(1)
}

// ── 2. Generate mkcert cert for localhost + LAN IP ───────────────────────────
const certDir = resolve(rootDir, "certificates-lan")
const certFile = resolve(certDir, "cert.pem")
const keyFile = resolve(certDir, "key.pem")

if (!existsSync(certDir)) mkdirSync(certDir, { recursive: true })

// Regenerate if cert doesn't exist (key + cert must both exist)
if (!existsSync(certFile) || !existsSync(keyFile)) {
  console.log(`\n  Generating certificate for localhost + ${lanIP}...`)
  try {
    execSync(
      `mkcert -cert-file "${certFile}" -key-file "${keyFile}" localhost 127.0.0.1 ::1 ${lanIP}`,
      { stdio: "inherit", cwd: rootDir }
    )
  } catch {
    console.error(
      "\n  ✖  mkcert not found or failed.\n" +
        "     Install it with:  brew install mkcert && mkcert -install\n" +
        "     Then re-run:      pnpm preview:lan\n"
    )
    process.exit(1)
  }
}

// ── 3. Start Next.js custom HTTPS server ─────────────────────────────────────
process.env.NODE_ENV = "production"

const next = require("next")
const app = next({ dev: false, dir: rootDir })
const handle = app.getRequestHandler()

console.log("\n  Starting production server…")
await app.prepare()

createServer(
  { key: readFileSync(keyFile), cert: readFileSync(certFile) },
  (req, res) => handle(req, res)
).listen(3000, "0.0.0.0", () => {
  console.log("\n  ┌─────────────────────────────────────────────┐")
  console.log("  │  PWA preview — production build             │")
  console.log("  ├─────────────────────────────────────────────┤")
  console.log(`  │  Local:    https://localhost:3000           │`)
  console.log(`  │  Network:  https://${lanIP}:3000${" ".repeat(Math.max(0, 20 - lanIP.length))}│`)
  console.log("  ├─────────────────────────────────────────────┤")
  console.log("  │  On your phone:                             │")
  console.log("  │  • Accept the cert warning once, OR        │")
  console.log("  │  • Install mkcert CA (see README)           │")
  console.log("  └─────────────────────────────────────────────┘\n")
})
