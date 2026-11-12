import test from "node:test";
import assert from "node:assert/strict";

let storedRecord = null;
let sentEmail = null;
let attemptUpdates = 0;
let transactionMode = "success";
let transactionCalls = {};

const prisma = {
  user: {
    findUnique: async () => null,
  },
  otpVerification: {
    create: async ({ data }) => {
      storedRecord = {
        id: "otp-1",
        attempts: 0,
        consumedAt: null,
        ...data,
      };
      return storedRecord;
    },
    findFirst: async () => storedRecord,
    findUnique: async () => storedRecord ? {
      consumedAt: storedRecord.consumedAt,
      expiresAt: storedRecord.expiresAt,
      attempts: storedRecord.attempts,
    } : null,
    updateMany: async ({ where, data }) => {
      attemptUpdates += 1;

      const eligible =
        storedRecord &&
        storedRecord.id === where.id &&
        storedRecord.consumedAt === null &&
        storedRecord.expiresAt > where.expiresAt.gt &&
        storedRecord.attempts < where.attempts.lt;

      if (!eligible) return { count: 0 };

      storedRecord.attempts += data.attempts.increment;
      return { count: 1 };
    },
    delete: async () => ({}),
    deleteMany: async () => ({ count: 1 }),
  },
};

const argon2 = {
  hash: async () => "hashed-new-password",
};

const transactionClient = {
  otpVerification: {
    updateMany: async ({ where, data }) => {
      transactionCalls.consumeWhere = where;

      if (transactionMode === "reject") {
        return { count: 0 };
      }

      const valid =
        storedRecord &&
        storedRecord.id === where.id &&
        storedRecord.consumedAt === null &&
        storedRecord.expiresAt > where.expiresAt.gt &&
        storedRecord.attempts < where.attempts.lt;

      if (!valid) return { count: 0 };

      storedRecord.consumedAt = data.consumedAt;
      return { count: 1 };
    },
  },

  user: {
    update: async (args) => {
      transactionCalls.userUpdate = args;
      return {};
    },
  },

  userSession: {
    updateMany: async (args) => {
      transactionCalls.sessionRevocation = args;
      return { count: 2 };
    },
  },
};

prisma.$transaction = async (callback) => callback(transactionClient);

test.mock.module("../src/config/database.js", {
  namedExports: { prisma },
});

test.mock.module("../src/services/emailService.js", {
  namedExports: {
    sendBrevoEmail: async ({ htmlContent }) => {
      sentEmail = htmlContent;
    },
  },
});

test.mock.module("argon2", {
  defaultExport: argon2,
});

process.env.OTP_HASH_SECRET = "test-otp-secret";

const {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = await import("../src/services/passwordResetService.js");

async function createValidResetOtp() {
  prisma.user.findUnique = async () => ({
    id: "user-1",
    name: "Test User",
    email: "user@example.com",
  });

  storedRecord = null;
  sentEmail = null;
  transactionMode = "success";
  transactionCalls = {};

  await requestPasswordReset({
    email: "user@example.com",
  });

  const match = sentEmail.match(/>(\d{6})<\/div>/);

  assert.ok(match, "Email should contain a six-digit OTP");

  storedRecord.testCode = match[1];

  return storedRecord.testCode;
}

// Existing password-reset tests

test("unknown email is rejected without sending an OTP", async () => {
  prisma.user.findUnique = async () => null;
  sentEmail = null;

  await assert.rejects(
    requestPasswordReset({ email: "missing@example.com" }),
    /No Devora account exists/i
  );

  assert.equal(sentEmail, null);
});

test("registered email receives a reset OTP", async () => {
  const code = await createValidResetOtp();

  assert.ok(sentEmail);
  assert.ok(storedRecord.expiresAt);
  assert.ok(storedRecord.codeHash);
  assert.match(code, /^\d{6}$/);
});

test("correct OTP is accepted", async () => {
  const code = await createValidResetOtp();

  const result = await verifyPasswordResetOtp({
    email: "user@example.com",
    code,
  });

  assert.match(result.message, /confirmed/i);
});

test("incorrect OTP is rejected and attempts are incremented", async () => {
  await createValidResetOtp();

  const previousAttempts = attemptUpdates;

  await assert.rejects(
    verifyPasswordResetOtp({
      email: "user@example.com",
      code: "000000",
    }),
    /Invalid verification code/i
  );

  assert.equal(attemptUpdates, previousAttempts + 1);
});

test("expired OTP is rejected", async () => {
  const code = await createValidResetOtp();

  storedRecord.expiresAt = new Date(Date.now() - 1000);

  await assert.rejects(
    verifyPasswordResetOtp({
      email: "user@example.com",
      code,
    }),
    /expired/i
  );
});

// New password-reset transaction tests

test("successful password reset consumes OTP and revokes existing sessions", async () => {
  const code = await createValidResetOtp();

  const result = await resetPassword({
    email: "user@example.com",
    code,
    newPassword: "NewSecurePassword123",
  });

  assert.match(result.message, /Password reset successfully/i);

  // OTP must be consumed.
  assert.ok(storedRecord.consumedAt instanceof Date);

  // Password must be hashed before database update.
  assert.deepEqual(transactionCalls.userUpdate, {
    where: { id: "user-1" },
    data: { passwordHash: "hashed-new-password" },
  });

  // Existing refresh sessions must be revoked.
  assert.deepEqual(transactionCalls.sessionRevocation.where, {
    userId: "user-1",
    revokedAt: null,
  });

  assert.ok(transactionCalls.sessionRevocation.data.revokedAt instanceof Date);

  // OTP consumption must enforce expiry and attempt limits.
  assert.ok(transactionCalls.consumeWhere.expiresAt.gt instanceof Date);
  assert.equal(transactionCalls.consumeWhere.attempts.lt, 5);
});

test("password reset stops when OTP cannot be consumed transactionally", async () => {
  const code = await createValidResetOtp();

  transactionMode = "reject";

  await assert.rejects(
    resetPassword({
      email: "user@example.com",
      code,
      newPassword: "NewSecurePassword123",
    }),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /no longer valid/i);
      return true;
    }
  );

  // Password update and session revocation must not execute.
  assert.equal(transactionCalls.userUpdate, undefined);
  assert.equal(transactionCalls.sessionRevocation, undefined);
});


test("concurrent incorrect OTP attempts cannot exceed the configured limit", async () => {
  await createValidResetOtp();

  storedRecord.attempts = 4;

  const results = await Promise.allSettled([
    verifyPasswordResetOtp({
      email: "user@example.com",
      code: "000000",
    }),
    verifyPasswordResetOtp({
      email: "user@example.com",
      code: "111111",
    }),
  ]);

  assert.equal(storedRecord.attempts, 5);
  assert.equal(results.filter((r) => r.status === "rejected").length, 2);
  assert.ok(results.some(
    (r) => r.status === "rejected" && r.reason.statusCode === 429
  ));
});
