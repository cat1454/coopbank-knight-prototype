import type { Dispatch, SetStateAction } from "react";
import { ArrowRightLeft, CreditCard, Home, Settings as SettingsIcon, ShieldCheck } from "lucide-react";

export type BankDashboardTab = "home" | "card" | "transfer" | "knight" | "settings";

interface BottomTabsProps {
  activeTab: BankDashboardTab;
  setActiveTab: Dispatch<SetStateAction<BankDashboardTab>>;
}

export function BottomTabs({ activeTab, setActiveTab }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs" aria-label="Thanh điều hướng chính">
      <button
        type="button"
        className={`tab-btn ${activeTab === "home" ? "active" : ""}`}
        onClick={() => setActiveTab("home")}
      >
        <Home size={20} />
        <span>Trang chủ</span>
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === "card" ? "active" : ""}`}
        onClick={() => setActiveTab("card")}
      >
        <CreditCard size={20} />
        <span>Thẻ</span>
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === "transfer" ? "active" : ""}`}
        onClick={() => setActiveTab("transfer")}
      >
        <ArrowRightLeft size={20} />
        <span>Chuyển tiền</span>
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === "knight" ? "active" : ""}`}
        onClick={() => setActiveTab("knight")}
      >
        <ShieldCheck size={20} />
        <span>Hộ vệ AI</span>
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
        onClick={() => setActiveTab("settings")}
      >
        <SettingsIcon size={20} />
        <span>Cài đặt</span>
      </button>
    </nav>
  );
}
