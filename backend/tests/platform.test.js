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


import { serializeUserProjectState } from "../src/utils/projectStateSerializer.js";

test("user project serialization preserves the actual project ID", () => {
  const result = serializeUserProjectState({
    id: "state-123",
    userId: "user-123",
    projectId: "project-456",
    updatedAt: new Date(),
    status: "SAVED",
    project: { id: "project-456", title: "Test Project" },
  });

  assert.equal(result.id, "project-456");
  assert.equal(result.status, "Saved");
  assert.equal(result.userId, "user-123");
  assert.equal(result.projectId, "project-456");
});

test("user project serialization maps completed and hidden statuses", () => {
  const base = { project: { id: "project-1" } };

  assert.equal(
    serializeUserProjectState({ ...base, status: "DONE" }).status,
    "Completed"
  );
  assert.equal(
    serializeUserProjectState({ ...base, status: "HIDDEN" }).status,
    "Hidden"
  );
});
