import { GoogleGenAI, MediaResolution, Schema, Type } from "@google/genai";
import type { AnalysisResult, Fallacy, Language, Message, MediaResolution as MediaResolutionKey, TranscriptSegment } from "../shared/types";
import {
  API_RETRIES_DEFAULT,
  API_TIMEOUT_DEFAULT,
  API_RETRY_DELAY_DEFAULT,
  MEDIA_RESOLUTION_DEFAULT,
  FALLACY_TYPES,
  FALLACY_DEFINITIONS,
  TEMPERATURE_DEFAULT,
  TEMPERATURE_MIN,
  TEMPERATURE_MAX,
  THINKING_BUDGET_DEFAULT,
  THINKING_BUDGET_MIN,
  THINKING_BUDGET_MAX,
  THINKING_INCLUDE_DEFAULT,
} from "../shared/types";

if (__DEBUG__) {
  console.log("[BG] Background script loaded");
}

/**
 * Error carrying retry context. `retriesAttempted` is the number of retry
 * rounds executed after the first attempt (0 = failed on the first attempt,
 * or a non-retryable error). Used to append "(after N attempts)" to the
 * user-facing message so the user knows we already retried when it made sense.
 */
class AnalysisError extends Error {
  retriesAttempted: number;
  constructor(message: string, retriesAttempted: number) {
    super(message);
    this.name = "AnalysisError";
    this.retriesAttempted = retriesAttempted;
  }
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ru: "Russian",
  zh: "Simplified Chinese",
  es: "Spanish",
};

const MEDIA_RESOLUTION_MAP: Record<MediaResolutionKey, MediaResolution> = {
  low: MediaResolution.MEDIA_RESOLUTION_LOW,
  medium: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
  high: MediaResolution.MEDIA_RESOLUTION_HIGH,
};

const FALLACY_CATEGORIES = ["Logical Fallacy", "Emotional Manipulation", "Rhetorical Trick"] as const;
const SEVERITY_VALUES = ["low", "medium", "high"] as const;

/**
 * Build the JSON response schema constraining the model's output to the
 * exact `Fallacy` shape. With `responseMimeType: "application/json"` this
 * forces valid JSON and the closed enums guarantee a known `type`/`category`/
 * `severity` (points 1, 5).
 */
function buildResponseSchema(): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      fallacies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: { type: Type.INTEGER, minimum: 0, description: "Seconds from the start of the video. Must equal the `start` of one of the provided transcript segments when a transcript is provided." },
            type: { type: Type.STRING, enum: [...FALLACY_TYPES], description: "Exact fallacy identifier from the canonical list provided in the prompt." },
            category: { type: Type.STRING, enum: [...FALLACY_CATEGORIES] },
            quote: { type: Type.STRING, description: "EXACT verbatim phrase from the video; do not paraphrase." },
            label: { type: Type.STRING, description: "Short 3-5 word name." },
            brief: { type: Type.STRING, description: "1-sentence explanation of why it is problematic." },
            severity: { type: Type.STRING, enum: [...SEVERITY_VALUES] },
          },
          required: ["timestamp", "type", "category", "quote", "label", "brief", "severity"],
        },
      },
      summary: { type: Type.STRING, description: "1-2 sentence overall assessment." },
    },
    required: ["fallacies", "summary"],
  };
}

function buildFallacyDefinitionsText(): string {
  return FALLACY_TYPES.map((t) => `- ${t}: ${FALLACY_DEFINITIONS[t]}`).join("\n");
}

/**
 * Build the analysis prompt. The `hasTranscript` flag alters the timestamp
 * and quote instructions so the model anchors on the provided transcript
 * segments (points 2, 4, 7).
 */
