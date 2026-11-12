import test from "node:test";
import assert from "node:assert/strict";

const prisma = {
  user: { findUnique: async () => null },
  userSession: { create: async () => ({}) },
};

const argon2 = {
  verify: async () => false,
};

test.mock.module("../src/config/database.js", {
  namedExports: { prisma },
});

test.mock.module("argon2", {
  defaultExport: argon2,
});

process.env.JWT_ACCESS_SECRET = "test-secret-for-auth-service";

const { login } = await import("../src/services/authService.js");

test("login rejects an email that has no account", async () => {
  prisma.user.findUnique = async () => null;

  await assert.rejects(
    login({ email: "missing@example.com", password: "Password123" }),
    (error) => {
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /No Devora account exists/i);
      return true;
    }
  );
});

test("login rejects an incorrect password", async () => {
  prisma.user.findUnique = async () => ({
    id: "user-1",
    passwordHash: "stored-hash",
  });

  argon2.verify = async () => false;

  await assert.rejects(
    login({ email: "user@example.com", password: "WrongPassword" }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.match(error.message, /Incorrect password/i);
      return true;
    }
  );
});

test("login accepts valid credentials and creates a session", async () => {
  prisma.user.findUnique = async () => ({
    id: "user-1",
    name: "Test User",
    email: "user@example.com",
    emailVerifiedAt: new Date(),
    passwordHash: "stored-hash",
  });

  argon2.verify = async () => true;
  prisma.userSession.create = async ({ data }) => ({
    ...data,
    id: "session-1",
  });

  const result = await login({
    email: "user@example.com",
    password: "CorrectPassword123",
  });

  assert.equal(result.user.id, "user-1");
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
});
