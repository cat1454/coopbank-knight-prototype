
import { PrimaryButton } from "../../../shared/ui";
import { checklistItems } from "../model/guardianFlowUi";
import type { GuardianFlowScenarioViewModel } from "../model/useGuardianFlowScenario";

interface GuardianChecklistProps {
  guardianFlow: GuardianFlowScenarioViewModel;
}

export function GuardianChecklist({ guardianFlow }: GuardianChecklistProps) {
  if (!guardianFlow.decision?.requiresChecklist) return null;

  return (
<div className="guardian-checklist">
              {checklistItems.map((item, index) => (
                <label key={item} style={{ color: "var(--color-ink)" }}>
                  <input
                    type="checkbox"
                    checked={guardianFlow.checkedItems[index]}
                    onChange={(event) => {
                      guardianFlow.setCheckedItems((current) =>
                        current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)),
                      );
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
              <p className="guardian-progress" style={{ color: "var(--color-ink)" }}>Đã xác nhận {guardianFlow.checkedCount}/6 mục</p>
              <PrimaryButton disabled={!guardianFlow.isChecklistComplete}>Tiếp tục xác thực Face ID</PrimaryButton>
            </div>
  );
}
