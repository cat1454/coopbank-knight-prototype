import fs from "fs";
import webPush from "web-push";

export function loadVapidKeys(vapidKeysFile, logSystem) {
  const configuredPublicKey = process.env.VAPID_PUBLIC_KEY;
  const configuredPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (configuredPublicKey && configuredPrivateKey) {
    return {
      source: "environment",
      publicKey: configuredPublicKey,
      privateKey: configuredPrivateKey,
    };
  }

  if (fs.existsSync(vapidKeysFile)) {
    try {
      const keys = JSON.parse(fs.readFileSync(vapidKeysFile, "utf8"));
      if (keys.publicKey && keys.privateKey) {
        return {
          source: "local file",
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        };
      }
    } catch (error) {
      logSystem(`Could not read local VAPID keys: ${error.message}`);
    }
  }

  const keys = webPush.generateVAPIDKeys();
  fs.writeFileSync(vapidKeysFile, JSON.stringify(keys, null, 2), "utf8");

  return {
    source: "generated local file",
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}