function buildPrompt(language: Language, hasTranscript: boolean): string {
  const langName = LANGUAGE_NAMES[language];
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZoneName: "short",
  });
  const definitions = buildFallacyDefinitionsText();

  const timestampRule = hasTranscript
    ? "Set `timestamp` to the EXACT `start` value (in seconds, integer) of the transcript segment where the fallacy begins. Do not approximate."
    : "Set `timestamp` to the integer second at which the fallacy occurs in the video. Be as precise as the audio/video allows.";

  return `You are an expert in logic, rhetoric, and argumentation. Analyze this YouTube video for logical fallacies, sophisms, and manipulative techniques used by the speaker.

Current date: ${now}. Use this to correctly distinguish between predictions that have already come true, current facts, and claims about the future.

IMPORTANT: Respond ONLY in ${langName}. Every response field must be in ${langName}.

FALLACY CATEGORIES:
1. Logical Fallacy — violations of valid reasoning.
2. Emotional Manipulation — appeals bypassing logic.
3. Rhetorical Trick — deceptive presentation.

CANONICAL FALLACY TYPES — you MUST use EXACTLY these identifiers for the \`type\` field. Do not invent new ones. Use the matching one for each detected case:
${definitions}

ANALYSIS REQUIREMENTS:
- Quote the speaker EXACTLY (verbatim) for \`quote\`. Do NOT paraphrase. ${hasTranscript ? "Copy the quote from the provided transcript." : "If a word is unclear, copy the closest intelligible phrase verbatim."}
- ${timestampRule}
- Explain WHY it is problematic in \`brief\`.
- Do NOT flag mere opinion — only genuine logical errors or manipulation.
- Severity: HIGH = misleading; MEDIUM = weakens reasoning; LOW = style choice.

Return valid JSON matching the provided schema. Example shape:
{
  "fallacies": [
    {
      "timestamp": 120,
      "type": "Ad Hominem",
      "category": "Logical Fallacy",
      "quote": "Exact phrase from video",
      "label": "Short 3-5 word name",
      "brief": "1-sentence explanation",
      "severity": "medium"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

If no fallacies found, return:
{
  "fallacies": [],
  "summary": "Arguments supported by reasoning and evidence."
}

Be rigorous but fair.`;
}

/**
 * Render transcript segments as a single text block with [start]s markers.
 * Truncated to a character budget to stay within the model context window.
 */
function buildTranscriptText(segments: TranscriptSegment[], charBudget = 200000): string {
  let out = "";
  for (const s of segments) {
    const line = `[${s.start.toFixed(1)}s] ${s.text}\n`;
    if (out.length + line.length > charBudget) {
      out += "\n[... transcript truncated ...]\n";
      break;
    }
    out += line;
  }
  return out;
}

async function getApiKey(): Promise<string | null> {
  const data = await chrome.storage.local.get("apiKey");
  return data.apiKey || null;
}

async function getLanguage(): Promise<Language> {
  const data = await chrome.storage.local.get("language");
  return data.language || "en";
}

async function getMediaResolution(): Promise<MediaResolutionKey> {
  const data = await chrome.storage.local.get("mediaResolution");
  return data.mediaResolution || MEDIA_RESOLUTION_DEFAULT;
}

async function getApiSettings(): Promise<{ maxRetries: number; timeoutMs: number; retryDelayMs: number }> {
  const data = await chrome.storage.local.get(["apiRetries", "apiTimeout", "apiRetryDelay"]);
  return {
    maxRetries: data.apiRetries ?? API_RETRIES_DEFAULT,
    timeoutMs: (data.apiTimeout ?? API_TIMEOUT_DEFAULT) * 1000,
    retryDelayMs: (data.apiRetryDelay ?? API_RETRY_DELAY_DEFAULT) * 1000,
  };
}

