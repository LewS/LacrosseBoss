export type GameStatus = "scheduled" | "in_progress" | "final" | "cancelled" | "postponed";

export interface Division {
  id: string;
  name: string;
  age_bracket: string;
  gender: string;
  sort_order: number;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  division_id: string;
  color: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Season {
  id: string;
  competition_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Game {
  id: string;
  season_id: string;
  division_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  location: string | null;
  status: GameStatus;
  home_score: number;
  away_score: number;
  period: number;
  created_at: string;
}

export interface Standing {
  season_id: string;
  division_id: string;
  division_name: string;
  age_bracket: string;
  gender: string;
  team_id: string;
  team_name: string;
  short_name: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
}

export interface Club {
  id: string;
  name: string;
  created_at: string;
}

export interface Player {
  id: string;
  user_id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  created_at: string;
}

export type RegistrationStatus = "pending" | "paid" | "cancelled";

export interface Registration {
  id: string;
  player_id: string;
  season_id: string;
  division_id: string;
  status: RegistrationStatus;
  fee_cents: number;
  created_at: string;
}

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  id: string;
  registration_id: string;
  amount_cents: number;
  gateway_ref: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export type OfficialRole = "selector" | "manager" | "admin";

export interface ClubOfficial {
  id: string;
  user_id: string;
  club_id: string;
  role: OfficialRole;
  created_at: string;
}

export interface GameRoster {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
  assigned_by: string;
  assigned_at: string;
}

export type GameEventType = "goal" | "foul";
export type FoulCategory = "technical" | "personal";

export const TECHNICAL_FOULS = [
  "Interference",
  "Holding",
  "Pushing",
  "Offside",
  "Crease violation",
  "Withholding ball from play",
  "Delay of game",
  "Illegal procedure",
  "Illegal stick",
  "Too many players",
  "Illegal substitution",
  "Warding off",
  "Stalling",
] as const;

export const PERSONAL_FOULS = [
  "Illegal body check",
  "Slashing",
  "Cross-checking",
  "Tripping",
  "Unnecessary roughness",
  "Unsportsmanlike conduct",
  "Illegal crosse",
  "Fighting",
  "Threatening/abusive language",
] as const;

export type TechnicalFoulReason = typeof TECHNICAL_FOULS[number];
export type PersonalFoulReason = typeof PERSONAL_FOULS[number];

export interface GameEvent {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string | null;
  event_type: GameEventType;
  assisted_by: string | null;
  foul_category: FoulCategory | null;
  foul_reason: string | null;
  penalty_seconds: number | null;
  ejected: boolean;
  simultaneous_group_id: string | null;
  period: number;
  game_clock_seconds: number | null;
  created_at: string;
}
