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
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}
