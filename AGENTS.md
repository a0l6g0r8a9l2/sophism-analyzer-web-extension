# AGENTS.md

Guidance for AI coding agents working on **Sophism Analyzer** — a Manifest V3 Chrome extension that detects logical fallacies, emotional manipulation, and rhetorical tricks in YouTube videos using Google Gemini AI.

## Project Purpose

The extension injects an "Analyze" button into the YouTube player, sends the current video URL to a background service worker, which calls Google's Gemini API with a structured prompt. Detected fallacies are rendered as: timeline markers on the progress bar, a counter widget, real-time notification cards during playback, and an expandable detailed list. Analysis is **opt-in** (manual button click) to avoid consuming API quota silently.

## Tech Stack

- **TypeScript** (strict mode, ES2020 target, `moduleResolution: bundler`)
- **Vite 5** as the build tool with a custom `copyAssets` plugin (copies `manifest.json`, icons, and `src/content/styles.css` into `dist/`, rewrites popup asset paths)
- **@google/genai** SDK — the only runtime dependency
- **Manifest V3** with a module-type service worker
- **@types/chrome** for extension API typings
- No test framework is currently set up

## Commands

```bash
npm run dev        # Vite dev build (watch)
npm run build      # tsc --noEmit typecheck + vite build -> dist/
npm run typecheck  # tsc --noEmit (run this before submitting changes)
npm run preview    # preview production build
```

**Always run `npm run typecheck` after editing TypeScript.** The build also runs `tsc` first, so type errors will fail the build. Load the unpacked `dist/` folder in `chrome://extensions` to test.

## Architecture

### Component responsibilities (do not blur these boundaries)

- **`src/background/index.ts`** — Service Worker. Sole owner of Gemini API calls and the analysis prompt. Reads `apiKey`, `language`, and API tuning settings (`apiRetries`, `apiTimeout`, `apiRetryDelay`) from `chrome.storage.local`. Implements retry with backoff for `429`/`503`/`UNAVAILABLE`/`TIMEOUT` errors. Never touches the DOM.
- **`src/content/index.ts`** — Content script orchestrator. Manages `currentVideoId`, `currentFallacies`, `isAnalyzing`, `initialized` state. Injects UI into `.ytp-right-controls` and `.html5-video-container`, wires `timeupdate` to trigger cards, and handles SPA navigation resets. Coordinates the other `content/*.ts` modules.
- **`src/content/*.ts`** — Single-purpose UI modules: `button.ts` (analyze button + state icons), `markers.ts` (progress-bar dots), `counter.ts` (fallacy count widget), `cards.ts` (transient notifications), `list.ts` (expandable detailed list), `navigation.ts` (YouTube SPA detection via `MutationObserver` + `popstate` + `yt-navigate-finish`).
- **`src/popup/popup.ts` + `popup.html` + `popup.css`** — Settings UI. Validates and persists all user-tunable values to `chrome.storage.local`. Inputs are clamped against the bounds defined in `shared/types.ts`.
- **`src/shared/types.ts`** — The single source of truth for shared types (`Fallacy`, `AnalysisResult`, `Message`, `StorageData`, `Language`, `TranscriptSegment`) and tuning constants (`CARD_DISPLAY_TIME_*`, `API_RETRIES_*`, `API_TIMEOUT_*`, `API_RETRY_DELAY_*`). Import constants from here rather than hardcoding.
- **`src/env.d.ts`** — Declares the global `__DEBUG__` constant injected by Vite (`define` in `vite.config.ts`).

### Message protocol (`Message` union in `shared/types.ts`)

- Content → Background: `ANALYZE_VIDEO` `{ videoId, videoUrl }`
- Background → Content (via `chrome.tabs.sendMessage`): `ANALYSIS_RESULT` `{ result }` | `ANALYSIS_ERROR` `{ error }`
- Popup/Content → Background: `GET_API_KEY_STATUS` → responds with `API_KEY_STATUS` `{ hasKey }`

Async listeners must `return true` to keep the `sendResponse` channel open. The background handler sends results back to `sender.tab.id` rather than using `sendResponse`, because analysis outlives the listener invocation.

### Storage schema (`chrome.storage.local`)

`apiKey: string`, `language: Language` (`"en"|"ru"|"zh"|"es"`), `cardDisplayTime: number` (seconds), `apiRetries: number`, `apiTimeout: number` (seconds), `apiRetryDelay: number` (seconds). Defaults and bounds live in `shared/types.ts` — reference those constants instead of literals.

## Conventions to Follow

