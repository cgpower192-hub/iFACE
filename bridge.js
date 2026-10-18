// NEON//SCANNER macOS bridge — zero dependencies. Run: node bridge.js
// Needs: Terminal (or iTerm) allowed in System Settings > Privacy & Security > Accessibility,
// and Mission Control shortcuts "Move left/right a space" (Ctrl+←/→) enabled in Keyboard > Shortcuts.
const http = require('http');
const { exec } = require('child_process');
const PORT = 8765;
const osa = s => `osascript -e '${s}'`;

const COMMANDS = {
  space_left:  osa('tell application "System Events" to key code 123 using control down'),
  space_right: osa('tell application "System Events" to key code 124 using control down'),
  volume_up:   osa('set volume output volume ((output volume of (get volume settings)) + 8)'),
  volume_down: osa('set volume output volume ((output volume of (get volume settings)) - 8)'),
  // Toggles Music.app. For Spotify use: tell application "Spotify" to playpause
  playpause:   osa('tell application "Music" to playpause'),
  lock:        'pmset displaysleepnow',   // map FIST → "lock" in the HTML to use this
  screenshot:  'screencapture -x ~/Desktop/cyber_glitch_$(date +%s).png',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method === 'GET' && req.url === '/ping') { res.writeHead(200); return res.end('pong'); }
  if (req.method === 'POST' && req.url === '/gesture') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      try {
        const { action, gesture } = JSON.parse(body);
        const cmd = COMMANDS[action];
        if (!cmd) { res.writeHead(400); return res.end('unknown action'); }
        console.log(`[${new Date().toLocaleTimeString()}] ${gesture || '-'} → ${action}`);
        exec(cmd, err => { if (err) console.error(err.message); });
        res.writeHead(200); res.end('ok');
      } catch (e) { res.writeHead(400); res.end('bad json'); }
    });
    return;
  }
  res.writeHead(404); res.end();
});
server.listen(PORT, '127.0.0.1', () => console.log(`Bridge listening on http://127.0.0.1:${PORT}`));