async function getGenerationSettings(): Promise<{ temperature: number; thinkingBudget: number; thinkingInclude: boolean }> {
  const data = await chrome.storage.local.get(["temperature", "thinkingBudget", "thinkingInclude"]);
  const temperatureRaw = data.temperature ?? TEMPERATURE_DEFAULT;
  const temperature = Number.isFinite(temperatureRaw) && temperatureRaw >= TEMPERATURE_MIN && temperatureRaw <= TEMPERATURE_MAX
    ? temperatureRaw
    : TEMPERATURE_DEFAULT;
  const budgetRaw = data.thinkingBudget ?? THINKING_BUDGET_DEFAULT;
  const thinkingBudget = Number.isFinite(budgetRaw) && budgetRaw >= THINKING_BUDGET_MIN && budgetRaw <= THINKING_BUDGET_MAX
    ? Math.floor(budgetRaw)
    : THINKING_BUDGET_DEFAULT;
  return {
    temperature,
    thinkingBudget,
    thinkingInclude: data.thinkingInclude ?? THINKING_INCLUDE_DEFAULT,
  };
}

/**
 * Ask the content script of the originating tab to fetch the YouTube
 * transcript. Resolves to `null` when the tab is unreachable or no
 * transcript is available (caller degrades to video-only analysis).
 */
function requestTranscript(tabId: number, videoId: string, language: Language): Promise<TranscriptSegment[] | null> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(
        tabId,
        { type: "GET_TRANSCRIPT", videoId, language } as Message,
        (response: Message | undefined) => {
          if (chrome.runtime.lastError || !response || response.type !== "TRANSCRIPT") {
            resolve(null);
            return;
          }
          resolve(response.segments);
        }
      );
    } catch {
      resolve(null);
    }
  });
}

