# Plan: Configurable Card Display Time

## Overview
Move the hardcoded 10-second fallacy card display duration (`src/content/index.ts:69`) into extension settings, allowing users to configure it from 1 to 600 seconds via the popup.

## Changes

### 1. `src/shared/types.ts` — Extend StorageData
- Add `cardDisplayTime?: number` to `StorageData` interface (value in seconds)
- Add exported constants: `CARD_DISPLAY_TIME_DEFAULT = 10`, `CARD_DISPLAY_TIME_MIN = 1`, `CARD_DISPLAY_TIME_MAX = 600`

### 2. `src/popup/popup.html` — Add UI control
- Add a new `.form-group` after the language selector with:
  - `<label for="cardDisplayTime">Card Display Time (seconds)</label>`
  - `<input type="number" id="cardDisplayTime" min="1" max="600" placeholder="10">`

### 3. `src/popup/popup.css` — Style the number input
- Add styles for `input[type="number"]` matching the existing `input[type="password"]` style

### 4. `src/popup/popup.ts` — Load/save the setting
- Get reference to the new `cardDisplayTime` input element
- In `loadSettings()`: read `cardDisplayTime` from storage, populate input
- In save handler: validate value is integer between 1–600, show error if invalid, include in `StorageData` written to storage

### 5. `src/content/index.ts` — Read setting and use it
- Add module-level variable `cardDisplayTimeMs` initialized to `CARD_DISPLAY_TIME_DEFAULT * 1000`
- On init, read `cardDisplayTime` from `chrome.storage.local` and convert seconds to ms
- Add `chrome.storage.onChanged` listener to update the value live when user changes it in popup
- Replace hardcoded `10000` on line 69 with `cardDisplayTimeMs`

## Files Modified
1. `src/shared/types.ts`
2. `src/popup/popup.html`
3. `src/popup/popup.css`
4. `src/popup/popup.ts`
5. `src/content/index.ts`

## Verification
- Run `npm run typecheck` to verify TypeScript compiles
- Run `npm run build` to verify the build succeeds
