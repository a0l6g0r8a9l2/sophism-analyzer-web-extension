import type { Fallacy, Message } from "../shared/types";
import { createAnalyzeButton, updateButtonState } from "./button";
import { createMarkers, removeMarkers } from "./markers";
import { createCounter, updateCounter, showCounterPulse, setCounterFallacies } from "./counter";
import { showFallacyCard, hideFallacyCard } from "./cards";
import { createFallacyList, toggleFallacyList } from "./list";
import { setupNavigationListener, getCurrentVideoId } from "./navigation";

let currentVideoId: string | null = null;
let currentFallacies: Fallacy[] = [];
let isAnalyzing = false;
let initialized = false;
let cardDisplayTimeMs = 10 * 1000;

function resetState(): void {
  currentVideoId = null;
  currentFallacies = [];
  isAnalyzing = false;
  removeMarkers();
  hideFallacyCard();
  updateCounter(0);
  updateButtonState("idle");
}

function injectUI(): void {
  const playerControls = document.querySelector(".ytp-right-controls");
  if (!playerControls) return;

  const existingBtn = document.getElementById("sophism-analyze-btn");
  if (existingBtn) return;

  const button = createAnalyzeButton();
  button.addEventListener("click", handleAnalyzeClick);
  playerControls.insertBefore(button, playerControls.firstChild);

  const counter = createCounter();
  const playerContainer = document.querySelector(".html5-video-container");
  if (playerContainer) {
    playerContainer.appendChild(counter);
  }

  const list = createFallacyList();
  if (playerContainer) {
    playerContainer.appendChild(list);
  }
}

async function loadCardDisplayTime(): Promise<void> {
  const data = await chrome.storage.local.get("cardDisplayTime");
  if (data.cardDisplayTime != null) {
    cardDisplayTimeMs = data.cardDisplayTime * 1000;
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.cardDisplayTime) {
    const newValue = changes.cardDisplayTime.newValue;
    cardDisplayTimeMs = (newValue != null ? newValue : 10) * 1000;
  }
});

function setupVideoTimeUpdate(): void {
  const video = document.querySelector("video");
  if (!video) return;

  let lastTriggeredIndex = -1;

  video.addEventListener("timeupdate", () => {
    if (currentFallacies.length === 0) return;

    const currentTime = video.currentTime;
    
    for (let i = 0; i < currentFallacies.length; i++) {
      const fallacy = currentFallacies[i];
      const timeDiff = Math.abs(currentTime - fallacy.timestamp);
      
      if (timeDiff < 1 && i !== lastTriggeredIndex) {
        lastTriggeredIndex = i;
        showFallacyCard(fallacy);
        showCounterPulse();
        
        setTimeout(() => {
          hideFallacyCard();
        }, cardDisplayTimeMs);
        break;
      }
    }
  });

  video.addEventListener("seeked", () => {
    lastTriggeredIndex = -1;
  });
}

function handleAnalyzeClick(): void {
  if (__DEBUG__) {
    console.log("[Content] Analyze button clicked");
  }
  if (isAnalyzing) return;

  const videoId = getCurrentVideoId();
  if (!videoId) {
    updateButtonState("error", "No video detected");
    return;
  }

  currentVideoId = videoId;
  isAnalyzing = true;
  updateButtonState("loading");

  const videoUrl = window.location.href;
  if (__DEBUG__) {
    console.log("[Content] Sending ANALYZE_VIDEO for:", videoId);
  }
  
  try {
    chrome.runtime.sendMessage({
      type: "ANALYZE_VIDEO",
      videoId,
      videoUrl,
    } as Message);
  } catch (error: any) {
    if (error.message?.includes("Extension context invalidated")) {
      if (__DEBUG__) {
        console.log("[Content] Extension context invalidated, reloading page...");
      }
      window.location.reload();
    } else {
      updateButtonState("error", "Failed to send analysis request");
      isAnalyzing = false;
    }
  }
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  try {
    if (__DEBUG__) {
      console.log("[Content] Received message:", message.type);
    }

    if (message.type === "ANALYSIS_RESULT" && message.result) {
      currentFallacies = message.result.fallacies;
      isAnalyzing = false;
      
      updateButtonState("complete");
      updateCounter(currentFallacies.length);
      createMarkers(currentFallacies);
      setCounterFallacies(currentFallacies);
    }

    if (message.type === "ANALYSIS_ERROR" && message.error) {
      isAnalyzing = false;
      updateButtonState("error", message.error.error);
    }
  } catch (error: any) {
    if (error.message?.includes("Extension context invalidated")) {
      if (__DEBUG__) {
        console.log("[Content] Extension context invalidated, reloading page...");
      }
      window.location.reload();
    }
  }
});

function init(): void {
  if (initialized) return;
  initialized = true;

  loadCardDisplayTime();

  const checkForPlayer = setInterval(() => {
    const videoId = getCurrentVideoId();
    const playerControls = document.querySelector(".ytp-right-controls");
    
    if (videoId && playerControls) {
      clearInterval(checkForPlayer);
      injectUI();
      setupVideoTimeUpdate();
    }
  }, 1000);

  setupNavigationListener(() => {
    resetState();
    setTimeout(() => {
      injectUI();
      setupVideoTimeUpdate();
    }, 1500);
  });
}

init();
