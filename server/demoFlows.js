export const DEMO_FLOW_IDS = {
  NIGHT_PROTECTION: "night-protection",
  NEXT_MORNING_RECOVERY: "next-morning-recovery",
};

const NIGHT_PROTECTION_EVENTS = [
  "RISK_EVENT_RECEIVED",
  "AUTO_SUSPEND_ALLOWED",
  "PUSH_SENT",
];

const NEXT_MORNING_RECOVERY_EVENTS = [
  ...NIGHT_PROTECTION_EVENTS,
  "CUSTOMER_TAPS_FRAUD",
  "REQUEST_BIOMETRIC",
  "BIOMETRIC_SUCCESS_FRAUD",
  "TERMINATE_CARD_SUCCESS",
  "ISSUE_CARD_SUCCESS",
  "CREATE_CASE_SUCCESS",
  "OPEN_NEXT_MORNING_RECOVERY",
];

const DEMO_FLOWS = {
  [DEMO_FLOW_IDS.NIGHT_PROTECTION]: {
    id: DEMO_FLOW_IDS.NIGHT_PROTECTION,
    label: "02:00 · Bảo vệ tài khoản ban đêm",
    description: "Backend mở cảnh báo khẩn cấp; người quay tự bấm toàn bộ bước xác nhận và bảo vệ tài khoản.",
    events: NIGHT_PROTECTION_EVENTS,
    showCriticalAlert: true,
    sendPush: true,
    autoAdvance: false,
  },
  [DEMO_FLOW_IDS.NEXT_MORNING_RECOVERY]: {
    id: DEMO_FLOW_IDS.NEXT_MORNING_RECOVERY,
    label: "08:30 · Phục hồi niềm tin sáng hôm sau",
    description: "Backend đưa app tới cảnh sáng hôm sau; người quay tự bấm từng bước reasoning và kích hoạt hỗ trợ.",
    events: NEXT_MORNING_RECOVERY_EVENTS,
    showCriticalAlert: false,
    sendPush: false,
    autoAdvance: false,
  },
};

export function getDemoFlow(flowId) {
  const flow = DEMO_FLOWS[flowId];

  if (!flow) {
    throw new Error(`Unknown demo flow: ${flowId}`);
  }

  return flow;
}

export function listDemoFlows() {
  return Object.values(DEMO_FLOWS);
}
