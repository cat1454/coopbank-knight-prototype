import fs from "fs";

export function isValidSubscription(subscription) {
  return Boolean(
    subscription &&
      typeof subscription.endpoint === "string" &&
      subscription.endpoint.length > 0 &&
      subscription.keys &&
      typeof subscription.keys.auth === "string" &&
      typeof subscription.keys.p256dh === "string",
  );
}

export function createPushSubscriptionStore({ subscriptionsFile, logSystem }) {
  let subscriptions = new Map();

  function load() {
    if (!fs.existsSync(subscriptionsFile)) {
      return;
    }

    try {
      const raw = fs.readFileSync(subscriptionsFile, "utf8");
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);

      subscriptions = new Map();
      entries.forEach((subscription) => {
        if (isValidSubscription(subscription)) {
          subscriptions.set(subscription.endpoint, subscription);
        }
      });
    } catch (error) {
      logSystem(`Could not load push subscriptions: ${error.message}`);
    }
  }

  function save() {
    try {
      const tmpFile = `${subscriptionsFile}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify([...subscriptions.values()], null, 2), "utf8");
      fs.renameSync(tmpFile, subscriptionsFile);
    } catch (error) {
      logSystem(`Could not save push subscriptions: ${error.message}`);
    }
  }

  return {
    load,
    save,
    get size() {
      return subscriptions.size;
    },
    entries() {
      return subscriptions.entries();
    },
    set(subscription) {
      subscriptions.set(subscription.endpoint, subscription);
    },
    delete(endpoint) {
      return subscriptions.delete(endpoint);
    },
  };
}
