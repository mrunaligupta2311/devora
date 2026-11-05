import test from "node:test";
import assert from "node:assert/strict";
import { getRefreshTokenDurationMs } from "../src/utils/tokenExpiry.js";

const originalValue = process.env.REFRESH_TOKEN_EXPIRES_IN;

function checkDuration(value, expected) {
  process.env.REFRESH_TOKEN_EXPIRES_IN = value;
  assert.equal(getRefreshTokenDurationMs(), expected);
}

test("refresh expiry parses 7d correctly", () => {
  checkDuration("7d", 7 * 86400000);
});

test("refresh expiry supports hours, minutes and seconds", () => {
  checkDuration("24h", 86400000);
  checkDuration("30m", 1800000);
  checkDuration("60s", 60000);
});

test("refresh expiry supports numeric days", () => {
  checkDuration("7", 7 * 86400000);
});

test("refresh expiry rejects invalid and zero durations", () => {
  assert.throws(() => checkDuration("invalid", 0));
  assert.throws(() => checkDuration("0d", 0));
});

test.after(() => {
  if (originalValue === undefined) {
    delete process.env.REFRESH_TOKEN_EXPIRES_IN;
  } else {
    process.env.REFRESH_TOKEN_EXPIRES_IN = originalValue;
  }
});
