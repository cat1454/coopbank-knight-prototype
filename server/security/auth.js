import crypto from "crypto";

export function createTokenMatcher(sendPushSecret) {
  return function tokenMatches(authorizationHeader) {
    if (!sendPushSecret) {
      return false;
    }

    const expected = `Bearer ${sendPushSecret}`;
    const actualBuffer = Buffer.from(authorizationHeader || "");
    const expectedBuffer = Buffer.from(expected);

    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  };
}
