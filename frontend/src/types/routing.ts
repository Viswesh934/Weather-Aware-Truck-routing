/**
 * TypeScript Data Models & API Contracts for Weather-Aware Truck Routing
 */

import { RiskLevel } from '../utils/riskRules';

export interface DispatchParams {
  origin: string;
  destination: string;
  departure_time: string; // ISO 8601 string: YYYY-MM-DDTHH:mm
  load_weight_lbs: number;
  sampling_interval_miles: 10 | 25 | 50;
}

export interface WeatherCondition {
  wind_speed_mph: number;
  rain_rate_in_hr: number;
  snow_rate_in_hr: number;
  temperature_f?: number;
}

export interface CheckpointRisk {
  level: RiskLevel;
  score: number; // 1 to 5
  color: string;
  limiting_factors: string[];
  load_override_applied: boolean;
  load_rule_description?: string | null;
}

export interface Checkpoint {
  index: number;
  distance_from_origin_miles: number;
  coordinates: [number, number]; // [longitude, latitude]
  eta_utc: string; // ISO 8601
  eta_local_display: string; // e.g. "Tomorrow 11:30 AM"
  weather: WeatherCondition;
  risk: CheckpointRisk;
}

export interface RiskSummary {
  low_miles: number;
  moderate_miles: number;
  high_miles: number;
  severe_miles: number;
  no_travel_miles: number;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [[lon, lat], ...]
}

export interface RouteSegment {
  coordinates: [number, number][]; // [[lon1, lat1], [lon2, lat2]]
  risk_level: RiskLevel;
  risk_color: string;
  distance_miles: number;
}

export interface RouteOption {
  id: string; // "route_1", "route_2", "route_3"
  name: string; // e.g. "Via I-80 W"
  is_recommended: boolean;
  total_distance_miles: number;
  total_duration_minutes: number;
  average_risk_score: number;
  risk_summary: RiskSummary;
  geometry: RouteGeometry;
  segments: RouteSegment[];
  checkpoints: Checkpoint[];
}

/**
 * Array of 48 hourly frames.
 * Each frame is an array of [latitude, longitude, normalized_intensity (0.0 to 1.0)]
 */
export type CorridorHeatFrame = [number, number, number][];

export interface RouteEvaluationResponse {
  recommended_route_id: string;
  recommendation_reason: string;
  routes: RouteOption[];
  corridor_heat_frames: CorridorHeatFrame[];
  corridor_start_time_utc: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  params: DispatchParams;
}
