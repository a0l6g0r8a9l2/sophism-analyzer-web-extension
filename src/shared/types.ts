export const CARD_DISPLAY_TIME_DEFAULT = 10;
export const CARD_DISPLAY_TIME_MIN = 1;
export const CARD_DISPLAY_TIME_MAX = 600;

export const ERROR_DISPLAY_TIME_DEFAULT = 3;
export const ERROR_DISPLAY_TIME_MIN = 1;
export const ERROR_DISPLAY_TIME_MAX = 60;

export const API_RETRIES_DEFAULT = 2;
export const API_RETRIES_MIN = 0;
export const API_RETRIES_MAX = 10;

export const API_TIMEOUT_DEFAULT = 50;
export const API_TIMEOUT_MIN = 5;
export const API_TIMEOUT_MAX = 300;

export const API_RETRY_DELAY_DEFAULT = 10;
export const API_RETRY_DELAY_MIN = 1;
export const API_RETRY_DELAY_MAX = 120;

export type MediaResolution = "low" | "medium" | "high";

export const MEDIA_RESOLUTION_DEFAULT: MediaResolution = "medium";

export type Language = "en" | "ru" | "zh" | "es";

/**
 * Closed list of fallacy type identifiers. The model MUST emit one of these
 * exact strings in `Fallacy.type`; the parser validates against this list and
 * the JSON response schema restricts the field to these enum values.
 */
export const FALLACY_TYPES = [
  "Ad Hominem",
  "Straw Man",
  "False Dilemma",
  "Circular Reasoning",
  "Appeal to Authority",
  "Hasty Generalization",
  "False Cause",
  "Appeal to Fear",
  "Appeal to Anger",
  "Appeal to Pity",
  "Appeal to Desire",
  "Exaggeration",
  "Loaded Language",
  "False Equivalence",
  "Red Herring",
  "Bait-and-Switch",
  "Vagueness",
] as const;

export type FallacyType = (typeof FALLACY_TYPES)[number];

/**
 * Canonical short definitions for each fallacy type. Injected into the prompt
 * so the model anchors on a fixed meaning per identifier (point 5).
 */
export const FALLACY_DEFINITIONS: Record<FallacyType, string> = {
  "Ad Hominem": "Attacking the person rather than their argument.",
  "Straw Man": "Misrepresenting an opponent's position to make it easier to attack.",
  "False Dilemma": "Presenting only two options when more exist.",
  "Circular Reasoning": "Using the conclusion as a premise; argument restates itself.",
  "Appeal to Authority": "Citing an authority who is unqualified or irrelevant to the claim.",
  "Hasty Generalization": "Drawing a broad conclusion from too few or unrepresentative examples.",
  "False Cause": "Assuming causation without evidence, often from correlation.",
  "Appeal to Fear": "Using fear or anxiety to persuade instead of evidence.",
  "Appeal to Anger": "Stoking anger to bypass rational evaluation.",
  "Appeal to Pity": "Using sympathy to win an argument unrelated to the claim.",
  "Appeal to Desire": "Appealing to wishes or desires rather than facts.",
  Exaggeration: "Overstating facts or magnitude beyond evidence for effect.",
  "Loaded Language": "Using charged words to bias opinion instead of informing.",
  "False Equivalence": "Treating unequal things as if they were equal.",
  "Red Herring": "Introducing an irrelevant topic to divert the argument.",
  "Bait-and-Switch": "Changing the argument or topic mid-discussion.",
  Vagueness: "Using vague or ambiguous claims to avoid specificity and accountability.",
};

export const TEMPERATURE_DEFAULT = 0.2;
export const TEMPERATURE_MIN = 0;
export const TEMPERATURE_MAX = 2;

export type ThinkingPreset = "off" | "low" | "medium" | "high";

export const THINKING_BUDGET_DEFAULT = 0;
export const THINKING_BUDGET_MIN = 0;
export const THINKING_BUDGET_MAX = 24576;
export const THINKING_INCLUDE_DEFAULT = false;

export const THINKING_PRESET_BUDGET: Record<ThinkingPreset, number> = {
  off: 0,
  low: 1024,
  medium: 4096,
  high: 12288,
};

/**
 * Inverse lookup: given a stored thinkingBudget, return the closest preset
 * used to seed the popup <select>. Falls back to "off".
 */
export function budgetToPreset(budget: number): ThinkingPreset {
  if (budget <= 0) return "off";
  if (budget <= 1024) return "low";
  if (budget <= 4096) return "medium";
  return "high";
}

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
  | { type: "API_KEY_STATUS"; hasKey: boolean }
  | { type: "GET_TRANSCRIPT"; videoId: string; language: Language }
  | { type: "TRANSCRIPT"; videoId: string; segments: TranscriptSegment[] | null }
  | { type: "RETRYING"; videoId: string; attempt: number; maxAttempts: number };

export interface StorageData {
  apiKey?: string;
  language?: Language;
  mediaResolution?: MediaResolution;
  cardDisplayTime?: number;
  errorDisplayTime?: number;
  apiRetries?: number;
  apiTimeout?: number;
  apiRetryDelay?: number;
  temperature?: number;
  thinkingBudget?: number;
  thinkingInclude?: boolean;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

