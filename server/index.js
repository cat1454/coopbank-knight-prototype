import http from 'http';
import readline from 'readline';
import os from 'os';

const PORT = 5000;
let clients = [];
let lastAuditCount = 0;
let lastState = '';
let autoTriggerTimer = null;
let alertTriggered = false;

// ANSI escape codes for terminal coloring
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m'
};

function logSystem(msg) {
  console.log(`${COLORS.gray}[SYSTEM] ${msg}${COLORS.reset}`);
}

function logAlert(msg) {
  console.log(`${COLORS.red}${COLORS.bold}[ALERT] ${msg}${COLORS.reset}`);
}

function logObserve(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : '';
  console.log(`${COLORS.cyan}[OBSERVE]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function logReason(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : '';
  console.log(`${COLORS.yellow}[REASON]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function logAct(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : '';
  console.log(`${COLORS.green}[ACT]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach(res => {
    res.write(`data: ${payload}\n\n`);
  });
}

function triggerAlert() {
  if (alertTriggered) {
    logSystem('Cảnh báo rủi ro đã được kích hoạt trước đó.');
    return;
  }
  
  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }
  
  alertTriggered = true;
  logAlert('Kích hoạt cảnh báo rủi ro đến ứng dụng mobile!');
  broadcast({ type: 'trigger', events: ['RISK_EVENT_RECEIVED'] });
}

function triggerReset() {
  alertTriggered = false;
  lastAuditCount = 0;
  lastState = '';
  if (autoTriggerTimer) {
    clearTimeout(autoTriggerTimer);
    autoTriggerTimer = null;
  }
  logSystem('Gửi tín hiệu Reset trạng thái ứng dụng...');
  broadcast({ type: 'trigger', events: ['RESET_SCENARIO'] });
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Setup HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/lan-ip' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: getLanIp() }));
    return;
  }

  // SSE Event stream
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send a connection confirmation event
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    clients.push(res);
    logSystem(`Ứng dụng mobile đã kết nối. (Tổng số client: ${clients.length})`);

    // Reset local log state when client connects
    lastAuditCount = 0;
    lastState = '';

    // Auto trigger alert after 2.5 seconds of first connection if not triggered yet
    if (!alertTriggered && clients.length === 1) {
      logSystem('Sẽ tự động kích hoạt cảnh báo rủi ro sau 2.5 giây...');
      autoTriggerTimer = setTimeout(() => {
        logSystem('Tự động kích hoạt (Hết thời gian chờ)...');
        triggerAlert();
      }, 2500);
    }

    req.on('close', () => {
      clients = clients.filter(c => c !== res);
      logSystem(`Ứng dụng mobile đã ngắt kết nối. (Tổng số client: ${clients.length})`);
      if (clients.length === 0) {
        alertTriggered = false;
        if (autoTriggerTimer) {
          clearTimeout(autoTriggerTimer);
          autoTriggerTimer = null;
        }
      }
    });
    return;
  }

  // Receive state updates from frontend
  if (req.url === '/api/report-state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { currentState, auditEvents } = payload;

        // Process state transition log
        if (currentState !== lastState) {
          console.log(`${COLORS.gray}[STATE] Trạng thái UI chuyển sang:${COLORS.reset} ${COLORS.bold}${currentState}${COLORS.reset}`);
          lastState = currentState;
        }

        // Process new audit logs
        if (auditEvents && auditEvents.length > lastAuditCount) {
          const newEvents = auditEvents.slice(lastAuditCount);
          newEvents.forEach(evt => {
            if (evt.phase === 'OBSERVE') {
              logObserve(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
            } else if (evt.phase === 'REASON') {
              logReason(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
            } else if (evt.phase === 'ACT') {
              logAct(evt.actor, evt.label || evt.action, evt.reason, evt.policyLevel);
            }
          });
          lastAuditCount = auditEvents.length;
        }

        // Reset tracking count when state goes back to idle
        if (currentState === 'idle_monitoring') {
          lastAuditCount = 0;
          alertTriggered = false;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.clear();
  console.log(`\n${COLORS.bgBlue}============================================================${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}       CO-OPBANK KNIGHT SECURITY ENGINE - ACTIVE SHIELD     ${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}============================================================${COLORS.reset}\n`);
  console.log(`${COLORS.bold}Server đang chạy tại:${COLORS.reset} http://localhost:${PORT}`);
  console.log(`${COLORS.bold}Phím điều khiển:${COLORS.reset}`);
  console.log(`  • ${COLORS.bold}[Space]${COLORS.reset} / ${COLORS.bold}[Enter]${COLORS.reset} / ${COLORS.bold}[S]${COLORS.reset} : Kích hoạt cảnh báo rủi ro (Risk Alert)`);
  console.log(`  • ${COLORS.bold}[R]${COLORS.reset}                    : Reset trạng thái ứng dụng`);
  console.log(`  • ${COLORS.bold}[Q]${COLORS.reset}                    : Thoát server`);
  console.log(`\n------------------------------------------------------------\n`);
  logSystem('Đang chờ ứng dụng mobile kết nối...');
});

// Setup stdin for interactive controls
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }
  
  const keyName = key.name || '';
  if (keyName === 's' || keyName === 'space' || keyName === 'return') {
    triggerAlert();
  } else if (keyName === 'r') {
    triggerReset();
  } else if (keyName === 'q') {
    process.exit();
  }
});
