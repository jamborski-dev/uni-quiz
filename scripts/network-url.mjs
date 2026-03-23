import { networkInterfaces } from 'os'

const https = process.argv.includes('https')
const protocol = https ? 'https' : 'http'

const nets = networkInterfaces()
const ips = []

for (const addrs of Object.values(nets)) {
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      ips.push(addr.address)
    }
  }
}

if (ips.length) {
  console.log('\n  Network access:')
  ips.forEach(ip => console.log(`  ${protocol}://${ip}:3000`))
  if (https) {
    console.log('  (self-signed cert — accept the browser warning on first visit)')
  }
  console.log('')
}
