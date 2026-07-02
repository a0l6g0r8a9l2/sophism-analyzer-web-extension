import type { Language, TranscriptSegment } from "../shared/types";

/**
 * Mapping from the user-facing Analysis Language to the YouTube timedtext
 * `lang` query parameter. Lives here (not in shared/types.ts) so the content
 * script has zero runtime imports from shared/types — Vite then keeps the
 * content bundle self-contained, which MV3 requires (content scripts cannot
 * be ES modules and cannot use `import`).
 */
const LANG_TO_TIMEDTEXT: Record<Language, string> = {
  en: "en",
  ru: "ru",
  zh: "zh-Hans",
  es: "es",
};

/**
 * Fetch the YouTube timedtext transcript for a video.
 *
 * Tries the analysis language first, falls back to English. Returns `null`
 * when no transcript is available so the caller can degrade to video-only
 * multimodal analysis.
 *
 * @param videoId YouTube video id
 * @param language user-facing analysis language, mapped to a timedtext lang code
 */
export async function fetchTranscript(videoId: string, language: Language): Promise<TranscriptSegment[] | null> {
  const primaryLang = LANG_TO_TIMEDTEXT[language];
  const segments = await tryFetchTimedText(videoId, primaryLang);
  if (segments && segments.length > 0) {
    return segments;
  }

  if (primaryLang !== "en") {
    const fallback = await tryFetchTimedText(videoId, "en");
    if (fallback && fallback.length > 0) {
      return fallback;
    }
  }

  return null;
}

async function tryFetchTimedText(videoId: string, lang: string): Promise<TranscriptSegment[] | null> {
  const url = `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }

  if (!res.ok) {
    return null;
  }

  const xml = await res.text();
  if (!xml || xml.trim() === "") {
    return null;
  }

  return parseTimedTextXml(xml);
}

function decodeHtmlEntities(s: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = s;
  return txt.value;
}

function parseTimedTextXml(xml: string): TranscriptSegment[] | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const textEls = doc.getElementsByTagName("text");
    if (textEls.length === 0) {
      return null;
    }

    const segments: TranscriptSegment[] = [];
    for (let i = 0; i < textEls.length; i++) {
      const el = textEls[i];
      const startAttr = el.getAttribute("start");
      const durAttr = el.getAttribute("dur");
      const raw = el.textContent ?? "";

      if (startAttr === null) {
        continue;
      }

      const start = Number(startAttr);
      const duration = durAttr !== null ? Number(durAttr) : 0;

      if (!Number.isFinite(start) || start < 0) {
        continue;
      }

      const text = decodeHtmlEntities(raw).replace(/\n/g, " ").trim();
      if (!text) {
        continue;
      }

      segments.push({
        text,
        start,
        duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
      });
    }

    return segments.length > 0 ? segments : null;
  } catch {
    return null;
  }
}
