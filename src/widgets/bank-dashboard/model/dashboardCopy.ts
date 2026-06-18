export type ThreatLensLevelSetting = "max" | "standard" | "min";

export const getFriendlyAiLevel = (level: string) => {
  switch (level) {
    case "safe": return "An toàn";
    case "watch": return "Cần giám sát";
    case "verify": return "Cần xác thực";
    case "hold": return "Tạm giữ";
    case "critical": return "Cảnh báo cao";
    default: return level;
  }
};

export const getFriendlyPolicy = (policy: string) => {
  const lower = policy.toLowerCase();
  if (lower.includes("l2")) return "Tự động khóa thẻ";
  if (lower.includes("l3")) return "Khóa thẻ & Chặn GD lạ";
  return policy;
};

export const getThreatLensLevelLabel = (level: ThreatLensLevelSetting) => {
  if (level === "min") return "Tối thiểu";
  if (level === "max") return "Tối đa";
  return "Đồng hành";
};

export const getThreatLensLevelTransferCopy = (level: ThreatLensLevelSetting) => {
  if (level === "min") {
    return "chỉ cảnh báo mềm, bạn phải tự xác nhận trách nhiệm nếu vẫn muốn chuyển.";
  }

  if (level === "max") {
    return "nâng cảnh báo thành xác thực tăng cường và có thể tạm giữ giao dịch.";
  }

  return "phân tích rủi ro, yêu cầu checklist an toàn và mở Tổng đài khi còn nghi ngờ.";
};

export const getDeviceName = () => {
  if (typeof window === "undefined" || !window.navigator) return "Thiết bị này";
  const ua = window.navigator.userAgent;
  
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  
  if (/Android/i.test(ua)) {
    const parts = ua.split(";");
    for (let part of parts) {
      part = part.trim();
      if (part.includes("Build/")) {
        const model = part.split("Build/")[0].trim();
        if (model) return model;
      }
      if (/SM-[A-Z0-9]+/i.test(part)) {
        return "Samsung " + part.match(/SM-[A-Z0-9]+/i)?.[0];
      }
    }
    
    if (/Samsung/i.test(ua)) return "Samsung Galaxy";
    if (/Pixel/i.test(ua)) return "Google Pixel";
    if (/Xiaomi|Redmi|Poco/i.test(ua)) return "Xiaomi";
    if (/OPPO/i.test(ua)) return "OPPO";
    if (/Vivo/i.test(ua)) return "Vivo";
    if (/Huawei/i.test(ua)) return "Huawei";
    
    return "Điện thoại Android";
  }
  
  if (/Windows NT/i.test(ua)) return "Windows PC";
  if (/Macintosh/i.test(ua)) return "macOS PC";
  
  return "Thiết bị này";
};

// ─── Face ID Verification Screen ────────────────────────────────────────────
