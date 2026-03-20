import { networkInterfaces } from 'os'

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
  ips.forEach(ip => console.log(`  http://${ip}:3000`))
  console.log('')
}
