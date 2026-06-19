import type { Language, StorageData } from "../shared/types";

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const languageSelect = document.getElementById("language") as HTMLSelectElement;
const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

async function loadSettings(): Promise<void> {
  const data = await chrome.storage.local.get(["apiKey", "language"]);
  if (data.apiKey) {
    apiKeyInput.value = data.apiKey;
  }
  if (data.language) {
    languageSelect.value = data.language;
  }
  if (data.apiKey || data.language) {
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
  
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const storageData: StorageData = { apiKey, language };
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
