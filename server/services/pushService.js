const PUSH_MESSAGES = [
  {
    title: "🚨 CẢNH BÁO KHẨN — Co-opBank KNIGHT",
    body: "Phát hiện giao dịch bất thường. Thẻ số đã được tạm khóa. Mở ứng dụng để xác minh ngay!",
  },
  {
    title: "⚠️ KNIGHT: Giao dịch đáng ngờ bị chặn",
    body: "Có giao dịch tại thiết bị lạ lúc 02:00. KNIGHT đã tạm khóa thẻ — Nhấn để xác nhận.",
  },
  {
    title: "🛡️ KNIGHT AI đang chờ xác minh của bạn",
    body: "Thẻ số vẫn đang tạm khóa. Bạn có 60 giây để mở Co-opBank và xác minh giao dịch.",
  },
  {
    title: "🔴 Hành động cần thiết — KNIGHT Alert",
    body: "Tài khoản của bạn đang trong tình trạng cảnh báo cao. Nhấn để mở Co-opBank ngay bây giờ!",
  },
];

export function createPushService({ webPush, subscriptionStore, logSystem }) {
  let pushMessageIndex = 0;
  let repeatPushInterval = null;

  async function sendPushToAll(alert = {}) {
    const msg = PUSH_MESSAGES[pushMessageIndex % PUSH_MESSAGES.length];
    pushMessageIndex += 1;

    const title = alert.title || msg.title;
    const body = alert.message || alert.body || msg.body;
    const navigateUrl = alert.url || "/?alert=1";
    const payload = JSON.stringify({
      title,
      body,
      url: navigateUrl,
      tag: "knight-critical-alert",
      icon: "/logo.png",
      badge: "/logo.png",
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    for (const [endpoint, subscription] of subscriptionStore.entries()) {
      try {
        await webPush.sendNotification(subscription, payload, {
          TTL: 60,
          urgency: "high",
          topic: "knight-alert",
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = Number(error?.statusCode || error?.status || 0);

        if (statusCode === 404 || statusCode === 410) {
          subscriptionStore.delete(endpoint);
          removed += 1;
        } else {
          logSystem(
            `Push send failed: status=${statusCode || "unknown"} message=${error.message || error} body=${error.body || ""}`,
          );
        }
      }
    }

    if (removed > 0) {
      subscriptionStore.save();
    }

    if (subscriptionStore.size === 0) {
      logSystem("Chưa có push subscription. Mở PWA trên điện thoại và bật thông báo trước.");
    } else {
      logSystem(`Push #${pushMessageIndex} gửi: sent=${sent}, failed=${failed}, removed=${removed}`);
    }

    return { total: subscriptionStore.size + removed, sent, failed, removed };
  }

  function startRepeatPush(incidentId, isIncidentActive) {
    if (repeatPushInterval) return;
    logSystem(`Bắt đầu push lặp mỗi 8 giây cho incident ${incidentId}...`);
    repeatPushInterval = setInterval(async () => {
      if (!isIncidentActive()) {
        stopRepeatPush();
        return;
      }
      await sendPushToAll();
    }, 8000);
  }

  function stopRepeatPush() {
    if (repeatPushInterval) {
      clearInterval(repeatPushInterval);
      repeatPushInterval = null;
      logSystem("Dừng push lặp.");
    }
  }

  function resetPushCycle() {
    pushMessageIndex = 0;
  }

  return {
    resetPushCycle,
    sendPushToAll,
    startRepeatPush,
    stopRepeatPush,
  };
}
