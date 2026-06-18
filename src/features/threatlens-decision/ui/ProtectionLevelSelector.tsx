
import { Check } from "lucide-react";
import type { ThreatLensScenarioViewModel } from "../model/useThreatLensScenario";

interface ProtectionLevelSelectorProps {
  threatLens: ThreatLensScenarioViewModel;
}

export function ProtectionLevelSelector({ threatLens }: ProtectionLevelSelectorProps) {
  return (
          <div className="threatlens-levels-section" style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: "16px", marginBottom: "8px" }}>
            <span className="threatlens-kicker" style={{ color: "var(--color-trust)" }}>Cấu hình bảo vệ (Luật BV DLCN 2025)</span>
            <h3 style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)", margin: "4px 0 10px", fontWeight: "700" }}>Chọn Cấp độ Kiểm soát AI</h3>
            
            <div className="threatlens-levels-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                {
                  id: "min" as const,
                  name: "Tối thiểu",
                  desc: "Cảnh báo thụ động, không tự chặn tiền.",
                  color: "var(--color-trust)"
                },
                {
                  id: "standard" as const,
                  name: "Đồng hành",
                  desc: "Phân tích, hỗ trợ checklist & Tổng đài.",
                  color: "var(--color-trust)"
                },
                {
                  id: "max" as const,
                  name: "Tối đa",
                  desc: "Tự động khóa & Xác thực tăng cường.",
                  color: "var(--color-trust)"
                }
              ].map((lvl) => {
                const isActive = threatLens.threatLensLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`threatlens-level-card ${isActive ? "active" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "10px 6px",
                      borderRadius: "10px",
                      border: isActive ? `1.5px solid var(--color-trust)` : "1px solid var(--color-line)",
                      background: isActive ? "rgba(23, 92, 211, 0.04)" : "var(--color-surface)",
                      color: "var(--color-ink)",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: isActive ? "0 4px 10px rgba(23, 92, 211, 0.08)" : "none"
                    }}
                    onClick={() => threatLens.setThreatLensLevel(lvl.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "var(--color-trust)" }}>{lvl.name}</span>
                      {isActive && <Check size={12} style={{ color: "var(--color-trust)" }} />}
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--color-muted)", lineHeight: "1.25" }}>{lvl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
  );
}
