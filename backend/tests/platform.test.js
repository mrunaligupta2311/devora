import test from "node:test";
import assert from "node:assert/strict";
import {
  profileSchema,
  preferencesSchema,
  statusSchema,
  milestoneSchema,
} from "../src/validators/platformValidator.js";

test("profile validation accepts valid names", () => {
  assert.equal(profileSchema.safeParse({ name: "Mrunali Gupta" }).success, true);
});

test("profile validation rejects short names", () => {
  assert.equal(profileSchema.safeParse({ name: "A" }).success, false);
});

test("preferences validation accepts valid onboarding data", () => {
  assert.equal(
    preferencesSchema.safeParse({
      fields: ["Frontend"],
      level: "Intermediate",
      techStack: ["React"],
      goal: "Portfolio building",
      onboarded: true,
    }).success,
    true
  );
});

test("preferences validation rejects invalid skill levels", () => {
  assert.equal(
    preferencesSchema.safeParse({
      fields: [],
      level: "Expert",
      techStack: [],
      goal: "Portfolio",
    }).success,
    false
  );
});

test("project status validation rejects unsupported states", () => {
  assert.equal(statusSchema.safeParse({ status: "Deleted" }).success, false);
});

test("milestone validation requires a boolean", () => {
  assert.equal(milestoneSchema.safeParse({ completed: true }).success, true);
  assert.equal(milestoneSchema.safeParse({ completed: "yes" }).success, false);
});
