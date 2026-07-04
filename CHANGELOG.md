# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Configurable video detail level (`mediaResolution`): Low / Medium / High, exposed in the popup with guidance on when to use each value. Low fits long videos (30+ min) within the model's context limit; Medium remains the default; High maximizes detail for short videos at higher context cost. Passed to the Gemini API via `config.mediaResolution`.
- Temperature setting (`temperature`, 0–2, default 0.2) in the popup. Lower values yield stricter, more deterministic analysis.
- Thinking budget setting with Off / Low (1024) / Medium (4096) / High (12288) presets and an "Include thoughts" toggle. Off by default. When enabled, the Gemini call uses `config.thinkingConfig` for deeper reasoning, improving timestamp and fallacy-definition accuracy at the cost of latency and tokens.
- Transcript-based timestamps: the background script asks the content script to fetch the YouTube `timedtext` transcript (in the analysis language, falling back to English) and feeds it to the model so `timestamp` values anchor to real segment start times. Falls back to video-only analysis when no transcript is available.
- Error and retry toasts over the player: terminal analysis failures show a red toast with the error message; in-flight retries show a neutral "Retrying… (attempt N of M)" toast so the user knows the extension is retrying transient errors (429/503/overload) instead of giving up silently.
- `errorDisplayTime` setting (1–60 s, default 3) in the popup controlling how long error/retry toasts stay visible. Separate from `cardDisplayTime` because error messages are briefer and a missed toast is non-critical.

### Changed
- Gemini responses now use structured output (`responseMimeType: "application/json"` + `responseSchema`) so the model always returns valid JSON matching the `Fallacy` shape.
- `Fallacy.type` is now a closed enum of 17 canonical identifiers with fixed definitions injected into the prompt; the parser validates against this list and falls back to "Unknown Fallacy" for unknown values.
- `fileData` now declares `mimeType: "video/*"` for deterministic video classification by the SDK.
- The prompt requires EXACT verbatim quotes (no paraphrase) and explicit timestamp anchoring rules.
- Fallacies with non-finite or negative `timestamp` are now discarded instead of silently coerced to 0.
- Malformed/empty JSON responses are now retryable; on retry the previous bad response is fed back with a corrective instruction.
- Terminal error messages now append `(after N attempts)` when the failure followed one or more retries, so the user knows the extension already retried.
- Background message listener logs are gated behind `__DEBUG__`.
- Popup settings reorganized into four collapsible sections (Credentials, Analysis quality, Display, Advanced / API) ordered by conceptual meaning rather than chronological addition. The Advanced section is collapsed by default; its open/closed state persists across popup reopens via the new `popupAdvancedOpen` storage key. Save button is now sticky so it stays visible without scrolling. Empty API key shows a red required cue on first run that clears once a value is saved.


## [1.0.0] - 2024-06-19

### Added
- Initial release of Sophism Analyzer
- AI-powered fallacy detection for YouTube videos using Google Gemini
- Visual timeline markers showing fallacy locations
- Real-time fallacy card notifications during playback
- Fallacy counter widget with detailed list view
- Support for multiple languages (English, Russian, Chinese Simplified, Spanish)
- Manifest V3 compliant browser extension
- TypeScript support with strict type checking
- Development mode with debug logging
- Retry logic and timeout handling for API requests

### Features
- **Analysis**: Detects logical fallacies, emotional manipulation, and rhetorical tricks
- **UI Components**: 
  - Analyze button in YouTube player controls
  - Timeline markers for fallacy locations
  - Real-time notification cards
  - Expandable fallacy list with severity indicators
  - Counter widget
- **Fallacy Detection**: Ad hominem, straw man, false dilemma, appeal to emotion, and more
- **User Control**: API key configuration through extension popup
- **SPA Support**: Seamless navigation between YouTube videos without page reload

### Technical
- Built with TypeScript and Vite
- Minimal dependencies (only @google/genai)
- Efficient content script injection
- Proper message passing between background and content scripts
- Clean type definitions and interfaces

## Future Roadmap

### Planned Features
- [ ] Community-driven fallacy database
- [ ] Integration with an API implementing a video analysis queue (the most popular video is analyzed first)
- [ ] Support for analyzing large videos by splitting them into chunks
- [ ] Caching of analysis results
- [ ] Export analysis results
- [ ] Integration with fact-checking APIs

### Improvements
- [ ] Eye cathing and lite desing
- [ ] Performance optimization for large videos
- [ ] Enhanced error messages and user guidance
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [x] Settings panel with advanced options
