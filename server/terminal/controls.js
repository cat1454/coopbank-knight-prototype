import readline from "readline";

export function attachTerminalControls({ demoFlowIds, startDemoFlow, triggerAlert, triggerReset }) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on("keypress", (_str, key) => {
    if (key.ctrl && key.name === "c") {
      process.exit();
    }

    const keyName = key.name || "";
    if (keyName === "1") {
      startDemoFlow(demoFlowIds.NIGHT_PROTECTION);
    } else if (keyName === "2") {
      startDemoFlow(demoFlowIds.NEXT_MORNING_RECOVERY);
    } else if (keyName === "s" || keyName === "space" || keyName === "return") {
      triggerAlert();
    } else if (keyName === "r") {
      triggerReset();
    } else if (keyName === "q") {
      process.exit();
    }
  });
}