- **Functional style.** No classes. Use standalone exported functions and module-scoped `let` for state (see `cards.ts`, `content/index.ts`).
- **Strict TypeScript.** `strict: true` is on. Provide explicit types on function signatures and public exports; avoid `any` (the JSON-parsing code in `background/index.ts` is the lone exception and uses `any` for the untrusted Gemini payload — keep new parsing defensive and coerce with `Number()`/`String()` plus allowlist checks as done there).
- **JSDoc comments** on exported functions describing purpose and params.
- **Descriptive boolean/state names** (`isLoading`, `isAnalyzing`, `hasPermission`, `initialized`).
- **UI isolation.** Content-script elements must use the `sophism-` ID/class prefix (`sophism-analyze-btn`, `sophism-card`, etc.) to avoid collisions with YouTube's own DOM. Inline SVGs are used for icons to keep the bundle self-contained.
- **Debug logging.** Gate development-only logs behind `if (__DEBUG__)`. The background script currently uses an unconditional `console.log` in the message listener — prefer the `__DEBUG__` guard when adding new logs.
- **Manifest edits.** `manifest.json` references built paths (`src/background/index.js`, `src/content/index.js`, `src/content/styles.css`). Keep these in sync with `vite.config.ts` `rollupOptions.output.entryFileNames` and the `copyAssets` plugin. New permissions must follow least-privilege; current set is `storage`, `tabs` plus host permissions for `youtube.com` and `generativelanguage.googleapis.com`.

## Gemini integration specifics

- Model ID: `gemini-3.5-flash` (hardcoded in `background/index.ts`).
- The prompt is built by `buildPrompt(language)` and is the contract for the JSON schema returned (`fallacies[]` with `timestamp`, `type`, `category`, `quote`, `label`, `brief`, `severity`, plus top-level `summary`). If you change the schema, update **both** the prompt and the parser, and update `Fallacy` in `shared/types.ts`.
- `category` is validated against the three fixed strings; `severity` against `low|medium|high`. Unknown values fall back to safe defaults — preserve this defensive pattern when extending.
- Current date is injected into the prompt so the model can distinguish past predictions from future claims. Keep this.
- Retryable errors: `429`, `503`, `UNAVAILABLE`, `TIMEOUT`. User-facing error strings are rewritten for `429`/quota and `503`/overload cases — extend this mapping thoughtfully when adding new error handling.

## Security and Privacy (project-specific)

- API keys live only in `chrome.storage.local` and are never logged or transmitted anywhere except Google's Gemini endpoint.
- CSP for extension pages: `script-src 'self'; object-src 'none'` — do not relax it. No remote scripts, no `eval`, no inline event handlers in `popup.html`.
- `cards.ts` and `list.ts` interpolate `fallacy.quote` (model-generated text) into the DOM via `innerHTML`. This is currently trusted because output comes from Gemini, but if you wire in user/transcript content, switch to `textContent` or sanitize to prevent XSS in the YouTube page context.
- The content script runs on `https://www.youtube.com/*` only. Do not broaden `host_permissions` without a clear reason.
- See `PRIVACY_POLICY.md` for the public-facing policy — keep it in sync with any change that affects data handling.

## Build / packaging gotchas

- `vite.config.ts` rewrites popup `src="/assets/..."` to relative `../../assets/...` paths after bundling. If you change popup asset references, verify the rewrite regex still applies.
- Icons are copied verbatim from `src/assets/icons/` to `dist/src/assets/icons/`. The manifest points at `src/assets/icons/icon{16,48,128}.png` relative to the dist root — do not move them without updating both the manifest and the `copyAssets` plugin.
- `tsconfig.json` has `noEmit: true`; type checking and bundling are separate steps orchestrated by `npm run build`.

## Extension lifecycle edge cases (already handled — preserve when refactoring)

- **SPA navigation:** `navigation.ts` watches `MutationObserver` on `document.body`, `popstate`, and YouTube's custom `yt-navigate-finish` event. On navigation, `resetState()` clears markers/cards/counter and re-injects UI after a 1500ms delay (waits for YouTube to rebuild the player).
- **Extension context invalidated:** caught in both the content script's `sendMessage` call and its `onMessage` listener; triggers `window.location.reload()`. Keep this guard around all `chrome.runtime` calls from content scripts.
- **Player readiness:** `init()` polls every 1s for both a `videoId` and `.ytp-right-controls` before injecting UI, since YouTube renders the player asynchronously.
- **Card triggering:** `timeupdate` fires frequently; cards trigger only when `|currentTime - fallacy.timestamp| < 1` and the index hasn't already been triggered. `seeked` resets `lastTriggeredIndex` so re-seeking re-shows cards.

## When making changes

1. Reproduce/understand the relevant flow in `User flow.md` and the message protocol above.
2. Update `shared/types.ts` first if the data shape changes, then update the prompt, parser, and UI in lockstep.
3. Keep modules single-purpose — split new UI features into their own `content/*.ts` file rather than bloating `index.ts`.
4. Run `npm run typecheck` and `npm run build`; load `dist/` into Chrome and verify on a real YouTube video.
5. If behavior changes are user-visible, update `README.md` (English + Russian sections) and `CHANGELOG.md` under the Keep-a-Changelog format.
6. Never commit the `dist/` directory or any API keys. `dist/` is a build artifact.
