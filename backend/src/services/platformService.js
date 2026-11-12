import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { serializeUserProjectState } from "../utils/projectStateSerializer.js";

const levels = {
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
};

const statuses = {
  Saved: "SAVED",
  Planning: "PLANNING",
  "In Progress": "IN_PROGRESS",
  Completed: "DONE",
  Hidden: "HIDDEN",
};

const displayStatus = Object.fromEntries(
  Object.entries(statuses).map(([key, value]) => [value, key])
);

const displayLevel = (level) =>
  Object.entries(levels).find(([, value]) => value === level)?.[0] || level;

const serializePreference = (preference) =>
  preference ? { ...preference, level: displayLevel(preference.level) } : preference;

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
});

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preference: true },
  });

  if (!user) throw new AppError("User not found.", 404);

  return {
    ...safeUser(user),
    preferences: serializePreference(user.preference),
  };
}

export async function updateProfile(userId, input) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name.trim() },
  });

  return safeUser(user);
}

export async function getPreferences(userId) {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  const data = preference || {
    fields: [],
    level: "INTERMEDIATE",
    techStack: [],
    goal: "Portfolio building",
    onboarded: false,
  };

  return serializePreference(data);
}

export async function updatePreferences(userId, input) {
  const data = {
    fields: input.fields,
    level: levels[input.level] || input.level,
    techStack: input.techStack,
    goal: input.goal,
    onboarded: input.onboarded ?? true,
  };

  const preference = await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return serializePreference(preference);
}

function buildProjectWhere(query) {
  const where = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { problem: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.field) where.field = query.field;
  if (query.level) where.level = levels[query.level] || query.level;
  if (query.techStack) where.techStack = { has: query.techStack };
  if (query.goal) where.goal = query.goal;

  return where;
}

export async function listProjects(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));

  const orderBy =
    query.sort === "title"
      ? { title: "asc" }
      : query.sort === "oldest"
        ? { createdAt: "asc" }
        : { createdAt: "desc" };

  const where = buildProjectWhere(query);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getProject(userId, projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      roadmap: {
        orderBy: { sortOrder: "asc" },
        include: {
          progress: {
            where: { userId },
            select: { completed: true, completedAt: true },
          },
        },
      },
      userStates: {
        where: { userId },
        select: { status: true },
      },
    },
  });

  if (!project) throw new AppError("Project not found.", 404);

  const { userStates, ...details } = project;

  return {
    ...details,
    status: displayStatus[userStates[0]?.status] || null,
    roadmap: details.roadmap.map(({ progress, ...step }) => ({
      ...step,
      completed: progress[0]?.completed || false,
      completedAt: progress[0]?.completedAt || null,
    })),
  };
}

export async function updateProjectStatus(userId, projectId, status) {
  const dbStatus = statuses[status] || status;

  if (!Object.values(statuses).includes(dbStatus)) {
    throw new AppError("Invalid project status.", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) throw new AppError("Project not found.", 404);

  const state = await prisma.userProjectState.upsert({
    where: {
      userId_projectId: { userId, projectId },
    },
    create: { userId, projectId, status: dbStatus },
    update: { status: dbStatus },
  });

  return {
    ...state,
    status: displayStatus[state.status],
  };
}

export async function updateMilestone(userId, projectId, milestoneId, completed) {
  const milestone = await prisma.projectRoadmap.findFirst({
    where: { id: milestoneId, projectId },
    select: { id: true },
  });

  if (!milestone) throw new AppError("Milestone not found.", 404);

  return prisma.projectMilestoneProgress.upsert({
    where: {
      userId_milestoneId: { userId, milestoneId },
    },
    create: {
      userId,
      milestoneId,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
}

export async function getUserProjects(userId, status) {
  const where = { userId };

  if (status) {
    const dbStatus = statuses[status] || status;
    if (!Object.values(statuses).includes(dbStatus)) {
      throw new AppError("Invalid project status.", 400);
    }
    where.status = dbStatus;
  }

  const records = await prisma.userProjectState.findMany({
    where,
    include: { project: true },
    orderBy: { updatedAt: "desc" },
  });

  return records.map(serializeUserProjectState);
}

export async function getDashboard(userId) {
  const [counts, totalProjects, recent, progressCount] = await Promise.all([
    prisma.userProjectState.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.project.count(),
    prisma.userProjectState.findMany({
      where: { userId },
      include: { project: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.projectMilestoneProgress.count({
      where: { userId, completed: true },
    }),
  ]);

  const stats = {
    total: 0,
    saved: 0,
    planning: 0,
    inProgress: 0,
    completed: 0,
    hidden: 0,
  };

  for (const item of counts) {
    const count = item._count._all;
    stats.total += count;

    if (item.status === "SAVED") stats.saved = count;
    if (item.status === "PLANNING") stats.planning = count;
    if (item.status === "IN_PROGRESS") stats.inProgress = count;
    if (item.status === "DONE") stats.completed = count;
    if (item.status === "HIDDEN") stats.hidden = count;
  }

  return {
    stats,
    totalAvailableProjects: totalProjects,
    completedMilestones: progressCount,
    recentProjects: recent.map(serializeUserProjectState),
  };
}

export async function getRecommendations(userId, limit = 8) {
  const preference = await getPreferences(userId);

  const projects = await prisma.project.findMany({
    where: {
      userStates: {
        none: { userId },
      },
    },
    take: 234,
  });

  const scored = projects.map((project) => {
    let score = 0;

    if (preference.fields.includes(project.field)) score += 4;
    if (levels[preference.level] === project.level) score += 3;
    if (project.techStack.some((tech) => preference.techStack.includes(tech))) {
      score += 3;
    }
    if (preference.goal === project.goal) score += 2;

    return { ...project, recommendationScore: score };
  });

  return scored
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, Math.min(30, Math.max(1, Number(limit) || 8)));
}
