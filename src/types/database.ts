// Core domain types — mirror the Postgres schema exactly.
// Frontend never invents its own shape for competition data.

export type Role = "admin" | "participant";
export type CompetitionStatusValue = "not_started" | "live" | "paused" | "finished";
export type RoundStatus = "pending" | "live" | "paused" | "finished";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
}

export interface Team {
  id: string;
  team_number: number;
  name: string;
  logo_url: string | null;
  is_enabled: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  slug: "litoff-mission" | "find-missing-piece" | "final-horizon";
  name: string;
  sequence: number;
  status: RoundStatus;
}

export interface Station {
  id: string;
  round_id: string;
  name: string;
  sequence: number;
  status: RoundStatus;
}

export interface ScoreButton {
  id: string;
  station_id: string;
  label: string;
  value: number;
  sequence: number;
}

export interface ScoreEvent {
  id: string;
  team_id: string;
  round_id: string;
  station_id: string;
  admin_id: string;
  score_value: number;
  is_voided: boolean;
  voided_at: string | null;
  voided_by: string | null;
  device_info: Record<string, unknown> | null;
  created_at: string;
}

export interface CompetitionStatus {
  id: 1;
  status: CompetitionStatusValue;
  active_round_id: string | null;
  active_station_id: string | null;
}

export interface LeaderboardRow {
  team_id: string;
  team_number: number;
  team_name: string;
  logo_url: string | null;
  is_enabled: boolean;
  total_score: number;
  total_events: number;
  last_event_at: string | null;
}