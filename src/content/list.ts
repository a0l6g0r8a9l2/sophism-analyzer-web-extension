import type { Fallacy } from "../shared/types";

let listEl: HTMLDivElement | null = null;
let isListVisible = false;

export function createFallacyList(): HTMLDivElement {
  const existing = document.getElementById("sophism-list");
  if (existing) {
    return existing as HTMLDivElement;
  }

  listEl = document.createElement("div");
  listEl.id = "sophism-list";
  listEl.className = "sophism-list hidden";
  listEl.innerHTML = `
    <div class="list-header">
      <h3>Detected Fallacies</h3>
      <button class="list-close">×</button>
    </div>
    <div class="list-content"></div>
  `;

  const closeBtn = listEl.querySelector(".list-close");
  closeBtn?.addEventListener("click", () => {
    hideList();
  });

  document.addEventListener("sophism-toggle-list", (e: any) => {
    const fallacies = e.detail?.fallacies || [];
    toggleFallacyList(fallacies);
  });

  document.addEventListener("click", (e) => {
    if (!isListVisible) return;
    
    const target = e.target as HTMLElement;
    const counter = document.getElementById("sophism-counter");
    
    if (listEl && !listEl.contains(target) && counter && !counter.contains(target)) {
      hideList();
    }
  });

  return listEl;
}

export function toggleFallacyList(fallacies: Fallacy[]): void {
  if (isListVisible) {
    hideList();
  } else {
    showList(fallacies);
  }
}

function hideList(): void {
  listEl = document.getElementById("sophism-list") as HTMLDivElement;
  if (!listEl) return;

  listEl.classList.remove("visible");
  listEl.classList.add("hidden");
  isListVisible = false;
}

function showList(fallacies: Fallacy[]): void {
  listEl = document.getElementById("sophism-list") as HTMLDivElement;
  if (!listEl) return;

  const content = listEl.querySelector(".list-content");
  if (!content) return;

  content.innerHTML = "";

  if (fallacies.length === 0) {
    content.innerHTML = '<div class="list-empty">No fallacies detected</div>';
  } else {
    const sorted = [...fallacies].sort((a, b) => a.timestamp - b.timestamp);
    
    sorted.forEach((fallacy) => {
      const item = document.createElement("div");
      item.className = `list-item list-item-${fallacy.severity}`;
      item.innerHTML = `
        <div class="item-header">
          <div class="item-label-time">
            <span class="item-label">${fallacy.label}</span>
            <span class="item-time">${formatTime(fallacy.timestamp)}</span>
          </div>
          <span class="item-category">${fallacy.category}</span>
        </div>
        <div class="item-brief">${fallacy.brief}</div>
        ${fallacy.quote ? `<div class="item-quote">"${fallacy.quote}"</div>` : ""}
      `;

      item.addEventListener("click", () => {
        seekToTime(fallacy.timestamp);
      });

      content.appendChild(item);
    });
  }

  listEl.classList.remove("hidden");
  listEl.classList.add("visible");
  isListVisible = true;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function seekToTime(seconds: number): void {
  try {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = seconds;
      video.play();
    }
  } catch (error) {
    if (__DEBUG__) {
      console.error("Error seeking to time:", error);
    }
  }
}
