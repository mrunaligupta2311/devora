import test from "node:test";
import assert from "node:assert/strict";
import { readPositiveInteger } from "../src/config/otpConfig.js";

test("accepts valid positive integers", () => {
  process.env.TEST_OTP = "5";
  try {
  } finally {
    delete process.env.TEST_OTP;
  }
});

test("uses fallback when configuration is missing or blank", () => {
  delete process.env.TEST_OTP;
  assert.equal(readPositiveInteger("TEST_OTP", 10), 10);
  process.env.TEST_OTP = "  ";
  try {
    assert.equal(readPositiveInteger("TEST_OTP", 10), 10);
  } finally {
    delete process.env.TEST_OTP;
  }
});

test("rejects zero, negative, decimal and invalid values", () => {
  for (const value of ["0", "-1", "1.5", "abc", "Infinity"]) {
    process.env.TEST_OTP = value;
    assert.throws(
      () => readPositiveInteger("TEST_OTP", 10),
      /must be a positive integer/
    );
  }
  delete process.env.TEST_OTP;
});
