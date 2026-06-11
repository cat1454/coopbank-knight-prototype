import { Play, RotateCcw, TimerReset } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

interface DemoControlsProps {
  onStart: () => void;
  onJumpFraud: () => void;
  onJumpLegitimate: () => void;
  onJumpTimeout: () => void;
  onReset: () => void;
}

export function DemoControls({
  onStart,
  onJumpFraud,
  onJumpLegitimate,
  onJumpTimeout,
  onReset,
}: DemoControlsProps) {
  return (
    <aside className="demo-controls" aria-label="Demo controls">
      <PrimaryButton icon={<Play size={16} />} onClick={onStart} variant="ghost">
        Start
      </PrimaryButton>
      <PrimaryButton onClick={onJumpFraud} variant="ghost">
        Fraud
      </PrimaryButton>
      <PrimaryButton onClick={onJumpLegitimate} variant="ghost">
        Legit
      </PrimaryButton>
      <PrimaryButton icon={<TimerReset size={16} />} onClick={onJumpTimeout} variant="ghost">
        Timeout
      </PrimaryButton>
      <PrimaryButton icon={<RotateCcw size={16} />} onClick={onReset} variant="ghost">
        Reset
      </PrimaryButton>
    </aside>
  );
}
