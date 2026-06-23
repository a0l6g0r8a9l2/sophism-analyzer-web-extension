import type { Language, StorageData } from "../shared/types";
import {
  CARD_DISPLAY_TIME_DEFAULT,
  CARD_DISPLAY_TIME_MIN,
  CARD_DISPLAY_TIME_MAX,
  API_RETRIES_DEFAULT,
  API_RETRIES_MIN,
  API_RETRIES_MAX,
  API_TIMEOUT_DEFAULT,
  API_TIMEOUT_MIN,
  API_TIMEOUT_MAX,
  API_RETRY_DELAY_DEFAULT,
  API_RETRY_DELAY_MIN,
  API_RETRY_DELAY_MAX,
} from "../shared/types";

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const languageSelect = document.getElementById("language") as HTMLSelectElement;
const cardDisplayTimeInput = document.getElementById("cardDisplayTime") as HTMLInputElement;
const apiRetriesInput = document.getElementById("apiRetries") as HTMLInputElement;
const apiTimeoutInput = document.getElementById("apiTimeout") as HTMLInputElement;
const apiRetryDelayInput = document.getElementById("apiRetryDelay") as HTMLInputElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

async function loadSettings(): Promise<void> {
  const data = await chrome.storage.local.get(["apiKey", "language", "cardDisplayTime", "apiRetries", "apiTimeout", "apiRetryDelay"]);
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
  }
  if (data.language) {
    languageSelect.value = data.language;
  }
  if (data.cardDisplayTime != null) {
    cardDisplayTimeInput.value = String(data.cardDisplayTime);
  }
  if (data.apiRetries != null) {
    apiRetriesInput.value = String(data.apiRetries);
  }
  if (data.apiTimeout != null) {
    apiTimeoutInput.value = String(data.apiTimeout);
  }
  if (data.apiRetryDelay != null) {
    apiRetryDelayInput.value = String(data.apiRetryDelay);
  }
  if (data.apiKey || data.language || data.cardDisplayTime != null || data.apiRetries != null || data.apiTimeout != null || data.apiRetryDelay != null) {
    showStatus("Settings loaded", "success");
  }
}

function showStatus(message: string, type: "success" | "error"): void {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

saveBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  const language = languageSelect.value as Language;
  const cardDisplayTimeRaw = cardDisplayTimeInput.value.trim();
  const apiRetriesRaw = apiRetriesInput.value.trim();
  const apiTimeoutRaw = apiTimeoutInput.value.trim();
  const apiRetryDelayRaw = apiRetryDelayInput.value.trim();
  
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  let cardDisplayTime: number = CARD_DISPLAY_TIME_DEFAULT;
  if (cardDisplayTimeRaw !== "") {
    const parsed = parseInt(cardDisplayTimeRaw, 10);
    if (isNaN(parsed) || parsed < CARD_DISPLAY_TIME_MIN || parsed > CARD_DISPLAY_TIME_MAX) {
      showStatus(`Card display time must be an integer between ${CARD_DISPLAY_TIME_MIN} and ${CARD_DISPLAY_TIME_MAX}`, "error");
      return;
    }
    cardDisplayTime = parsed;
  }

  let apiRetries: number = API_RETRIES_DEFAULT;
  if (apiRetriesRaw !== "") {
    const parsed = parseInt(apiRetriesRaw, 10);
    if (isNaN(parsed) || parsed < API_RETRIES_MIN || parsed > API_RETRIES_MAX) {
      showStatus(`API retries must be an integer between ${API_RETRIES_MIN} and ${API_RETRIES_MAX}`, "error");
      return;
    }
    apiRetries = parsed;
  }

  let apiTimeout: number = API_TIMEOUT_DEFAULT;
  if (apiTimeoutRaw !== "") {
    const parsed = parseInt(apiTimeoutRaw, 10);
    if (isNaN(parsed) || parsed < API_TIMEOUT_MIN || parsed > API_TIMEOUT_MAX) {
      showStatus(`API timeout must be an integer between ${API_TIMEOUT_MIN} and ${API_TIMEOUT_MAX}`, "error");
      return;
    }
    apiTimeout = parsed;
  }

  let apiRetryDelay: number = API_RETRY_DELAY_DEFAULT;
  if (apiRetryDelayRaw !== "") {
    const parsed = parseInt(apiRetryDelayRaw, 10);
    if (isNaN(parsed) || parsed < API_RETRY_DELAY_MIN || parsed > API_RETRY_DELAY_MAX) {
      showStatus(`Retry delay must be an integer between ${API_RETRY_DELAY_MIN} and ${API_RETRY_DELAY_MAX}`, "error");
      return;
    }
    apiRetryDelay = parsed;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const storageData: StorageData = { apiKey, language, cardDisplayTime, apiRetries, apiTimeout, apiRetryDelay };
    await chrome.storage.local.set(storageData);
    showStatus("Settings saved successfully", "success");
  } catch (error) {
    showStatus("Failed to save settings", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

loadSettings();
