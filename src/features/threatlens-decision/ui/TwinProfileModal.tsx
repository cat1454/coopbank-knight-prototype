import { useState } from "react";
import { X, ShieldCheck, ShieldAlert, Activity, Eye, AlertTriangle, Home, Laptop, Plane, Utensils } from "lucide-react";
import { updateTwinPersonality, type TwinExplainResponse } from "../../../shared/api/twin";
import "./TwinProfileModal.css";
import "./TwinProfileModalContent.css";
import "./TwinProfileModalFooter.css";

interface TwinProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  twinExplain: TwinExplainResponse | null;
  onRefreshTwin?: () => void;
  onSelectScam?: (scamDetails: {
    bank: string;
    account: string;
    name: string;
    amount: string;
    content: string;
  }) => void;
}

export function TwinProfileModal({
  isOpen,
  onClose,
  twinExplain,
  onRefreshTwin,
  onSelectScam,
}: TwinProfileModalProps) {
  if (!isOpen) return null;

  return (
    <TwinProfileModalContent
      onClose={onClose}
      twinExplain={twinExplain}
      onRefreshTwin={onRefreshTwin}
      onSelectScam={onSelectScam}
    />
  );
}

function TwinProfileModalContent({
  onClose,
  twinExplain,
  onRefreshTwin,
  onSelectScam,
}: Omit<TwinProfileModalProps, "isOpen">) {
  const [activeTab, setActiveTab] = useState<"profile" | "scams">("profile");
  const [activePersonality, setActivePersonality] = useState<string>(() => {
    // Try to guess active personality from top spending
    const essentials = twinExplain?.explainSummary.topEssentialSpending || [];
    const hasGroceries = essentials.some(e => e.label.includes("Siêu thị"));
    const hasGadgets = essentials.some(e => e.label.includes("công nghệ"));
    const hasTravel = essentials.some(e => e.label.includes("Du lịch"));
    
    if (hasGadgets) return "tech_geek";
    if (hasTravel) return "traveler";
    if (hasGroceries && essentials.length <= 3) return "frugal";
    return "foodie";
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPersonality = async (id: string) => {
    setIsLoading(true);
    const success = await updateTwinPersonality("CID-001", id);
    if (success) {
      setActivePersonality(id);
      if (onRefreshTwin) {
        onRefreshTwin();
      }
    }
    setIsLoading(false);
  };

  const handleSelectScam = (scam: {
    bank: string;
    account: string;
    name: string;
    amount: string;
    content: string;
  }) => {
    if (onSelectScam) {
      onSelectScam(scam);
    }
    onClose();
  };

  const summary = twinExplain?.explainSummary;
  const thresholds = twinExplain?.adjustedThresholds;

  const getRiskDirectionLabel = (dir?: string) => {
    if (dir === "improving") return { label: "Đang cải thiện", color: "var(--color-success)" };
    if (dir === "worsening") return { label: "Đang tăng rủi ro", color: "var(--color-fraud)" };
    return { label: "Ổn định", color: "var(--color-info)" };
  };

  const getTrustLevelLabel = (level?: string) => {
    const l = level?.toLowerCase();
    if (l === "high") return { label: "Cực kỳ tin cậy (Hạng A)", color: "var(--color-success)" };
    if (l === "restricted") return { label: "Bị hạn chế (Hạng D)", color: "var(--color-fraud)" };
    if (l === "watch") return { label: "Cần theo dõi (Hạng C)", color: "var(--color-warning)" };
    return { label: "Tiêu chuẩn (Hạng B)", color: "var(--color-info)" };
  };

  const getConsentScopeLabel = (scope: string) => {
    switch (scope) {
      case "spending_analysis":
        return "Phân tích nhịp chi tiêu";
      case "device_behavioral":
        return "Giám sát thiết bị & phiên đăng nhập";
      case "beneficiary_graph":
        return "Đồ thị liên kết người nhận";
      case "post_incident_offer":
        return "Đề xuất phục hồi sau sự cố";
      case "push_critical_bypass":
        return "Cảnh báo khẩn cấp bỏ qua im lặng";
      default:
        return scope;
    }
  };

  const riskDir = getRiskDirectionLabel(summary?.riskDirection);
  const trustLvl = getTrustLevelLabel(summary?.trustLevel);

  return (
    <div className="twin-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div 
        className="twin-modal-card" 
        role="dialog" 
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", maxHeight: "85%", overflow: "hidden" }}
      >
        {/* Header */}
        <div className="twin-modal-header" style={{ flexShrink: 0 }}>
          <div className="twin-header-title">
            <Activity className="twin-pulse-icon" size={20} />
            <div>
              <h3>Bản sao số Bảo mật AI</h3>
              <span className="twin-subtitle">Hồ sơ hành vi & giám sát KNIGHT</span>
            </div>
          </div>
          <button type="button" className="twin-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="twin-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-line)", padding: "0 16px", background: "var(--color-bg)", flexShrink: 0 }}>
          <button
            type="button"
            className={`twin-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "profile" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "profile" ? "var(--color-primary)" : "var(--color-muted)",
              fontWeight: activeTab === "profile" ? "bold" : "normal",
              fontSize: "var(--text-sm)",
              cursor: "pointer"
            }}
            onClick={() => setActiveTab("profile")}
          >
            Hồ sơ & Bản sao số
          </button>
          <button
            type="button"
            className={`twin-tab-btn ${activeTab === "scams" ? "active" : ""}`}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "scams" ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: activeTab === "scams" ? "var(--color-primary)" : "var(--color-muted)",
              fontWeight: activeTab === "scams" ? "bold" : "normal",
              fontSize: "var(--text-sm)",
              cursor: "pointer"
            }}
            onClick={() => setActiveTab("scams")}
          >
            Kịch bản lừa đảo mẫu
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="twin-modal-body" style={{ flexGrow: 1, overflowY: "auto", padding: "16px" }}>
          {twinExplain ? (
            <>
              {activeTab === "profile" ? (
                <>
                  {/* Dynamic Personality Template Selector */}
                  <div className="twin-section" style={{ marginBottom: "20px", borderBottom: "1px solid var(--color-line)", paddingBottom: "16px" }}>
                    <h4 className="twin-section-title">Phong cách chi tiêu & Sở thích</h4>
                    <p className="twin-section-desc" style={{ marginBottom: "12px" }}>
                      Chọn một cấu hình dữ liệu mẫu để thay đổi hành vi chi tiêu của Bản sao số:
                    </p>
                    <div className="personality-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {[
                        {
                          id: "frugal",
                          label: "Gia đình Tiết kiệm",
                          desc: "Điện nước, siêu thị. Giao dịch giờ hành chính.",
                          icon: <Home size={18} style={{ color: activePersonality === "frugal" ? "var(--color-primary)" : "var(--color-muted)", marginTop: "2px", flexShrink: 0 }} />
                        },
                        {
                          id: "tech_geek",
                          label: "Tín đồ Công nghệ",
                          desc: "Mua sắm online Shopee/Lazada, săn sale đêm muộn.",
                          icon: <Laptop size={18} style={{ color: activePersonality === "tech_geek" ? "var(--color-primary)" : "var(--color-muted)", marginTop: "2px", flexShrink: 0 }} />
                        },
                        {
                          id: "traveler",
                          label: "Tín đồ Du lịch",
                          desc: "Vé máy bay, khách sạn ở Hà Nội, Đà Nẵng, Đà Lạt.",
                          icon: <Plane size={18} style={{ color: activePersonality === "traveler" ? "var(--color-primary)" : "var(--color-muted)", marginTop: "2px", flexShrink: 0 }} />
                        },
                        {
                          id: "foodie",
                          label: "Ẩm thực & Giải trí",
                          desc: "GrabFood, rạp phim CGV, cà phê cuối tuần.",
                          icon: <Utensils size={18} style={{ color: activePersonality === "foodie" ? "var(--color-primary)" : "var(--color-muted)", marginTop: "2px", flexShrink: 0 }} />
                        }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleSelectPersonality(p.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "var(--radius-md)",
                            border: activePersonality === p.id ? "2.5px solid var(--color-primary)" : "1.5px solid var(--color-line)",
                            background: activePersonality === p.id ? "rgba(23, 92, 211, 0.08)" : "var(--color-surface)",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            gap: "8px",
                            alignItems: "flex-start",
                            transition: "all 0.2s ease",
                            opacity: isLoading ? 0.6 : 1
                          }}
                        >
                          {p.icon}
                          <div>
                            <strong style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-ink)" }}>{p.label}</strong>
                            <span style={{ display: "block", fontSize: "10px", color: "var(--color-muted)", marginTop: "2px", lineHeight: "1.3" }}>{p.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trust Score circular-like card */}
                  <div className="twin-score-section">
                    <div className="twin-score-ring">
                      <div className="twin-score-val">{summary?.trustScore}</div>
                      <span className="twin-score-label">Điểm Tin cậy</span>
                    </div>
                    <div className="twin-score-meta">
                      <div className="meta-row">
                        <span className="meta-label">Cấp độ:</span>
                        <strong style={{ color: trustLvl.color }}>{trustLvl.label}</strong>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Rủi ro:</span>
                        <strong style={{ color: riskDir.color }}>{riskDir.label}</strong>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Sự cố ghi nhận:</span>
                        <strong>{summary?.incidentCount ?? 0} lần</strong>
                      </div>
                    </div>
                  </div>

                  {/* Adjustments (Dynamic Thresholds) */}
                  <div className="twin-section">
                    <h4 className="twin-section-title">Hộ vệ AI Tự điều chỉnh (Dynamic Policies)</h4>
                    <p className="twin-section-desc">
                      KNIGHT liên tục học hỏi thói quen của bạn để tự cân chỉnh các thông số bảo vệ, tránh làm phiền khi bạn giao dịch hợp lệ.
                    </p>
                    <div className="twin-adjustments-grid">
                      <div className="adjustment-item">
                        <span className="adjustment-label">Ngưỡng tự động khóa (L2)</span>
                        <strong className="adjustment-value">{thresholds?.suspendThreshold} / 1000</strong>
                        <span className="adjustment-note">Tự tăng khi xác thực sinh trắc thành công</span>
                      </div>
                      <div className="adjustment-item">
                        <span className="adjustment-label">Thời gian chờ phản hồi</span>
                        <strong className="adjustment-value">{thresholds?.timeoutMinutes} phút</strong>
                        <span className="adjustment-note">Tối ưu theo thời gian phản hồi trước đó</span>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Baseline (Essential categories) */}
                  <div className="twin-section">
                    <h4 className="twin-section-title">Nhịp sinh hoạt & Chi tiêu Thiết yếu</h4>
                    <p className="twin-section-desc">
                      KNIGHT nhận diện các chi tiêu thiết yếu của bạn để tự động ưu tiên bảo vệ và đề xuất hỗ trợ khi có biến động lớn.
                    </p>
                    <div className="twin-spending-list">
                      {summary?.topEssentialSpending && summary.topEssentialSpending.length > 0 ? (
                        summary.topEssentialSpending.map((item, index) => (
                          <div className="spending-progress-row" key={index}>
                            <div className="spending-progress-info">
                              <span>{item.label}</span>
                              <strong>{item.sharePercent}% chi tiêu</strong>
                            </div>
                            <div className="spending-progress-bar">
                              <div 
                                className="spending-progress-fill" 
                                style={{ width: `${item.sharePercent}%`, background: "linear-gradient(90deg, #175cd3, #bf5af2)" }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="twin-empty-text">Chưa phân tích được nhịp chi tiêu.</p>
                      )}
                    </div>
                  </div>

                  {/* Beneficiary Graph Signals */}
                  <div className="twin-section">
                    <h4 className="twin-section-title">Đồ thị liên kết người nhận</h4>
                    <div className="twin-beneficiary-signals">
                      {summary?.flaggedBeneficiaries && summary.flaggedBeneficiaries.length > 0 ? (
                        <div className="beneficiary-warnings-list">
                          {summary.flaggedBeneficiaries.map((ben, idx) => (
                            <div className="beneficiary-warning-item" key={idx}>
                              <ShieldAlert className="warning-icon" size={16} />
                              <div className="warning-content">
                                <strong>{ben.label}</strong>
                                <span>
                                  {ben.isNew ? "Lần đầu giao dịch" : "Người nhận cũ"}
                                  {ben.scamTypology && ` · Khớp hành vi: ${ben.scamTypology}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="twin-success-box">
                          <ShieldCheck size={16} className="success-icon" />
                          <span>Không ghi nhận người nhận nào đáng ngờ trong đồ thị.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Consents */}
                  <div className="twin-section">
                    <h4 className="twin-section-title">Quyền giám sát được đồng ý</h4>
                    <div className="twin-consents-tags">
                      {twinExplain.activeConsents.map((consent, index) => (
                        <span className="consent-tag" key={index}>
                          <Eye size={10} style={{ marginRight: 4 }} />
                          {getConsentScopeLabel(consent)}
                        </span>
                      ))}
                      {twinExplain.activeConsents.length === 0 && (
                        <p className="twin-empty-text">Chưa cấp bất kỳ quyền giám sát nào.</p>
                      )}
                    </div>
                  </div>

                  {/* Security signals from current session */}
                  {summary?.sessionRiskSignals && summary.sessionRiskSignals.length > 0 && (
                    <div className="twin-section-warning">
                      <div className="warning-header">
                        <AlertTriangle size={14} />
                        <strong>Cảnh báo phiên hiện tại</strong>
                      </div>
                      <ul>
                        {summary.sessionRiskSignals.map((sig, idx) => (
                          <li key={idx}>{sig}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                /* Tab 2: Scam scenarios */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="twin-section" style={{ margin: 0 }}>
                    <h4 className="twin-section-title" style={{ marginBottom: "6px" }}>Mẫu tình huống lừa đảo công nghệ cao</h4>
                    <p className="twin-section-desc" style={{ marginBottom: "16px" }}>
                      Chọn một tình huống lừa đảo dưới đây để thử nghiệm. Hệ thống sẽ tự điền vào biểu mẫu Chuyển tiền và cho phép bạn xem phản ứng của KNIGHT AI:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {[
                        {
                          id: "scam_remote_access",
                          title: "1. Mã độc APK điều khiển từ xa (Vishing)",
                          desc: "Mạo danh công an/thuế ép cài APK chứa mã độc. Kẻ gian chiếm quyền điều khiển thiết bị lạ có VPN quẹt chuyển 50 triệu lúc 2h sáng.",
                          action: "Khóa L2 (Chặn chuyển khoản & khóa thẻ)",
                          actionColor: "var(--color-fraud)",
                          bank: "Co-opBank",
                          account: "88884920412",
                          name: "Lừa đảo: Mã độc APK",
                          amount: "50000000",
                          content: "Nop phat thue"
                        },
                        {
                          id: "scam_fake_job",
                          title: "2. Tuyển CTV giật đơn hàng (Task Scam)",
                          desc: "Dẫn dụ làm nhiệm vụ nhận hoa hồng tăng dần trên web giả mạo. Khách nạp tiền số lượng lớn 15 triệu từ thiết bị mới.",
                          action: "Tạm giữ 5 phút (Delay để gọi xác minh)",
                          actionColor: "var(--color-warning)",
                          bank: "BIDV",
                          account: "99992019482",
                          name: "Lừa đảo: Tuyển CTV giật đơn",
                          amount: "15000000",
                          content: "Thanh toan don hang giat don"
                        },
                        {
                          id: "scam_phishing",
                          title: "3. Nhận quà tri ân / SMS Phishing",
                          desc: "Khách click link SMS mạo danh, nhập thông tin tài khoản. Kẻ gian quẹt thẻ online 10 triệu mua hàng từ thiết bị ở Singapore.",
                          action: "Xác thực khuôn mặt (Face ID sinh trắc học)",
                          actionColor: "var(--color-primary)",
                          bank: "Agribank",
                          account: "77771020412",
                          name: "Lừa đảo: SMS Phishing tri ân",
                          amount: "10000000",
                          content: "Nhan thuong tri an"
                        },
                        {
                          id: "scam_romance",
                          title: "4. Lừa đảo tình cảm & Sàn đầu tư ảo",
                          desc: "Bị dụ dỗ yêu đương qua app rồi rủ đầu tư chứng khoán ảo. Khách tự chuyển khoản 8 triệu đến tài khoản cá nhân lạ đáng ngờ.",
                          action: "Cảnh báo + Checklist rà soát Đồng hành",
                          actionColor: "var(--color-success)",
                          bank: "Vietcombank",
                          account: "66661902847",
                          name: "Lừa đảo: Sàn đầu tư ảo",
                          amount: "8000000",
                          content: "Nap tien dau tu"
                        }
                      ].map((scam) => (
                        <div
                          key={scam.id}
                          style={{
                            padding: "12px",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-line)",
                            background: "var(--color-surface)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <strong style={{ fontSize: "var(--text-xs)", color: "var(--color-ink)" }}>{scam.title}</strong>
                            <span style={{ 
                              fontSize: "9px", 
                              padding: "2px 6px", 
                              borderRadius: "10px", 
                              background: "rgba(255, 255, 255, 0.15)",
                              color: scam.actionColor, 
                              border: `1.5px solid ${scam.actionColor}`, 
                              fontWeight: "bold",
                              whiteSpace: "nowrap"
                            }}>
                              {scam.action}
                            </span>
                          </div>
                          <p style={{ fontSize: "11px", color: "var(--color-muted)", margin: 0, lineHeight: "1.4" }}>{scam.desc}</p>
                          
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            marginTop: "4px", 
                            paddingTop: "8px", 
                            borderTop: "1px dashed var(--color-line)" 
                          }}>
                            <div style={{ fontSize: "10px", color: "var(--color-muted)" }}>
                              <span>Số tiền: <strong>{Number(scam.amount).toLocaleString('vi-VN')} VND</strong></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectScam(scam)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-primary)",
                                color: "white",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                transition: "background 0.2s"
                              }}
                            >
                              Thử nghiệm chuyển tiền
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="twin-loading">
              <span className="spinner"></span>
              <p>Đang đối chiếu dữ liệu Bản sao số...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="twin-modal-footer" style={{ flexShrink: 0 }}>
          <button type="button" className="twin-modal-close-btn" onClick={onClose}>
            Đóng hồ sơ bảo mật
          </button>
        </div>
      </div>
    </div>
  );
}
