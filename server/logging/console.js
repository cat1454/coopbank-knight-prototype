export const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
};

export function logSystem(msg) {
  console.log(`${COLORS.gray}[SYSTEM] ${msg}${COLORS.reset}`);
}

export function logAlert(msg) {
  console.log(`${COLORS.red}${COLORS.bold}[ALERT] ${msg}${COLORS.reset}`);
}

export function logObserve(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.cyan}[OBSERVE]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

export function logReason(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.yellow}[REASON]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}

export function logAct(actor, label, reason, policy) {
  const policyStr = policy ? ` [${policy}]` : "";
  console.log(`${COLORS.green}[ACT]${policyStr} ${actor}: ${label} -> ${COLORS.gray}${reason}${COLORS.reset}`);
}
