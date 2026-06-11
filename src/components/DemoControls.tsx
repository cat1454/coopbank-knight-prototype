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
      <PrimaryButton onClick={onStart} variant="ghost">
        Start
      </PrimaryButton>
      <PrimaryButton onClick={onJumpFraud} variant="ghost">
        Fraud
      </PrimaryButton>
      <PrimaryButton onClick={onJumpLegitimate} variant="ghost">
        Legit
      </PrimaryButton>
      <PrimaryButton onClick={onJumpTimeout} variant="ghost">
        Timeout
      </PrimaryButton>
      <PrimaryButton onClick={onReset} variant="ghost">
        Reset
      </PrimaryButton>
    </aside>
  );
}
