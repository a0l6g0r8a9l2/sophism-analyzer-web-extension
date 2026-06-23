export const CARD_DISPLAY_TIME_DEFAULT = 10;
export const CARD_DISPLAY_TIME_MIN = 1;
export const CARD_DISPLAY_TIME_MAX = 600;

export const API_RETRIES_DEFAULT = 2;
export const API_RETRIES_MIN = 0;
export const API_RETRIES_MAX = 10;

export const API_TIMEOUT_DEFAULT = 50;
export const API_TIMEOUT_MIN = 5;
export const API_TIMEOUT_MAX = 300;

export const API_RETRY_DELAY_DEFAULT = 10;
export const API_RETRY_DELAY_MIN = 1;
export const API_RETRY_DELAY_MAX = 120;

export type Language = "en" | "ru" | "zh" | "es";

export interface Fallacy {
  timestamp: number;
  type: string;
  category: "Logical Fallacy" | "Emotional Manipulation" | "Rhetorical Trick";
  quote: string;
  label: string;
  brief: string;
  severity: "low" | "medium" | "high";
}

export interface AnalysisResult {
  videoId: string;
  fallacies: Fallacy[];
  summary: string;
}

export interface AnalysisError {
  videoId: string;
  error: string;
}

export type Message =
  | { type: "ANALYZE_VIDEO"; videoId: string; videoUrl: string }
  | { type: "ANALYSIS_RESULT"; result: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; error: AnalysisError }
  | { type: "GET_API_KEY_STATUS" }
  | { type: "API_KEY_STATUS"; hasKey: boolean };

export interface StorageData {
  apiKey?: string;
  language?: Language;
  cardDisplayTime?: number;
  apiRetries?: number;
  apiTimeout?: number;
  apiRetryDelay?: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}