async function analyzeVideo(videoId: string, videoUrl: string, tabId: number | undefined): Promise<AnalysisResult> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("API key not configured. Please set it in the extension popup.");
  }

  const language = await getLanguage();
  const mediaResolution = await getMediaResolution();
  const { maxRetries, timeoutMs, retryDelayMs } = await getApiSettings();
  const { temperature, thinkingBudget, thinkingInclude } = await getGenerationSettings();

  let transcript: TranscriptSegment[] | null = null;
  if (tabId !== undefined) {
    transcript = await requestTranscript(tabId, videoId, language);
    if (__DEBUG__) {
      console.log(`[BG] Transcript for ${videoId}: ${transcript ? `${transcript.length} segments` : "none (video-only)"}`);
    }
  }

  const hasTranscript = !!(transcript && transcript.length > 0);
  const prompt = buildPrompt(language, hasTranscript);
  const responseSchema = buildResponseSchema();
  const transcriptText = hasTranscript ? buildTranscriptText(transcript!) : "";

  const RETRYABLE_ERRORS = ["429", "503", "UNAVAILABLE", "TIMEOUT", "Failed to parse AI response", "Invalid response format", "Empty response"];

  let lastBadResponse: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contents: Array<{ fileData?: { fileUri: string }; text?: string }> = [
        {
          fileData: {
            fileUri: videoUrl,
          },
        },
      ];

      if (transcriptText) {
        contents.push({ text: `TRANSCRIPT (timestamp in seconds, followed by the spoken text):\n${transcriptText}` });
      }

      contents.push({ text: prompt });

      if (lastBadResponse !== null) {
        contents.push({ text: `Your previous response was not valid JSON matching the schema. Here it is:\n${lastBadResponse}\n\nReturn STRICTLY valid JSON matching the schema, with no prose before or after.` });
        lastBadResponse = null;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("API request timeout")), timeoutMs);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            mediaResolution: MEDIA_RESOLUTION_MAP[mediaResolution],
            temperature,
            responseMimeType: "application/json",
            responseSchema,
            thinkingConfig: thinkingBudget > 0 ? { thinkingBudget, includeThoughts: thinkingInclude } : undefined,
          },
        }),
        timeoutPromise,
      ]);

      const text = response.text;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      try {
        return parseAnalysisResponse(text, videoId);
      } catch (parseError) {
        if (__DEBUG__) {
          console.log("[BG] Parsing failed, will retry with corrective instruction:", text.slice(0, 500));
        }
        lastBadResponse = text;
        throw parseError;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStr = errorMsg.toUpperCase();
      const isRetryable = RETRYABLE_ERRORS.some((err) => errorStr.includes(err.toUpperCase()));

      if (isRetryable && attempt < maxRetries) {
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: "RETRYING",
            videoId,
            attempt: attempt + 2,
            maxAttempts: maxRetries + 1,
          });
        }
        if (__DEBUG__) {
          console.log(`[BG] Attempt ${attempt + 1} failed (${errorMsg}), retrying after ${retryDelayMs}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }

      throw new AnalysisError(errorMsg, attempt);
    }
  }

  throw new AnalysisError("Failed to analyze video after all retry attempts", maxRetries);
}

/**
 * Parse the model's text response into an `AnalysisResult`. With structured
 * output the text is already JSON; a regex extraction stays as a defensive
 * fallback for non-JSON-wrapped payloads.
 */
function parseAnalysisResponse(text: string, videoId: string): AnalysisResult {
  let jsonText: string | null = null;

  try {
    // Structured output: the whole text should be JSON.
    JSON.parse(text);
    jsonText = text;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }
    try {
      JSON.parse(jsonMatch[0]);
      jsonText = jsonMatch[0];
    } catch {
      throw new Error("Failed to parse AI response");
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText!);
  } catch {
    throw new Error("Failed to parse AI response");
  }

  const fallacies: Fallacy[] = [];
  for (const f of parsed.fallacies || []) {
    const tsRaw = Number(f.timestamp);
    if (!Number.isFinite(tsRaw) || tsRaw < 0) {
      if (__DEBUG__) {
        console.log("[BG] Discarding fallacy with invalid timestamp:", f);
      }
      continue;
    }

    const typeRaw = String(f.type || "");
    const type = (FALLACY_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "Unknown Fallacy";
    if (type === "Unknown Fallacy" && __DEBUG__) {
      console.log("[BG] Fallacy with non-canonical type, fallback to Unknown Fallacy:", typeRaw);
    }

    fallacies.push({
      timestamp: Math.floor(tsRaw),
      type,
      category: (FALLACY_CATEGORIES as readonly string[]).includes(f.category) ? f.category : "Logical Fallacy",
      quote: String(f.quote || ""),
      label: String(f.label || "Logical error"),
      brief: String(f.brief || "Invalid reasoning detected"),
      severity: (SEVERITY_VALUES as readonly string[]).includes(f.severity) ? f.severity : "medium",
    });
  }

  return {
    videoId,
    fallacies,
    summary: String(parsed.summary || "Analysis complete"),
  };
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (__DEBUG__) {
    console.log("[BG] Received message:", message.type);
  }

  if (message.type === "ANALYZE_VIDEO") {
    if (__DEBUG__) {
      console.log("[BG] Starting video analysis:", message.videoId);
    }
    const tabId = sender.tab?.id;
    if (__DEBUG__) {
      console.log("[BG] Tab ID:", tabId);
    }

    analyzeVideo(message.videoId, message.videoUrl, tabId)
      .then((result) => {
        if (__DEBUG__) {
          console.log("[BG] Analysis complete:", result.fallacies.length, "fallacies found");
        }
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: "ANALYSIS_RESULT", result });
        }
      })
      .catch((error) => {
        console.error("[BG] Analysis error:", error);
        let errorMsg = String(error.message || error);

        if (error.message?.includes("429") || error.message?.includes("quota")) {
          errorMsg = "API quota exceeded. Please wait or check your plan at ai.dev/rate-limit";
        } else if (error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("high demand")) {
          errorMsg = "Gemini model is currently overloaded. Please try again in a few minutes.";
        }

        if (error instanceof AnalysisError && error.retriesAttempted > 0) {
          errorMsg += ` (after ${error.retriesAttempted + 1} attempts)`;
        }

        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: "ANALYSIS_ERROR",
            error: { videoId: message.videoId, error: errorMsg },
          });
        }
      });
    return true;
  }

  if (message.type === "GET_API_KEY_STATUS") {
    getApiKey().then((key) => {
      sendResponse({ hasKey: !!key });
    });
    return true;
  }
});
