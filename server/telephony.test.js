// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  createTelephonyConfig,
  createTelephonyService,
  maskPhoneNumber,
  validateTwilioWebhook,
} from "./telephony.js";

const liveEnv = {
  TELEPHONY_MODE: "live",
  HIGH_RISK_CALL_DELAY_MS: "9000",
  TWILIO_ACCOUNT_SID: "test-twilio-account-sid",
  TWILIO_AUTH_TOKEN: "test-auth-token",
  TWILIO_FROM_NUMBER: "+15550001111",
  TWILIO_ALLOWED_TO_NUMBERS: "+84901234567,+84987654321",
  KNIGHT_DEMO_CUSTOMER_PHONE_E164: "+84901234567",
  TWILIO_WEBHOOK_BASE_URL: "https://knight-api.example.com",
};

function makeClient() {
  return {
    calls: {
      create: vi.fn().mockResolvedValue({ sid: "CA123" }),
    },
    messages: {
      create: vi.fn().mockResolvedValue({ sid: "SM123" }),
    },
  };
}

describe("Twilio telephony service", () => {
  it("masks phone numbers before they are shown in logs or UI", () => {
    expect(maskPhoneNumber("+84901234567")).toBe("+849****4567");
    expect(maskPhoneNumber("not-a-phone")).toBe("[invalid phone]");
  });

  it("creates an outbound voice call with TwiML and status callbacks", async () => {
    const config = createTelephonyConfig(liveEnv);
    const client = makeClient();
    const service = createTelephonyService(config, { client, log: vi.fn() });

    const result = await service.placeVoiceAlertCall({ incidentId: "INC-1" });

    expect(result).toEqual({ mode: "live", sid: "CA123", toMasked: "+849****4567" });
    expect(client.calls.create).toHaveBeenCalledWith({
      to: "+84901234567",
      from: "+15550001111",
      url: "https://knight-api.example.com/api/twilio/voice-alert?incidentId=INC-1",
      statusCallback: "https://knight-api.example.com/api/twilio/voice-status?incidentId=INC-1",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
    });
  });

  it("rejects non-allowlisted recipients before any Twilio call is placed", async () => {
    const config = createTelephonyConfig({
      ...liveEnv,
      KNIGHT_DEMO_CUSTOMER_PHONE_E164: "+84900000000",
    });
    const client = makeClient();
    const service = createTelephonyService(config, { client, log: vi.fn() });

    await expect(service.placeVoiceAlertCall({ incidentId: "INC-2" })).rejects.toThrow(/allowlist/i);
    expect(client.calls.create).not.toHaveBeenCalled();
  });

  it("sends one SMS after no-answer callbacks and ignores duplicate callbacks", async () => {
    const config = createTelephonyConfig(liveEnv);
    const client = makeClient();
    const service = createTelephonyService(config, { client, log: vi.fn() });

    const first = await service.handleVoiceStatus({
      incidentId: "INC-3",
      callStatus: "no-answer",
    });
    const second = await service.handleVoiceStatus({
      incidentId: "INC-3",
      callStatus: "no-answer",
    });

    expect(first).toEqual({ smsSent: true, ignored: false, sid: "SM123" });
    expect(second).toEqual({ smsSent: false, ignored: true });
    expect(client.messages.create).toHaveBeenCalledTimes(1);
    expect(client.messages.create).toHaveBeenCalledWith({
      to: "+84901234567",
      from: "+15550001111",
      body: expect.stringContaining("Co-opBank KNIGHT"),
    });
    expect(client.messages.create.mock.calls[0][0].body).not.toMatch(/https?:\/\//i);
    expect(client.messages.create.mock.calls[0][0].body).not.toMatch(/\b\d{13,19}\b/);
    expect(client.messages.create.mock.calls[0][0].body.toLowerCase()).not.toContain("otp");
    expect(client.messages.create.mock.calls[0][0].body.toLowerCase()).not.toContain("cvv");
  });

  it("does not send SMS when the voice call is answered", async () => {
    const config = createTelephonyConfig(liveEnv);
    const client = makeClient();
    const service = createTelephonyService(config, { client, log: vi.fn() });

    const result = await service.handleVoiceStatus({
      incidentId: "INC-4",
      callStatus: "answered",
    });

    expect(result).toEqual({ smsSent: false, ignored: true });
    expect(client.messages.create).not.toHaveBeenCalled();
  });

  it("rejects invalid Twilio webhook signatures", () => {
    expect(
      validateTwilioWebhook({
        authToken: "test-auth-token",
        signature: "bad-signature",
        url: "https://knight-api.example.com/api/twilio/voice-status?incidentId=INC-5",
        params: { CallStatus: "no-answer" },
        validateRequest: () => false,
      }),
    ).toBe(false);
  });
});
