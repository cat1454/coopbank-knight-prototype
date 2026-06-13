self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "KNIGHT Alert",
      body: event.data.text(),
    };
  }

  const notification = payload.notification || payload;
  const title = notification.title || "CẢNH BÁO KNIGHT";
  const targetUrl = notification.url || notification.navigate || "/?alert=1";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body || "Phát hiện giao dịch bất thường. Thẻ số đã được tạm khóa.",
      icon: notification.icon || "/logo.png",
      badge: notification.badge || "/logo.png",
      tag: notification.tag || "knight-critical-alert",
      renotify: true,
      data: {
        url: targetUrl,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/?alert=1", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (clients) => {
        for (const client of clients) {
          if ("navigate" in client && "focus" in client) {
            await client.navigate(targetUrl);
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
