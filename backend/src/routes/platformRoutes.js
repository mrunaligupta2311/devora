import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/platformController.js";
import {
  profileSchema,
  preferencesSchema,
  statusSchema,
  milestoneSchema,
} from "../validators/platformValidator.js";

const router = Router();

router.use(authenticate);

router.get("/users/profile", controller.profile);
router.patch("/users/profile", validate(profileSchema), controller.updateProfile);

router.get("/users/preferences", controller.preferences);
router.put(
  "/users/preferences",
  validate(preferencesSchema),
  controller.updatePreferences
);

router.get("/users/dashboard", controller.dashboard);
router.get("/users/projects", controller.userProjects);

router.get("/projects", controller.projects);
router.get("/projects/recommendations", controller.recommendations);
router.get("/projects/:id", controller.projectDetails);

router.put(
  "/users/projects/:projectId/status",
  validate(statusSchema),
  controller.projectStatus
);

router.put(
  "/users/projects/:projectId/milestones/:milestoneId",
  validate(milestoneSchema),
  controller.milestoneProgress
);

export default router;
