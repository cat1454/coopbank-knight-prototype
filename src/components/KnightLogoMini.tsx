import "../styles/knight-logo.css";

interface KnightLogoMiniProps {
  size?: number;
  className?: string;
}

export function KnightLogoMini({ size = 36, className = "" }: KnightLogoMiniProps) {
  return (
    <img
      src="/logo.png"
      alt="Logo hệ thống KNIGHT"
      className={`knight-logo-mini ${className}`}
      width={size}
      height={size}
    />
  );
}
