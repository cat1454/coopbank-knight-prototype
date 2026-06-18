
import { PrimaryButton } from "../../../shared/ui";
import { checklistItems } from "../model/threatLensUi";
import type { ThreatLensScenarioViewModel } from "../model/useThreatLensScenario";

interface ThreatLensChecklistProps {
  threatLens: ThreatLensScenarioViewModel;
}

export function ThreatLensChecklist({ threatLens }: ThreatLensChecklistProps) {
  if (!threatLens.decision?.requiresChecklist) return null;

  return (
<div className="threatlens-checklist">
              {checklistItems.map((item, index) => (
                <label key={item} style={{ color: "var(--color-ink)" }}>
                  <input
                    type="checkbox"
                    checked={threatLens.checkedItems[index]}
                    onChange={(event) => {
                      threatLens.setCheckedItems((current) =>
                        current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                      );
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
              <p className="threatlens-progress" style={{ color: "var(--color-ink)" }}>Đã xác nhận {threatLens.checkedCount}/6 mục</p>
              <PrimaryButton disabled={!threatLens.isChecklistComplete}>Tiếp tục xác thực Face ID</PrimaryButton>
            </div>
  );
}
