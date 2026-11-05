import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectsPath = path.resolve(
  __dirname,
  "./data/projects.json"
);

async function seed() {
  const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));

  console.log(`Preparing ${projects.length} projects...`);

  const projectRows = projects.map((project) => ({
    id: project.id,
    title: project.title,
    field: project.field,
    level: project.level.toUpperCase(),
    description: project.description,
    problem: project.problem,
    features: project.features,
    techStack: project.techStack,
    duration: project.duration,
    goal: project.goal,
    portfolioValue: project.portfolioValue,
    learningOutcomes: project.learningOutcomes,
  }));

  const roadmapRows = projects.flatMap((project) =>
    project.roadmap.map((step, index) => ({
      projectId: project.id,
      title: step.title,
      description: step.description,
      sortOrder: index + 1,
    }))
  );

  for (let i = 0; i < projectRows.length; i += 100) {
    await prisma.project.createMany({
      data: projectRows.slice(i, i + 100),
      skipDuplicates: true,
    });
    console.log(`Projects processed: ${Math.min(i + 100, projectRows.length)}`);
  }

  for (let i = 0; i < roadmapRows.length; i += 500) {
    await prisma.projectRoadmap.createMany({
      data: roadmapRows.slice(i, i + 500),
      skipDuplicates: true,
    });
    console.log(`Roadmap steps processed: ${Math.min(i + 500, roadmapRows.length)}`);
  }

  console.log("Seeding completed!");
  console.log("Projects:", await prisma.project.count());
  console.log("Roadmap steps:", await prisma.projectRoadmap.count());
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
