/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useMemo } from "react";
import type { KnightScenarioState } from "../domain/types";
import "../styles/knight-agent.css";

interface KnightAgentVisualProps {
  state: KnightScenarioState;
  variant?: "desktop" | "mobile";
}

const phaseColors = {
  REASON: "#00d8ff",
  ACT: "#ef9f27",
  OBSERVE: "#1fd89a",
  UPGRADED: "#bf5af2",
};

const particleLabels = [
  "risk_score: 847",
  "device.new",
  "card.suspend()",
  "FRAUD_DETECTED",
  "push.alert()",
  "biometric: OK",
  "case.link()",
  "audit_log: write",
  "ReAct: REASON",
  "policy: L2",
  "trust_score: 82",
  "threshold: 70",
  "token.rotate()",
  "card.issue_new()",
];

export function KnightAgentVisual({ state, variant = "desktop" }: KnightAgentVisualProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmOscillatorRef = useRef<OscillatorNode | null>(null);
  const alarmGainRef = useRef<GainNode | null>(null);
  const alarmSweepTimerRef = useRef<number | undefined>(undefined);
  
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  // Map state to scenario visual properties
  const step = useMemo(() => {
    // default step
    const defaultStep = {
      phase: "REASON" as const,
      mood: "idle" as const,
      riskScore: 420,
      cardStatus: "ACTIVE",
      response: "0.8s",
      audit: "WATCHING",
      badgeTitle: "AN TOÀN",
      badgeSubtitle: "Đang canh gác",
      thought: "Luồng giao dịch ổn định. KNIGHT giữ trạng thái im lặng, chỉ theo dõi thiết bị, vị trí và nhịp chi tiêu.",
      assistantMessage: "",
      alert: "KNIGHT đang giám sát các giao dịch thời gian thực.",
      action: "monitor()",
      hot: "phase" as const,
    };

    switch (state.currentState) {
      case "idle_monitoring":
        return defaultStep;

      case "risk_detected":
        return {
          phase: "REASON" as const,
          mood: "alert" as const,
          riskScore: 847,
          cardStatus: "ACTIVE",
          response: "1.2s",
          audit: "FLAGGED",
          badgeTitle: "GIAO DỊCH LẠ",
          badgeSubtitle: "Cần chú ý",
          thought: "Risk score 847/1000. Thiết bị lạ, IP VPN Singapore, giao dịch lúc 02:00. Cần can thiệp trước khi tiền rời tài khoản.",
          assistantMessage: "Tôi vừa phát hiện giao dịch bất thường. Tôi sẽ hiện lên ngay để giải thích ngắn gọn và chuẩn bị khóa thẻ tạm thời.",
          alert: "Cảnh báo: giao dịch bất thường lúc 02:00 từ thiết bị mới.",
          action: "risk.flag()",
          hot: "risk" as const,
        };

      case "card_suspended_l2":
        return {
          phase: "ACT" as const,
          mood: "protect" as const,
          riskScore: 892,
          cardStatus: "SUSPENDED",
          response: "2.1s",
          audit: "WRITING",
          badgeTitle: "ĐÃ CHẶN",
          badgeSubtitle: "Thẻ đã khóa",
          thought: "Policy L2 được kích hoạt. Tạm khóa thẻ số trên hệ thống, ghi nhận audit log và gửi push notification để xác nhận.",
          assistantMessage: "Tôi đã tạm khóa thẻ để bảo vệ tài sản của bạn. Giao dịch tiếp theo sẽ bị chặn cho đến khi xác minh.",
          alert: "card.suspend() hoàn tất. Push alert đã gửi đến khách hàng.",
          action: "card.suspend()",
          hot: "card" as const,
        };

      case "awaiting_customer_response":
        return {
          phase: "OBSERVE" as const,
          mood: "protect" as const,
          riskScore: 892,
          cardStatus: "SUSPENDED",
          response: "2.1s",
          audit: "AWAITING",
          badgeTitle: "CHỜ KHÁCH",
          badgeSubtitle: "Đã gửi Push",
          thought: "Thẻ số đã được tạm khóa thành công. Đang chờ phản hồi của khách hàng qua ứng dụng di động để quyết định bước tiếp theo.",
          assistantMessage: "Đang chờ khách hàng xác nhận giao dịch. Ứng dụng di động của khách đang mở màn hình tra soát.",
          alert: "Đang chờ khách hàng phản hồi...",
          action: "notification.await()",
          hot: "response" as const,
        };

      case "customer_confirms_fraud":
        return {
          phase: "OBSERVE" as const,
          mood: "verify" as const,
          riskScore: 690,
          cardStatus: "SUSPENDED",
          response: "2.3s",
          audit: "LINKED",
          badgeTitle: "XÁC NHẬN",
          badgeSubtitle: "Báo cáo fraud",
          thought: "Khách hàng xác nhận đây là giao dịch giả mạo. Đang chuẩn bị yêu cầu xác thực Face ID để mở khóa hành động Policy L3.",
          assistantMessage: "Bạn vừa xác nhận giao dịch giả mạo. Tôi cần xác thực Face ID của bạn để tiến hành hủy thẻ cũ và cấp thẻ mới.",
          alert: "Khách hàng xác nhận fraud. Đang chuẩn bị yêu cầu Face ID...",
          action: "auth.prepare()",
          hot: "response" as const,
        };

      case "biometric_required":
        return {
          phase: "REASON" as const,
          mood: "verify" as const,
          riskScore: 690,
          cardStatus: "VERIFYING",
          response: "2.4s",
          audit: "LINKED",
          badgeTitle: "XÁC MINH",
          badgeSubtitle: "Chờ Face ID",
          thought: "Hành động Policy L3 (hủy thẻ vĩnh viễn và tạo thẻ mới) yêu cầu sinh trắc học Face ID chống chối bỏ để thực thi.",
          assistantMessage: "Vui lòng hoàn tất Face ID trên điện thoại để tôi xác nhận danh tính của bạn trước khi thực hiện thao tác bảo vệ.",
          alert: "Đang yêu cầu xác thực Face ID từ khách hàng.",
          action: "auth.request()",
          hot: "response" as const,
        };

      case "biometric_verified": {
        const isLegit = state.customerIntent === "legitimate";
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: isLegit ? 400 : 500,
          cardStatus: "VERIFIED",
          response: "2.6s",
          audit: "WRITING",
          badgeTitle: "FACE ID OK",
          badgeSubtitle: "Xác thực xong",
          thought: `Face ID xác thực thành công. Khách hàng chính chủ đã phê duyệt hành động. Chuẩn bị chạy ${isLegit ? "kịch bản mở khóa thẻ" : "kịch bản hủy thẻ cũ"}.`,
          assistantMessage: "Xác thực Face ID thành công! Tôi đang bắt đầu thực thi các thao tác hệ thống tiếp theo.",
          alert: "Face ID thành công. Đang kích hoạt tiến trình bảo vệ...",
          action: "auth.success()",
          hot: "audit" as const,
        };
      }

      case "card_terminated_l3":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 380,
          cardStatus: "TERMINATED",
          response: "2.8s",
          audit: "WRITING",
          badgeTitle: "HỦY THẺ CŨ",
          badgeSubtitle: "Thành công",
          thought: "Thẻ số cũ đã được hủy vĩnh viễn trên hệ thống Core Banking để ngăn chặn triệt để giao dịch giả mạo tiếp theo. Bắt đầu phát hành thẻ ảo mới.",
          assistantMessage: "Tôi đã khóa và hủy vĩnh viễn thẻ số cũ bị lộ thông tin của bạn. Đang phát hành thẻ ảo mới thay thế.",
          alert: "Thẻ cũ đã được hủy vĩnh viễn. Đang phát hành thẻ ảo mới...",
          action: "card.terminate()",
          hot: "card" as const,
        };

      case "new_card_issued":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 280,
          cardStatus: "REISSUED",
          response: "3.0s",
          audit: "WRITING",
          badgeTitle: "THẺ MỚI",
          badgeSubtitle: "Đã phát hành",
          thought: "Thẻ ảo mới thay thế đã được tạo thành công với thông tin thẻ hoàn toàn mới. Đang chuẩn bị lập hồ sơ tra soát (Case L3).",
          assistantMessage: "Thẻ số mới đã được phát hành thành công và sẵn sàng để sử dụng. Đang khởi tạo hồ sơ tra soát.",
          alert: "Thẻ số mới đã sẵn sàng. Đang khởi tạo Dispute Case...",
          action: "card.issue()",
          hot: "card" as const,
        };

      case "fraud_case_created":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 210,
          cardStatus: "REISSUED",
          response: "3.2s",
          audit: "COMPLETE",
          badgeTitle: "HỒ SƠ FRAUD",
          badgeSubtitle: "Đã tạo Case",
          thought: "[GOAL] Thẻ cũ đã khóa, thẻ mới hoạt động và hồ sơ tra soát đã được tạo. Chỉ sau mốc an toàn này mới được đánh giá nhu cầu phục hồi niềm tin.",
          assistantMessage: "Tài khoản đã được bảo vệ. Tiếp theo tôi sẽ quan sát các tín hiệu hành vi sau sự cố để xác định khách hàng có cần hỗ trợ thêm hay không.",
          alert: "Mốc an toàn đã xác nhận. Sẵn sàng quan sát hành vi sau sự cố.",
          action: "case.create()",
          hot: "audit" as const,
        };

      case "post_incident_behavior_observed":
        return {
          phase: "OBSERVE" as const,
          mood: "resolve" as const,
          riskScore: 180,
          cardStatus: "PROTECTED",
          response: "1.1s",
          audit: "WRITING",
          badgeTitle: "HÀNH VI",
          badgeSubtitle: "5 tín hiệu",
          thought: "[OBSERVE] Ghi nhận 6 lần kiểm tra số dư, 4 lần mở lịch sử, 3 lần xem bảo vệ, 2 lần mở hỗ trợ và 1 thanh toán thiết yếu bị dừng.",
          assistantMessage: "Tôi chỉ dùng hành vi có thể kiểm chứng. Đây là dấu hiệu nhu cầu hỗ trợ, không phải kết luận rằng tôi biết khách hàng đang cảm thấy gì.",
          alert: "behavior.observePostIncident() · 5 tín hiệu đã ghi nhận.",
          action: "behavior.observe()",
          hot: "phase" as const,
        };

      case "trust_recovery_assessed":
        return {
          phase: "REASON" as const,
          mood: "resolve" as const,
          riskScore: 170,
          cardStatus: "PROTECTED",
          response: "0.9s",
          audit: "WRITING",
          badgeTitle: "82 / 100",
          badgeSubtitle: "Ngưỡng 70",
          thought: "[ANALYSIS] Tổng trọng số 82/100. [REASONING] Điểm vượt ngưỡng 70 và lịch sử consent cho thấy Điện, Nước, Siêu thị là nhu cầu thật. [DECISION] Kích hoạt Gói Phục Hồi An Tâm.",
          assistantMessage: "Điểm Nhu Cầu Phục Hồi là 82 trên 100. Tôi sẽ bật các lớp hỗ trợ an toàn phù hợp; hoàn tiền thiết yếu vẫn cần khách hàng xác nhận riêng.",
          alert: "trustRecovery.checkThreshold() · 82 ≥ 70 · ELIGIBLE",
          action: "trustRecovery.calculate()",
          hot: "phase" as const,
        };

      case "reassurance_package_active":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 150,
          cardStatus: "PROTECTED",
          response: "0.8s",
          audit: "WRITING",
          badgeTitle: "AN TÂM",
          badgeSubtitle: "Gói đã bật",
          thought: "[ACTION] Đã bật bảo vệ 30 ngày, cảnh báo realtime, hỗ trợ ưu tiên 24/7, xem xét hoàn phí và báo cáo an toàn. Cashback thiết yếu đang chờ consent.",
          assistantMessage: "Các lớp hỗ trợ an toàn đã hoạt động. Phần hoàn tiền 10% cho Điện, Nước và Siêu thị chỉ được bật khi khách hàng xác nhận.",
          alert: "reassurance.activateSafetySupport() success.",
          action: "reassurance.activate()",
          hot: "audit" as const,
        };

      case "cashback_activated":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 140,
          cardStatus: "PROTECTED",
          response: "0.7s",
          audit: "WRITING",
          badgeTitle: "ĐÃ XÁC NHẬN",
          badgeSubtitle: "Chi tiêu thiết yếu",
          thought: "[ACTION] Khách hàng đã đồng ý. Kích hoạt hoàn tiền 10% đúng ba nhóm Điện, Nước và Siêu thị trong tháng này.",
          assistantMessage: "Hoàn tiền thiết yếu đã được kích hoạt theo consent. Tôi tiếp tục quan sát hành vi sử dụng để đánh giá hiệu quả hỗ trợ.",
          alert: "cashback.activateEssential() success.",
          action: "cashback.activate()",
          hot: "audit" as const,
        };

      case "recovery_observed":
      case "react_cycle_completed":
        return {
          phase: "OBSERVE" as const,
          mood: "idle" as const,
          riskScore: 120,
          cardStatus: "PROTECTED",
          response: "0.6s",
          audit: "COMPLETE",
          badgeTitle: "HOÀN TẤT",
          badgeSubtitle: "Có bằng chứng",
          thought: "[OBSERVE] Khách hàng quay lại thanh toán điện và số lần kiểm tra số dư lặp lại giảm 60%. Đây là tín hiệu hành vi phục hồi có thể kiểm chứng.",
          assistantMessage: "Tín hiệu sau hỗ trợ cho thấy khách hàng đã tiếp tục giao dịch thiết yếu và giảm kiểm tra số dư lặp lại. Vòng phục hồi hoàn tất.",
          alert: "Recovery evidence observed · ReAct Cycle Complete",
          action: "recovery.observe()",
          hot: "phase" as const,
        };

      case "audit_complete":
        return {
          phase: "UPGRADED" as const,
          mood: "upgraded" as const,
          riskScore: 120,
          cardStatus: "PROTECTED",
          response: "0.6s",
          audit: "COMPLETE",
          badgeTitle: "AI UPGRADED",
          badgeSubtitle: "Hiệu năng cao",
          thought: "Lõi bảo vệ KNIGHT đã tự động học tập hành vi an toàn và tự nâng cấp lên v2.0 (Chế độ tăng cường).",
          assistantMessage: "Vòng phục hồi hoàn tất thành công! Tôi đã tự nâng cấp lõi phòng thủ ReAct lên phiên bản v2.0 để bảo vệ tài khoản tối ưu.",
          alert: "KNIGHT AI v2.0: Chế độ bảo vệ tăng cường đã kích hoạt.",
          action: "agent.upgrade()",
          hot: "phase" as const,
        };

      case "customer_confirms_legit":
        return {
          phase: "OBSERVE" as const,
          mood: "resolve" as const,
          riskScore: 350,
          cardStatus: "SUSPENDED",
          response: "1.2s",
          audit: "WRITING",
          badgeTitle: "XÁC NHẬN",
          badgeSubtitle: "Chính chủ",
          thought: "Khách hàng xác nhận chính họ thực hiện giao dịch này. Chuẩn bị thực thi mở khóa thẻ số (Policy L2).",
          assistantMessage: "Bạn vừa xác nhận giao dịch là chính chủ. Tôi đang gửi lệnh mở khóa thẻ số cho bạn.",
          alert: "Khách xác nhận chính chủ. Đang gửi lệnh mở khóa thẻ...",
          action: "card.unlock_prepare()",
          hot: "response" as const,
        };

      case "card_unsuspended":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 280,
          cardStatus: "ACTIVE",
          response: "1.4s",
          audit: "WRITING",
          badgeTitle: "MỞ KHÓA THẺ",
          badgeSubtitle: "Đã mở khóa",
          thought: "Thẻ số đã được kích hoạt trở lại trạng thái ACTIVE trên hệ thống. Tiếp tục whitelist phiên thiết bị hiện tại để tránh bị chặn tiếp.",
          assistantMessage: "Thẻ số của bạn đã được mở khóa thành công. Tôi đang thiết lập tin cậy thiết bị này.",
          alert: "Mở khóa thẻ thành công. Đang tiến hành whitelist thiết bị...",
          action: "card.unsuspend()",
          hot: "card" as const,
        };

      case "device_session_whitelisted":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 210,
          cardStatus: "ACTIVE",
          response: "1.6s",
          audit: "WRITING",
          badgeTitle: "TIN CẬY THIẾT BỊ",
          badgeSubtitle: "Whitelisted",
          thought: "Phiên thiết bị hiện tại đã được whitelist tạm thời. Đang kích hoạt chế độ giám sát nâng cao 30 phút để bảo vệ tối đa.",
          assistantMessage: "Đã đưa thiết bị của bạn vào danh sách tin cậy. Để an tâm, tôi sẽ giám sát tăng cường trong 30 phút.",
          alert: "Whitelist phiên thiết bị thành công. Đang kích hoạt giám sát...",
          action: "session.whitelist()",
          hot: "audit" as const,
        };

      case "enhanced_monitoring_30m":
        return {
          phase: "ACT" as const,
          mood: "resolve" as const,
          riskScore: 190,
          cardStatus: "ACTIVE",
          response: "1.8s",
          audit: "COMPLETE",
          badgeTitle: "GIÁM SÁT",
          badgeSubtitle: "Tăng cường 30m",
          thought: "Chế độ giám sát tăng cường trong 30 phút đã hoạt động. Thẻ đang ở trạng thái an toàn.",
          assistantMessage: "Quy trình xác minh hoàn tất. Thẻ của bạn hoạt động bình thường dưới sự bảo vệ giám sát tăng cường.",
          alert: "Đã bật giám sát tăng cường. KNIGHT tiếp tục bảo vệ hệ thống.",
          action: "monitoring.enhanced()",
          hot: "phase" as const,
        };

      case "customer_timeout":
        return {
          phase: "OBSERVE" as const,
          mood: "alert" as const,
          riskScore: 892,
          cardStatus: "SUSPENDED",
          response: "5.0m",
          audit: "AWAITING",
          badgeTitle: "TIMEOUT",
          badgeSubtitle: "Hết giờ chờ",
          thought: "Khách hàng không phản hồi trên ứng dụng di động trong 5 phút. Kích hoạt Policy chuyển tiếp vụ việc sang Fraud Ops để xử lý thủ công.",
          assistantMessage: "Đã quá 5 phút chờ xác nhận. Để đảm bảo an toàn, tôi bắt đầu chuyển hồ sơ vụ việc sang bộ phận phòng chống gian lận (Fraud Ops).",
          alert: "Hết thời gian phản hồi. Đang tiến hành chuyển tiếp hồ sơ sang Fraud Ops...",
          action: "customer.timeout()",
          hot: "response" as const,
        };


      case "fraud_ops_escalated":
        return {
          phase: "ACT" as const,
          mood: "alert" as const,
          riskScore: 890,
          cardStatus: "SUSPENDED",
          response: "5.5m",
          audit: "ESCALATED",
          badgeTitle: "FRAUD OPS",
          badgeSubtitle: "Đã chuyển tiếp",
          thought: "Hồ sơ tra soát đã được tạo và đẩy vào hàng chờ ưu tiên của bộ phận vận hành Fraud Ops. Đang áp dụng Policy khóa bảo toàn thẻ số.",
          assistantMessage: "Hồ sơ đã được chuyển lên bộ phận phòng chống gian lận. Thẻ số của bạn sẽ tiếp tục được khóa tạm thời để bảo toàn số dư.",
          alert: "Chuyển tiếp thành công. Đang kích hoạt trạng thái giữ khóa thẻ...",
          action: "ops.escalate()",
          hot: "audit" as const,
        };

      case "card_remains_suspended":
        return {
          phase: "ACT" as const,
          mood: "alert" as const,
          riskScore: 890,
          cardStatus: "SUSPENDED",
          response: "5.8m",
          audit: "COMPLETE",
          badgeTitle: "TẠM KHÓA",
          badgeSubtitle: "Đang giữ khóa",
          thought: "Thẻ số vẫn được giữ trạng thái tạm khóa an toàn. Chờ kết quả tra soát chính thức và xử lý thủ công từ Fraud Ops.",
          assistantMessage: "Toàn bộ tiến trình ứng phó khẩn cấp hoàn tất. Thẻ vẫn tạm khóa an toàn chờ bộ phận Nghiệp vụ phản hồi.",
          alert: "Đã bảo toàn tài sản. Thẻ số tiếp tục được khóa tạm thời.",
          action: "card.keepSuspended()",
          hot: "card" as const,
        };

      default:
        return defaultStep;
    }
  }, [state.currentState, state.customerIntent]);

  // Is threat active (danger mode)?
  const isDanger = step.mood === "alert" || step.mood === "protect";

  // Mouse Parallax Effect
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty("--parallax-x", `${x * 18}px`);
    scene.style.setProperty("--parallax-y", `${y * 14}px`);
    scene.style.setProperty("--spot-x", `${50 + x * 14}%`);
    scene.style.setProperty("--spot-y", `${48 + y * 12}%`);
  };

  // Generate static stars
  const starsList = useMemo(() => {
    return Array.from({ length: 96 }).map((_, i) => ({
      left: `${(Math.sin(i * 12345.67) * 0.5 + 0.5) * 100}%`,
      top: `${(Math.cos(i * 98765.43) * 0.5 + 0.5) * 100}%`,
      d: `${2 + (i % 5) * 0.8}s`,
      o: (0.2 + (i % 8) * 0.09).toFixed(2),
      delay: `${(i % 10) * 0.4}s`,
    }));
  }, []);

  // Generate static particles
  const particlesList = useMemo(() => {
    return particleLabels.map((label, index) => ({
      label,
      x: `${7 + ((index * 13) % 86)}%`,
      y: `${50 + ((index * 9) % 34)}%`,
      dur: `${5 + (index % 5)}s`,
      del: `${(index % 6) * 0.65}s`,
      drift: index % 2 === 0 ? 18 : -18,
    }));
  }, []);

  // Web Audio Alarm System
  const ensureAudioContext = (): Promise<AudioContext> => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return Promise.reject(new Error("Web Audio is not supported"));
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      return audioContextRef.current.resume().then(() => audioContextRef.current!);
    }

    return Promise.resolve(audioContextRef.current);
  };

  const startAlarm = async () => {
    if (!alarmEnabled || alarmActive || !isDanger) return;

    try {
      const context = await ensureAudioContext();
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();

      alarmOscillatorRef.current = osc;
      alarmGainRef.current = gain;
      setAlarmActive(true);

      let highTone = false;
      alarmSweepTimerRef.current = window.setInterval(() => {
        if (!alarmOscillatorRef.current || !alarmGainRef.current || !audioContextRef.current) return;
        highTone = !highTone;
        const now = audioContextRef.current.currentTime;
        alarmOscillatorRef.current.frequency.cancelScheduledValues(now);
        alarmOscillatorRef.current.frequency.setTargetAtTime(highTone ? 1360 : 720, now, 0.035);
        alarmGainRef.current.gain.cancelScheduledValues(now);
        alarmGainRef.current.gain.setTargetAtTime(highTone ? 0.06 : 0.038, now, 0.03);
      }, 260);
    } catch (err) {
      console.warn("Could not start alarm audio:", err);
      setAlarmEnabled(false);
    }
  };

  const stopAlarm = () => {
    if (alarmSweepTimerRef.current) {
      window.clearInterval(alarmSweepTimerRef.current);
      alarmSweepTimerRef.current = undefined;
    }

    if (alarmOscillatorRef.current && alarmGainRef.current && audioContextRef.current) {
      const osc = alarmOscillatorRef.current;
      const gain = alarmGainRef.current;
      const now = audioContextRef.current.currentTime;

      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.035);

      setTimeout(() => {
        try {
          osc.stop();
        } catch {
          // ignore
        }
      }, 90);

      alarmOscillatorRef.current = null;
      alarmGainRef.current = null;
    }

    setAlarmActive(false);
  };

  // Synchronize alarm sound to alarmEnabled / danger states
  useEffect(() => {
    const alarmSyncTimer = window.setTimeout(() => {
      if (alarmEnabled && isDanger) {
        void startAlarm();
      } else {
        stopAlarm();
      }
    }, 0);

    return () => {
      window.clearTimeout(alarmSyncTimer);
      stopAlarm();
    };
  }, [alarmEnabled, isDanger]);

  const toggleAlarm = () => {
    if (alarmActive) {
      setAlarmEnabled(false);
    } else {
      setAlarmEnabled(true);
    }
  };

  const phaseColor = phaseColors[step.phase] || phaseColors.REASON;

  const valueClass = (status: string) => {
    if (["ACTIVE", "PROTECTED", "COMPLETE", "LINKED"].includes(status)) {
      return "green";
    }
    if (["SUSPENDED", "VERIFYING", "WRITING", "FLAGGED", "AWAITING"].includes(status)) {
      return "amber";
    }
    if (status === "REISSUED") {
      return "green";
    }
    if (status === "ESCALATED") {
      return "red";
    }
    return "";
  };

  const progressW = (key: string) => {
    switch (key) {
      case "risk":
        return `${step.riskScore / 10}%`;
      case "card":
        return step.cardStatus === "ACTIVE" ? "34%" : step.cardStatus === "SUSPENDED" ? "72%" : "92%";
      case "response":
        return `${Math.max(26, 100 - Number.parseFloat(step.response) * 18)}%`;
      case "audit":
        return step.audit === "COMPLETE" ? "100%" : step.audit === "WATCHING" ? "38%" : "72%";
      case "phase":
        return step.phase === "REASON" ? "38%" : step.phase === "ACT" ? "72%" : "100%";
      default:
        return "40%";
    }
  };

  return (
    <div className="knight-agent-visualizer">
      <section
        ref={sceneRef}
        className={`scene ${variant === "mobile" ? "scene-mobile" : ""} ${isDanger ? "is-danger" : ""} ${step.assistantMessage ? "is-speaking" : ""}`}
        data-mood={step.mood}
        style={{
          ["--phase-color" as any]: phaseColor,
          ["--mood-color" as any]: isDanger ? "#ff2d55" : phaseColor,
        }}
        onPointerMove={handlePointerMove}
        aria-label="KNIGHT animated agent fraud protection visual workspace"
      >
        {/* Radar Grid Background */}
        <div className="radar-grid" aria-hidden="true">
          <div className="radar-sweep" />
          <div className="radar-circle rc-1" />
          <div className="radar-circle rc-2" />
          <div className="radar-circle rc-3" />
        </div>

        {/* Starry background */}
        <div className="stars">
          {starsList.map((star, idx) => (
            <span
              key={idx}
              className="star"
              style={{
                left: star.left,
                top: star.top,
                ["--d" as any]: star.d,
                ["--o" as any]: star.o,
                ["--delay" as any]: star.delay,
              }}
            />
          ))}
        </div>

        <div className="signal-field" />

        {/* Floating dust particles */}
        <div className="particles" aria-hidden="true">
          {particlesList.map((part, idx) => (
            <span
              key={idx}
              className="particle"
              style={{
                left: part.x,
                top: part.y,
                ["--dur" as any]: part.dur,
                ["--del" as any]: part.del,
                ["--drift" as any]: part.drift,
              }}
            >
              {part.label}
            </span>
          ))}
        </div>

        {/* Name tag */}
        <header className="name-tag">
          <div className="title">CO-OPBANK KNIGHT</div>
          <div className="subtitle">Hiệp sĩ số bảo vệ thẻ giao dịch tự động</div>
        </header>

        {/* Reasoning thought bubble */}
        <section className="thought-bubble" aria-live="polite">
          <div className="thought-header">
            <span className="thought-dot" />
            <span>Reasoning</span>
          </div>
          <p className="thought-line">{step.thought}</p>
          <div className="thought-meta">
            <span className="phase-pill">{step.phase}</span>
            <span className="phase-pill">{step.action}</span>
          </div>
        </section>

        {/* Center stage with visual character */}
        <section className="agent-stage" aria-hidden="true">
          <div className="agent-wrap">
            <div className="orbit-ring">
              <div className="orbit-dot" />
            </div>
            <div className="orbit-ring2">
              <div className="orbit-dot2" />
            </div>
            <div className="orbit-ring3">
              <div className="orbit-dot3" />
            </div>

            <div className="helmet">
              <div className="crest" />
              <div className="visor">
                <div className="eye" />
                <div className="eye" />
              </div>
              <div className="scan-beam" aria-hidden="true" />
            </div>

            <div className="knight-body">
              <div className="arms">
                <div className="arm left">
                  <div className="beam" />
                  <div className="shield" aria-hidden="true">
                    <svg viewBox="0 0 100 120" className="shield-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 22 C10 22, 50 6, 50 6 C50 6, 90 22, 90 22 C90 64, 74 98, 50 116 C26 98, 10 64, 10 22 Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 30 C20 30, 50 16, 50 16 C50 16, 80 30, 80 30 C80 64, 67 92, 50 107 C33 92, 20 64, 20 30 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
                      <line x1="50" y1="22" x2="50" y2="100" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                      <line x1="22" y1="55" x2="78" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                      <polygon points="50,38 63,52 50,66 37,52" fill="currentColor" opacity="0.25" />
                      <polygon points="50,38 63,52 50,66 37,52" stroke="currentColor" strokeWidth="2.5" fill="none" />
                      <circle cx="50" cy="52" r="4" fill="#ffffff" opacity="0.9" />
                      <circle cx="50" cy="52" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
                    </svg>
                  </div>
                </div>
                <div className="arm right">
                  <div className="beam" />
                  <div className="sword" aria-hidden="true">
                    <div className="sword-blade" />
                    <div className="sword-guard" />
                    <div className="sword-hilt" />
                    <div className="sword-pommel" />
                  </div>
                </div>
              </div>
              <div className="armor">
                <div className="chest-panel">
                  <div className="panel-line" />
                  <div className="panel-text">
                    <div className="badge-icon" />
                    <div className="badge-title">{step.badgeTitle}</div>
                    <div className="badge-sub">{step.badgeSubtitle}</div>
                  </div>
                </div>
                <div className="shoulder-row">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>

            <div className="legs">
              <div className="leg">
                <div className="boot" />
              </div>
              <div className="leg">
                <div className="boot" />
              </div>
            </div>
          </div>

          <aside className="assistant-layer" aria-hidden="true">
            <div className="assistant-min">
              <span className="live-dot" />
              <span>KNIGHT đang canh gác</span>
            </div>
            <div className="assistant-shell">
              <div className="assistant-top">
                <div className="assistant-label">
                  <span className="live-dot" />
                  <span>KNIGHT xuất hiện</span>
                </div>
                <div className="assistant-avatar" />
              </div>
              <p className="assistant-text">{step.assistantMessage}</p>
              <div className="assistant-actions">
                <span className="action-chip">{step.action}</span>
                <span className="action-chip">explain()</span>
                <span className="action-chip">notify_user()</span>
              </div>
            </div>
          </aside>
        </section>

        {/* Right stats panel */}
        <aside className="status-panel" aria-label="Trạng thái hệ thống">
          <div className={`status-card ${step.hot === "risk" ? "is-hot" : ""}`}>
            <div className="status-label">
              <span>Risk Score</span>
            </div>
            <div
              className={`status-value ${
                step.riskScore >= 850 ? "red" : step.riskScore >= 650 ? "amber" : "green"
              }`}
            >
              {step.riskScore} / 1000
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ ["--w" as any]: progressW("risk") }} />
            </div>
          </div>

          <div className={`status-card ${step.hot === "card" ? "is-hot" : ""}`}>
            <div className="status-label">
              <span>Trạng thái thẻ</span>
            </div>
            <div className={`status-value ${valueClass(step.cardStatus)}`}>{step.cardStatus}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ ["--w" as any]: progressW("card") }} />
            </div>
          </div>

          <div className={`status-card ${step.hot === "response" ? "is-hot" : ""}`}>
            <div className="status-label">
              <span>Phản ứng</span>
            </div>
            <div className="status-value green">{step.response}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ ["--w" as any]: progressW("response") }} />
            </div>
          </div>

          <div className={`status-card ${step.hot === "audit" ? "is-hot" : ""}`}>
            <div className="status-label">
              <span>Audit Log</span>
            </div>
            <div className={`status-value ${valueClass(step.audit)}`}>{step.audit}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ ["--w" as any]: progressW("audit") }} />
            </div>
          </div>

          <div className={`status-card ${step.hot === "phase" ? "is-hot" : ""}`}>
            <div className="status-label">
              <span>Vòng lặp ReAct</span>
            </div>
            <div className="status-value" style={{ color: phaseColor }}>
              {step.phase}
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ ["--w" as any]: progressW("phase") }} />
            </div>
          </div>
        </aside>

        {/* Bottom Alert Popup */}
        <div className="alert-popup" role="status" aria-live="polite">
          <span className="alert-icon" />
          <span id="alert-msg">{step.alert}</span>
        </div>

        {/* Sound Alarm Control */}
        <button
          className={`alarm-control ${alarmActive ? "is-armed" : ""}`}
          onClick={toggleAlarm}
          type="button"
          aria-pressed={alarmActive}
        >
          <span className="alarm-glyph" aria-hidden="true" />
          <span>
            {!isDanger
              ? "Còi sẵn sàng"
              : alarmActive
              ? "Tắt còi"
              : "Bật còi cảnh báo"}
          </span>
        </button>
      </section>
    </div>
  );
}
