
export function isoAt(hour: number, minute = 0) {
  return `2026-06-16T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`;
}

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function hourFromTimestamp(timestamp: string) {
  return new Date(timestamp).getHours();
}
