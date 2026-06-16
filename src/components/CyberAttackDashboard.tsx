import { useEffect, useState, useRef } from "react";
import { 
  ShieldAlert, 
  Activity, 
  CreditCard, 
  AlertTriangle, 
  Globe, 
  Terminal, 
  Lock, 
  Clock, 
  Smartphone,
  Play,
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react";
import type { KnightScenarioState } from "../domain/types";
import { formatVnd } from "../domain/format";
import type { AlarmAudioController } from "../hooks/useAlarmAudio";
import { KnightAgentVisual } from "./KnightAgentVisual";

interface CyberAttackDashboardProps {
  state: KnightScenarioState;
  alarmAudio: AlarmAudioController;
}

type SimPhase = "idle" | "hacking" | "blocked";

export function CyberAttackDashboard({ state, alarmAudio }: CyberAttackDashboardProps) {
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [systemTime, setSystemTime] = useState("");
  const [dataPackets, setDataPackets] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showAgentPopup, setShowAgentPopup] = useState(false);
  const logsIntervalRef = useRef<number | undefined>(undefined);

  // Format the transaction timestamp for a professional look
  const formatTxnTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString("vi-VN") + " - " + date.toLocaleTimeString("vi-VN", { hour12: false });
    } catch {
      return "02:00:00 - 01/06/2026";
    }
  };

  // 1. Live system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString("vi-VN", { hour12: false }) + 
        ":" + 
        String(now.getMilliseconds()).padStart(3, "0")
      );
    };
    const intervalTime = setInterval(updateTime, 100);
    updateTime();
    return () => clearInterval(intervalTime);
  }, []);

  // 2. Logs and progress simulator when phase transitions
  useEffect(() => {
    if (phase !== "hacking") {
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = undefined;
      }
      return;
    }

    const logTemplates = [
      "ACCESSING: bank-vault.debit-cards...",
      "EXPLOITING: auth-token bypass vulnerability...",
      "STATUS: extracting user balance details...",
      "TRANSFER: creating transaction package of 10M VND...",
      "SYS: routing packet via Singapore proxy node...",
      "WARNING: high volume debit event registered...",
      "LOG: buffer stream dumping transaction tokens...",
      "HACK: bypassing CVV validator check..."
    ];

    let currentProgress = 0;

    const runSimulation = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 2; // Grow by 2-5%
      
      if (currentProgress >= 75) {
        currentProgress = 75; // Halt exactly at 75% for AI Intervention
        clearInterval(runSimulation);
        setPhase("blocked");
        setShowAgentPopup(true);
        
        // Trigger red alarm siren
        if (!isMuted) {
          alarmAudio.startAlarm();
        }

        setDataPackets((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString("vi-VN", { hour12: false })}] [ALERT] CO-OPBANK KNIGHT AI INTRUSION DETECTED!`,
          `[${new Date().toLocaleTimeString("vi-VN", { hour12: false })}] [SHIELD] TRANSACTION BLOCKED (RISK SCORE 847).`,
          `[${new Date().toLocaleTimeString("vi-VN", { hour12: false })}] [ACTION] POLICY L2 SUSPENSION TRIGGERED. LOCKING CARD...`
        ]);
      } else {
        setProgress(currentProgress);
        
        // Push a random log packet occasionally
        if (Math.random() > 0.4) {
          setDataPackets((prev) => {
            const next = [
              ...prev, 
              `[${new Date().toLocaleTimeString("vi-VN", { hour12: false })}] ${logTemplates[Math.floor(Math.random() * logTemplates.length)]}`
            ];
            return next.slice(-15);
          });
        }
      }
    }, 120); // Count up quickly

    return () => {
      clearInterval(runSimulation);
    };
  }, [phase, isMuted, alarmAudio]);

  // Clean up alarm audio on unmount
  useEffect(() => {
    return () => {
      alarmAudio.stopAlarm();
    };
  }, [alarmAudio]);

  // Trigger Exploit
  const startSimulation = () => {
    alarmAudio.stopAlarm();
    setDataPackets([
      "[INIT] Hacker payload injected successfully.",
      "[CONN] Secure port opened at card-vault gateway.",
      "[SESS] Session authorized with leaked credentials."
    ]);
    setProgress(0);
    setPhase("hacking");
  };

  // Reset Simulation
  const resetSimulation = () => {
    alarmAudio.stopAlarm();
    setPhase("idle");
    setProgress(0);
    setShowAgentPopup(false);
    setDataPackets([]);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (phase === "blocked") {
        alarmAudio.startAlarm();
      }
    } else {
      setIsMuted(true);
      alarmAudio.stopAlarm();
    }
  };

  // Determine dynamic risk flag statuses based on current state & mock data
  const hasNewDevice = state.riskAssessment.signals.some((s) => s.code === "NEW_DEVICE");
  const hasVpn = state.riskAssessment.signals.some((s) => s.code.includes("VPN") || s.code.includes("SG"));
  const hasVelocity = state.riskAssessment.signals.some((s) => s.code.includes("VELOCITY"));

  const scorePercent = Math.min(100, Math.max(0, (state.riskAssessment.score / 1000) * 100));
  const patternMatchPercent = (state.riskAssessment.score * 0.11 + 1).toFixed(1);

  // Dynamic values depending on simulation phase
  const getCardStatus = () => {
    if (phase === "idle") return { text: "ACTIVE (MONITORED)", class: "cyber-field__value--success" };
    if (phase === "hacking") return { text: "EXPLOITING VAULT...", class: "cyber-field__value--active" };
    return { text: "BLOCKED & LOCKED BY KNIGHT AI", class: "cyber-field__value--critical" };
  };

  const getTxnStatusText = () => {
    if (phase === "idle") return "WAITING FOR TRANSACTION INITIATION";
    if (phase === "hacking") return `EXTRACTION IN PROGRESS (${progress}%)`;
    return "ALERT: INTERCEPTED & BLOCKED BY AI";
  };

  return (
    <div className="cyber-sim-viewport" aria-label="Cybersecurity Control Room Simulation">
      <div className={`cyber-sim-container cyber-sim-container--${phase}`}>
        
        {/* Aesthetic scanline bar */}
        <div className="cyber-scanline" />

        {/* ── HEADER ── */}
        <header className="cyber-header">
          <h1 className="cyber-header__title">
            <ShieldAlert size={26} color="var(--cyber-neon-red)" />
            Co-opBank KNIGHT · Cyber Security Cockpit
          </h1>

          {/* Interactive Controller Buttons */}
          <div className="cyber-trigger-panel">
            {phase === "idle" && (
              <button className="cyber-btn" onClick={startSimulation}>
                <Play size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Initiate Cyber Attack Simulation
              </button>
            )}
            {phase === "hacking" && (
              <button className="cyber-btn" disabled style={{ borderColor: 'var(--cyber-neon-orange)', color: 'var(--cyber-neon-orange)' }}>
                <Activity size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Funds Extraction Active ({progress}%)
              </button>
            )}
            {phase === "blocked" && (
              <>
                <button className="cyber-btn cyber-btn--red" onClick={resetSimulation}>
                  <RotateCcw size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Replay Simulation
                </button>
                <button className="cyber-btn" onClick={toggleMute} style={{ borderColor: 'var(--cyber-neon-orange)', color: 'var(--cyber-neon-orange)' }}>
                  {isMuted ? (
                    <>
                      <Volume2 size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Unmute Siren
                    </>
                  ) : (
                    <>
                      <VolumeX size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Mute Siren
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="cyber-header__info">
            <span>
              SYSTEM STATUS: <strong className={phase === "blocked" ? "cyber-field__value--critical" : "cyber-field__value--success"}>{phase === "blocked" ? "THREAT DETECTED" : "SECURE"}</strong>
            </span>
            <span>
              LOG TIME: <strong>{systemTime}</strong>
            </span>
            <span>
              SESSION: <strong>SEC-RUN-091</strong>
            </span>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <div className="cyber-grid">
          
          {/* 1. LEFT PANEL: Compromised Card Profile */}
          <section className="cyber-panel cyber-panel--danger" aria-labelledby="card-profile-title">
            <h2 id="card-profile-title" className="cyber-panel__title">
              <CreditCard size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Compromised Card Profile
            </h2>
            <div className="cyber-panel__content">
              {/* Futuristic Credit Card Shape */}
              <div className="cyber-card-graphic" aria-hidden="true">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="cyber-card-graphic__bank">Co-opBank</span>
                  <div className="cyber-card-graphic__chip" />
                </div>
                <div className="cyber-card-graphic__pan">
                  {state.card.maskedPan}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#79a6b8' }}>
                  <span>CARD ID: {state.card.id}</span>
                  <span>DEBIT ONLY</span>
                </div>
              </div>

              {/* Data fields */}
              <div className="cyber-field">
                <span className="cyber-field__label">CARD HOLDER</span>
                <span className="cyber-field__value">{state.customer.name}</span>
              </div>

              <div className="cyber-field">
                <span className="cyber-field__label">BANK OF ORIGIN</span>
                <span className="cyber-field__value">Co-opBank (QTDND Partner)</span>
              </div>

              <div className="cyber-field">
                <span className="cyber-field__label">CURRENT CARD STATUS</span>
                <span className={`cyber-field__value ${getCardStatus().class}`}>
                  {getCardStatus().text}
                </span>
              </div>

              <div className="cyber-field">
                <span className="cyber-field__label">DATA SOURCE</span>
                <span className="cyber-field__value cyber-field__value--warning">
                  Leaked DarkWeb Dataset
                </span>
              </div>

              <div className="cyber-field">
                <span className="cyber-field__label">RISK LEVEL</span>
                <span className={`cyber-field__value ${phase === "blocked" ? "cyber-field__value--critical" : "cyber-field__value--warning"}`}>
                  {phase === "blocked" ? "HIGH RISK CRITICAL" : "STANDBY"}
                </span>
              </div>
            </div>
          </section>

          {/* 2. MIDDLE PANEL: Unauthorized Transaction Attempt */}
          <section className="cyber-panel cyber-panel--active" aria-labelledby="txn-attempt-title">
            <h2 id="txn-attempt-title" className="cyber-panel__title">
              <Activity size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Unauthorized Transaction Attempt
            </h2>
            <div className="cyber-panel__content">
              {/* Detailed transaction data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="cyber-field">
                  <span className="cyber-field__label">MERCHANT</span>
                  <span className="cyber-field__value">{state.transaction.merchantName}</span>
                </div>
                <div className="cyber-field">
                  <span className="cyber-field__label">AMOUNT</span>
                  <span className={`cyber-field__value ${phase !== "idle" ? "cyber-field__value--critical" : ""}`}>
                    {formatVnd(state.transaction.amountVnd)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="cyber-field">
                  <span className="cyber-field__label">DEVICE INFO</span>
                  <span className="cyber-field__value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Smartphone size={13} color="var(--cyber-neon-cyan)" />
                    {state.transaction.deviceFingerprint}
                  </span>
                </div>
                <div className="cyber-field">
                  <span className="cyber-field__label">IP LOCATION</span>
                  <span className="cyber-field__value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={13} color="var(--cyber-neon-cyan)" />
                    {state.transaction.ipCountry} (via VPN)
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="cyber-field">
                  <span className="cyber-field__label">TRANSACTION TIME</span>
                  <span className="cyber-field__value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {formatTxnTime(state.transaction.occurredAt)}
                  </span>
                </div>
                <div className="cyber-field">
                  <span className="cyber-field__label">TRANSACTION STATUS</span>
                  <span className={`cyber-field__value ${phase === "blocked" ? "cyber-field__value--critical" : phase === "hacking" ? "cyber-field__value--success" : ""}`}>
                    {getTxnStatusText()}
                  </span>
                </div>
              </div>

              {/* Progress and Visuals of Extraction / Interception */}
              {phase === "hacking" && (
                <div className="cyber-progress-box">
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--cyber-neon-green)' }}>
                    🚨 HARVESTING CARD FUNDS:
                  </span>
                  <div className="cyber-progress-bar-bg">
                    <div className="cyber-progress-bar-fill" style={{ width: `${progress}%`, background: 'var(--cyber-neon-green)', boxShadow: '0 0 10px var(--cyber-neon-green)' }} />
                    <span className="cyber-progress-text">{progress}% EXTRACTED</span>
                  </div>
                </div>
              )}

              {phase === "blocked" && (
                <div className="cyber-progress-box" style={{ borderColor: 'var(--cyber-neon-red)', background: 'rgba(255, 51, 68, 0.05)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--cyber-neon-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} /> AI SECURITY INTERVENTION TRIGGERED:
                  </span>
                  <div className="cyber-progress-bar-bg" style={{ borderColor: 'rgba(255, 51, 68, 0.5)' }}>
                    <div className="cyber-progress-bar-fill" style={{ width: '75%', background: 'var(--cyber-neon-red)', boxShadow: '0 0 10px var(--cyber-neon-red)' }} />
                    <span className="cyber-progress-text" style={{ color: '#ffc1c7' }}>HALTED AT 75%</span>
                  </div>
                </div>
              )}

              {/* Threat Alert Highlight Box */}
              {phase === "blocked" && (
                <div className="cyber-threat-alert">
                  <div className="cyber-threat-alert__header">
                    <AlertTriangle size={14} />
                    AI Shield Active
                  </div>
                  <div className="cyber-threat-alert__body">
                    Hacker attempt to steal <strong>{formatVnd(state.transaction.amountVnd)}</strong> was successfully <strong>BLOCKED</strong> by Co-opBank KNIGHT AI. The security shield triggered a Direct Lock policy, protecting all assets.
                  </div>
                </div>
              )}

              {/* Real-time terminal log simulator */}
              <div style={{ flex: 1, background: '#020406', border: '1px solid rgba(0, 229, 255, 0.1)', padding: '10px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#558094', borderBottom: '1px solid rgba(0, 229, 255, 0.1)', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Terminal size={11} /> Live Intercept Data Stream
                </span>
                <div style={{ flex: 1, overflowY: 'hidden', fontSize: '9px', fontFamily: 'monospace', color: '#a3e8ff', lineHeight: '1.4' }}>
                  {dataPackets.map((log, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{log}</div>
                  ))}
                  {dataPackets.length === 0 && <div style={{ color: '#558094' }}>Initializing secure channel connection... Click "Initiate Cyber Attack Simulation" above.</div>}
                </div>
              </div>
            </div>
          </section>

          {/* 3. RIGHT PANEL: Risk Flags */}
          <section className="cyber-panel cyber-panel--danger" aria-labelledby="risk-flags-title">
            <h2 id="risk-flags-title" className="cyber-panel__title">
              <AlertTriangle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Cyber Risk Indicators
            </h2>
            <div className="cyber-panel__content">
              <div className="cyber-flag-list">
                
                {/* Flag 1: New Device */}
                <div className={`cyber-flag-item ${phase === "blocked" && hasNewDevice ? 'cyber-flag-item--active' : phase === "hacking" ? 'cyber-flag-item--active' : 'cyber-flag-item--normal'}`}
                     style={phase === "hacking" ? { borderLeftColor: 'var(--cyber-neon-cyan)' } : {}}>
                  <div className="cyber-flag-item__indicator" style={phase === "hacking" ? { backgroundColor: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' } : {}} />
                  <div>
                    <div className="cyber-flag-item__label">New Device Detected</div>
                    <div style={{ fontSize: '9px', color: '#79a6b8', marginTop: '2px' }}>Device ID not registered in secure vault</div>
                  </div>
                  <span className="cyber-flag-item__desc">
                    {phase === "blocked" ? "CRITICAL" : phase === "hacking" ? "ANALYZING" : "STANDBY"}
                  </span>
                </div>

                {/* Flag 2: Location Mismatch / VPN */}
                <div className={`cyber-flag-item ${phase === "blocked" && hasVpn ? 'cyber-flag-item--active' : phase === "hacking" ? 'cyber-flag-item--active' : 'cyber-flag-item--normal'}`}
                     style={phase === "hacking" ? { borderLeftColor: 'var(--cyber-neon-cyan)' } : {}}>
                  <div className="cyber-flag-item__indicator" style={phase === "hacking" ? { backgroundColor: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' } : {}} />
                  <div>
                    <div className="cyber-flag-item__label">Location Mismatch</div>
                    <div style={{ fontSize: '9px', color: '#79a6b8', marginTop: '2px' }}>IP location Singapore from active VPN list</div>
                  </div>
                  <span className="cyber-flag-item__desc">
                    {phase === "blocked" ? "SUSPICIOUS" : phase === "hacking" ? "ANALYZING" : "STANDBY"}
                  </span>
                </div>

                {/* Flag 3: Abnormal Amount */}
                <div className={`cyber-flag-item ${phase === "blocked" ? 'cyber-flag-item--active' : phase === "hacking" ? 'cyber-flag-item--active' : 'cyber-flag-item--normal'}`}
                     style={phase === "hacking" ? { borderLeftColor: 'var(--cyber-neon-cyan)' } : {}}>
                  <div className="cyber-flag-item__indicator" style={phase === "hacking" ? { backgroundColor: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' } : {}} />
                  <div>
                    <div className="cyber-flag-item__label">Abnormal Amount</div>
                    <div style={{ fontSize: '9px', color: '#79a6b8', marginTop: '2px' }}>Single request exceeds average spending</div>
                  </div>
                  <span className="cyber-flag-item__desc">
                    {phase === "blocked" ? "HIGH" : phase === "hacking" ? "EVALUATING" : "STANDBY"}
                  </span>
                </div>

                {/* Flag 4: Unusual Transaction Time */}
                <div className={`cyber-flag-item ${phase === "blocked" && hasVelocity ? 'cyber-flag-item--active' : phase === "hacking" ? 'cyber-flag-item--active' : 'cyber-flag-item--normal'}`}
                     style={phase === "hacking" ? { borderLeftColor: 'var(--cyber-neon-cyan)' } : {}}>
                  <div className="cyber-flag-item__indicator" style={phase === "hacking" ? { backgroundColor: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' } : {}} />
                  <div>
                    <div className="cyber-flag-item__label">Unusual Time & Speed</div>
                    <div style={{ fontSize: '9px', color: '#79a6b8', marginTop: '2px' }}>Midnight transaction velocity warning</div>
                  </div>
                  <span className="cyber-flag-item__desc">
                    {phase === "blocked" ? "TRIGGERED" : phase === "hacking" ? "EVALUATING" : "STANDBY"}
                  </span>
                </div>

                {/* Flag 5: OTP Challenge Status */}
                <div className="cyber-flag-item cyber-flag-item--normal" style={{ borderLeftColor: 'var(--cyber-neon-cyan)' }}>
                  <div className="cyber-flag-item__indicator" style={{ backgroundColor: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' }} />
                  <div>
                    <div className="cyber-flag-item__label" style={{ color: '#9bf0ff' }}>OTP Challenge Status</div>
                    <div style={{ fontSize: '9px', color: '#79a6b8', marginTop: '2px' }}>
                      {phase === "blocked" ? "Bypassed: Blocked prior to OTP transmission" : phase === "hacking" ? "Intercepting secure channels..." : "Standby"}
                    </div>
                  </div>
                  <span className="cyber-flag-item__desc" style={{ color: 'var(--cyber-neon-cyan)' }}>
                    {phase === "blocked" ? "INTERCEPTED" : phase === "hacking" ? "PENDING" : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Technical disclaimer */}
              <div style={{ background: 'rgba(0, 229, 255, 0.04)', border: '1px solid rgba(0, 229, 255, 0.15)', padding: '10px', borderRadius: '4px', fontSize: '10px', color: '#79a6b8', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--cyber-neon-cyan)', display: 'block', marginBottom: '4px' }}>🛡️ SECURITY CONTROL NOTICE:</span>
                This control room view is for simulation and forensic analysis only. No real credentials (CVV, passwords, OTP) are exposed or processed in this simulation.
              </div>
            </div>
          </section>

        </div>

        {/* ── FOOTER STATUS BAR ── */}
        <footer className="cyber-footer">
          <div className="cyber-engine-badge" style={phase === "idle" ? { color: '#79a6b8', textShadow: 'none' } : {}}>
            <div className="cyber-engine-badge__dot" style={phase === "idle" ? { backgroundColor: '#79a6b8', boxShadow: 'none', animation: 'none' } : {}} />
            AI Fraud Engine {phase === "idle" ? "Standby" : "Activated"}
          </div>

          <div className="cyber-stats">
            {/* Risk Score */}
            <div className="cyber-stat">
              <div className="cyber-stat__label">RISK SCORE:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span className={`cyber-stat__value ${phase === "blocked" ? "cyber-field__value--critical" : phase === "hacking" ? "cyber-field__value--warning" : ""}`}>
                  {phase === "blocked" ? `${state.riskAssessment.score} / 1000` : phase === "hacking" ? `${progress * 10} / 1000` : "000 / 1000"}
                </span>
                <div style={{ width: '100px', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${phase === "blocked" ? scorePercent : phase === "hacking" ? progress : 0}%`, height: '100%', background: 'var(--cyber-neon-cyan)', boxShadow: '0 0 6px var(--cyber-neon-cyan)' }} />
                </div>
              </div>
            </div>

            {/* Pattern Match */}
            <div className="cyber-stat">
              <div className="cyber-stat__label">BEHAVIOR MATCH:</div>
              <span className={`cyber-stat__value ${phase === "blocked" ? "cyber-field__value--warning" : ""}`}>
                {phase === "blocked" ? `${patternMatchPercent}% Pattern Match` : phase === "hacking" ? `${(progress * 1.1 + 5).toFixed(1)}% Evaluating` : "0% Match"}
              </span>
            </div>

            {/* Recommendation Decision */}
            <div className="cyber-stat">
              <div className="cyber-stat__label">AI RECOMMENDATION:</div>
              <span className="cyber-stat__value">
                {phase === "blocked" ? "AUTO_SUSPEND_CARD" : phase === "hacking" ? "EVALUATING ACTION..." : "STANDBY"}
              </span>
            </div>
          </div>

          <div className="cyber-decision-banner" style={phase === "idle" ? { background: 'transparent', borderColor: '#333', color: '#555', textShadow: 'none', boxShadow: 'none', animation: 'none' } : phase === "hacking" ? { background: 'rgba(0, 255, 102, 0.15)', borderColor: 'var(--cyber-neon-green)', color: 'var(--cyber-neon-green)', textShadow: 'var(--cyber-glow-green)', boxShadow: 'var(--cyber-glow-green)', animation: 'none' } : {}}>
            <Lock size={15} />
            {phase === "blocked" ? "TRANSACTION BLOCKED · CARD LOCKED" : phase === "hacking" ? "FUNDS TRANSFER ATTEMPTING" : "MONITORING ACTIVE"}
          </div>
        </footer>

      </div>

      {/* Futuristic holographic Knight AI agent popup overlay */}
      {showAgentPopup && (
        <div className="cyber-modal-overlay" onClick={() => setShowAgentPopup(false)}>
          <div className="cyber-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cyber-modal-header">
              <ShieldAlert size={20} color="var(--cyber-neon-red)" />
              <span>KNIGHT AI Active Shield Intervention</span>
            </div>
            <div className="cyber-modal-body">
              {/* Circular Hologram animated Knight AI Agent */}
              <div className="cyber-modal-agent-wrapper">
                <KnightAgentVisual state={state} variant="mobile" />
              </div>
              <div className="cyber-modal-info">
                <h3>Threat Intercepted & Isolated</h3>
                <p>
                  KNIGHT AI detected abnormal behavioral indicators during a transaction request of <strong>{formatVnd(state.transaction.amountVnd)}</strong> at <strong>{state.transaction.merchantName}</strong>. 
                </p>
                <div className="cyber-modal-details">
                  <div><strong>RISK LEVEL:</strong> <span style={{ color: 'var(--cyber-neon-red)', fontWeight: 'bold' }}>CRITICAL</span></div>
                  <div><strong>RISK SCORE:</strong> <span style={{ color: 'var(--cyber-neon-red)', fontWeight: 'bold' }}>847 / 1000</span></div>
                  <div><strong>IP COUNTRY:</strong> {state.transaction.ipCountry} (via VPN)</div>
                  <div><strong>POLICY APPLIED:</strong> L2 Temporary Suspend</div>
                </div>
              </div>
            </div>
            <div className="cyber-modal-footer">
              <button className="cyber-btn cyber-btn--red" onClick={() => setShowAgentPopup(false)}>
                Acknowledge & Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
