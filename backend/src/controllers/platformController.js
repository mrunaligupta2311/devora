import * as service from "../services/platformService.js";

export async function profile(req, res) {
  res.json({ success: true, data: await service.getProfile(req.user.id) });
}

export async function updateProfile(req, res) {
  res.json({
    success: true,
    data: await service.updateProfile(req.user.id, req.validated.body),
  });
}

export async function preferences(req, res) {
  res.json({
    success: true,
    data: await service.getPreferences(req.user.id),
  });
}

export async function updatePreferences(req, res) {
  res.json({
    success: true,
    data: await service.updatePreferences(req.user.id, req.validated.body),
  });
}

export async function projects(req, res) {
  res.json({
    success: true,
    data: await service.listProjects(req.query),
  });
}

export async function projectDetails(req, res) {
  res.json({
    success: true,
    data: await service.getProject(req.user.id, req.params.id),
  });
}

export async function recommendations(req, res) {
  res.json({
    success: true,
    data: await service.getRecommendations(req.user.id, req.query.limit),
  });
}

export async function dashboard(req, res) {
  res.json({
    success: true,
    data: await service.getDashboard(req.user.id),
  });
}

export async function userProjects(req, res) {
  res.json({
    success: true,
    data: await service.getUserProjects(req.user.id, req.query.status),
  });
}

export async function projectStatus(req, res) {
  res.json({
    success: true,
    data: await service.updateProjectStatus(
      req.user.id,
      req.params.projectId,
      req.validated.body.status
    ),
  });
}

export async function milestoneProgress(req, res) {
  res.json({
    success: true,
    data: await service.updateMilestone(
      req.user.id,
      req.params.projectId,
      req.params.milestoneId,
      req.validated.body.completed
    ),
  });
}
