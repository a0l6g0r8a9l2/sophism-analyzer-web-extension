import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, Fallacy, Language, Message } from "../shared/types";

if (__DEBUG__) {
  console.log("[BG] Background script loaded");
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  ru: "Russian",
  zh: "Simplified Chinese",
  es: "Spanish",
};

function buildPrompt(language: Language): string {
  const langName = LANGUAGE_NAMES[language];
  return `You are an expert in logic, rhetoric, and argumentation. Analyze this YouTube video for logical fallacies, sophisms, and manipulative techniques used by the speaker.

IMPORTANT: Respond ONLY in ${langName}. Every response field must be in ${langName}.

FALLACY CATEGORIES (identify these patterns):

1. **Logical Fallacies** — violations of valid reasoning:
   - Ad hominem (attacking the person, not argument)
   - Straw man (misrepresenting opponent's position)
   - False dilemma (presenting only 2 options when more exist)
   - Circular reasoning (conclusion restates premise)
   - Appeal to authority (citing unqualified sources)
   - Hasty generalization (broad claims from few examples)
   - False cause (assuming causation without evidence)

2. **Emotional Manipulation** — appeals bypassing logic:
   - Appeal to fear/anxiety
   - Appeal to anger
   - Appeal to pity/sympathy
   - Appeal to desires/wishes
   - Exaggeration for effect

3. **Rhetorical Tricks** — deceptive presentation:
   - Loaded language (charged words to bias opinion)
   - False equivalence (treating unequal things as equal)
   - Red herring (introducing irrelevant topics)
   - Bait-and-switch (changing argument mid-discussion)
   - Vague/ambiguous claims (avoiding specificity)

ANALYSIS REQUIREMENTS:
- Provide EXACT quote or paraphrase from the video for each fallacy
- Explain WHY it's problematic
- Do NOT flag mere opinion — only genuine logical errors or manipulation
- Severity: HIGH = misleading; MEDIUM = weakens reasoning; LOW = style choice

Return valid JSON:
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

If no fallacies found:
{
  "fallacies": [],
  "summary": "Arguments supported by reasoning and evidence."
}

Be rigorous but fair.`;
}

async function getApiKey(): Promise<string | null> {
  const data = await chrome.storage.local.get("apiKey");
  return data.apiKey || null;
}

async function getLanguage(): Promise<Language> {
  const data = await chrome.storage.local.get("language");
  return data.language || "en";
}

async function analyzeVideo(videoId: string, videoUrl: string): Promise<AnalysisResult> {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error("API key not configured. Please set it in the extension popup.");
  }

  const language = await getLanguage();
  const prompt = buildPrompt(language);

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 50000; // 50 seconds
  const RETRY_DELAY_MS = 10000; // 10 seconds
  const RETRYABLE_ERRORS = ["429", "503", "UNAVAILABLE", "TIMEOUT"];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contents = [
        {
          fileData: {
            fileUri: videoUrl,
          },
        },
        { text: prompt },
      ];

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("API request timeout")), TIMEOUT_MS);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
        }),
        timeoutPromise,
      ]);

      const text = response.text;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Invalid response format from AI");
        }
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        const fallacies: Fallacy[] = (parsed.fallacies || []).map((f: any) => ({
          timestamp: Number(f.timestamp) || 0,
          type: String(f.type || "Unknown Fallacy"),
          category: (["Logical Fallacy", "Emotional Manipulation", "Rhetorical Trick"].includes(f.category) ? f.category : "Logical Fallacy") as Fallacy["category"],
          quote: String(f.quote || ""),
          label: String(f.label || "Logical error"),
          brief: String(f.brief || "Invalid reasoning detected"),
          severity: (["low", "medium", "high"].includes(f.severity) ? f.severity : "medium") as Fallacy["severity"],
        }));

        return {
          videoId,
          fallacies,
          summary: String(parsed.summary || "Analysis complete"),
        };
      } catch (error) {
        throw new Error("Failed to parse AI response");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStr = errorMsg.toUpperCase();
      const isRetryable = RETRYABLE_ERRORS.some(err => errorStr.includes(err));
      
      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(`[BG] Attempt ${attempt + 1} failed (${errorMsg}), retrying after ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      
      throw error;
    }
  }

  throw new Error("Failed to analyze video after all retry attempts");
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log("[BG] Received message:", message.type);

  if (message.type === "ANALYZE_VIDEO") {
    console.log("[BG] Starting video analysis:", message.videoId);
    const tabId = sender.tab?.id;
    console.log("[BG] Tab ID:", tabId);

    analyzeVideo(message.videoId, message.videoUrl)
      .then((result) => {
        console.log("[BG] Analysis complete:", result.fallacies.length, "fallacies found");
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
