import { ArrowRight, Clock3, MoonStar, ShieldCheck, SunMedium } from "lucide-react";
import type { KnightScenarioState } from "../../../domain/types";
import { PrimaryButton, StatusPill } from "../../../shared/ui";

interface NextMorningRecoveryScreenProps {
  state: KnightScenarioState;
  onObserveBehavior: () => void;
}

export function NextMorningRecoveryScreen({
  state,
  onObserveBehavior,
}: NextMorningRecoveryScreenProps) {
  return (
    <section className="screen screen--next-morning" aria-labelledby="next-morning-title">
      <div className="screen-kicker">
        <SunMedium size={18} aria-hidden="true" />
        <span>Sáng hôm sau · 08:30</span>
      </div>

      <h1 id="next-morning-title">Bắt đầu phục hồi niềm tin đúng thời điểm</h1>
      <p className="screen-lead">
        Đêm qua KNIGHT chỉ thực hiện nhiệm vụ khẩn cấp: chặn rủi ro, khóa thẻ cũ, cấp thẻ mới và tạo hồ sơ tra soát.
      </p>

      <div className="overnight-protection-panel">
        <div>
          <MoonStar size={20} aria-hidden="true" />
          <span>02:00 · Xử lý khẩn cấp</span>
          <strong>Tài khoản được bảo vệ</strong>
        </div>
        <div>
          <Clock3 size={20} aria-hidden="true" />
          <span>08:30 · Theo dõi sau sự cố</span>
          <strong>Đủ dữ liệu để đánh giá nhu cầu</strong>
        </div>
      </div>

      <StatusPill tone="success">
        <ShieldCheck size={14} aria-hidden="true" />
        Thẻ mới đang hoạt động · Hồ sơ {state.fraudCase?.id}
      </StatusPill>

      <p className="reasoning-note">
        KNIGHT không gửi gói hỗ trợ lúc khách hàng đang xử lý khẩn cấp trong đêm. Phiên phục hồi chỉ bắt đầu vào khung giờ phù hợp.
      </p>

      <PrimaryButton icon={<ArrowRight size={18} />} onClick={onObserveBehavior}>
        Mở phiên phục hồi buổi sáng
      </PrimaryButton>
    </section>
  );
}
