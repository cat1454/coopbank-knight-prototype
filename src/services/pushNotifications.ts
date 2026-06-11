import { buildBackendUrl } from "./backend";

const SERVICE_WORKER_URL = "/knight-sw.js?v=20260611-2";

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = `${base64Url}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function uint8ArrayToBase64Url(value: ArrayBuffer | null) {
  if (!value) {
    return "";
  }

  const bytes = new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isStandalonePwa() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

function isLikelyIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export async function enablePushNotifications() {
  if (!window.isSecureContext) {
    throw new Error("Can HTTPS de bat thong bao tren iPhone.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Trinh duyet nay khong ho tro Service Worker.");
  }

  if (!("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Hay Add to Home Screen va mo app tu icon KNIGHT tren iPhone.");
  }

  if (isLikelyIos() && !isStandalonePwa()) {
    throw new Error("Tren iPhone, hay Share -> Add to Home Screen roi mo tu icon KNIGHT.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Ban chua cap quyen thong bao cho KNIGHT.");
  }

  const publicKeyUrl = buildBackendUrl("/api/push/public-key");

  if (!publicKeyUrl) {
    throw new Error("Chua cau hinh VITE_BACKEND_URL cho backend laptop.");
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  const readyRegistration = await navigator.serviceWorker.ready;
  const activeRegistration = readyRegistration || registration;

  const publicKeyResponse = await fetch(publicKeyUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!publicKeyResponse.ok) {
    throw new Error("Khong lay duoc VAPID public key tu backend.");
  }

  const { publicKey } = (await publicKeyResponse.json()) as { publicKey?: string };

  if (!publicKey) {
    throw new Error("Backend chua cau hinh VAPID public key.");
  }

  let subscription = await activeRegistration.pushManager.getSubscription();
  const currentApplicationServerKey = uint8ArrayToBase64Url(subscription?.options.applicationServerKey ?? null);

  if (subscription && currentApplicationServerKey !== publicKey) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });
  }

  const subscribeResponse = await fetch(buildBackendUrl("/api/push/subscribe"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!subscribeResponse.ok) {
    throw new Error("Backend khong luu duoc Push Subscription.");
  }
}

export async function disablePushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  const activeRegistration = registration || (await navigator.serviceWorker.ready);
  const subscription = await activeRegistration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const unsubscribeUrl = buildBackendUrl("/api/push/unsubscribe");

  if (unsubscribeUrl) {
    await fetch(unsubscribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {
      // Local unsubscribe should still happen if the laptop backend is offline.
    });
  }

  await subscription.unsubscribe();
}
