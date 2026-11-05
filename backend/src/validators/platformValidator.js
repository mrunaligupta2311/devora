import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export const preferencesSchema = z.object({
  fields: z.array(z.string().trim().min(1).max(80)).max(30),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  techStack: z.array(z.string().trim().min(1).max(80)).max(50),
  goal: z.string().trim().min(1).max(150),
  onboarded: z.boolean().optional(),
});

export const statusSchema = z.object({
  status: z.enum([
    "Saved",
    "Planning",
    "In Progress",
    "Completed",
    "Hidden",
  ]),
});

export const milestoneSchema = z.object({
  completed: z.boolean(),
});
