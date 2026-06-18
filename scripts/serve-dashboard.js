// scripts/serve-dashboard.js
// Plain Node static file server — no dependencies, nothing hidden.
// Run: node scripts/serve-dashboard.js
// Then open http://localhost:5050 in your browser.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5050;
const ROOT = path.join(__dirname, '..', 'dashboard');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
};

function lanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\nDashboard running:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  const ip = lanIp();
  if (ip) console.log(`  Network: http://${ip}:${PORT}  (phone on same WiFi)`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
