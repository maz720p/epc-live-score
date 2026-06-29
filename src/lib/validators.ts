import { z } from "zod";

export const createScoreEventSchema = z.object({
  teamId: z.string().uuid(),
  roundId: z.string().uuid(),
  stationId: z.string().uuid(),
  scoreValue: z.number().int().min(-1000).max(1000),
});

export const undoScoreEventSchema = z.object({
  stationId: z.string().uuid(),
});

export const createTeamSchema = z.object({
  teamNumber: z.number().int().min(1).max(999),
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional().nullable(),
});

export const updateTeamSchema = z.object({
  teamNumber: z.number().int().min(1).max(999).optional(),
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  isEnabled: z.boolean().optional(),
});
