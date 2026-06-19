import type { Fallacy } from "../shared/types";

let markersContainer: HTMLDivElement | null = null;

export function createMarkers(fallacies: Fallacy[]): void {
  removeMarkers();

  const progressBar = document.querySelector(".ytp-progress-bar-container");
  if (!progressBar) return;

  markersContainer = document.createElement("div");
  markersContainer.id = "sophism-markers";
  markersContainer.className = "sophism-markers-container";

  const video = document.querySelector("video");
  if (!video) return;

  const duration = video.duration || 0;

  fallacies.forEach((fallacy, index) => {
    const marker = document.createElement("div");
    marker.className = `sophism-marker sophism-marker-${fallacy.severity}`;
    
    const position = (fallacy.timestamp / duration) * 100;
    marker.style.left = `${position}%`;
    
    marker.title = `${fallacy.label} (${formatTime(fallacy.timestamp)})`;
    
    marker.addEventListener("mouseenter", () => {
      showMarkerTooltip(marker, fallacy);
    });
    
    marker.addEventListener("mouseleave", () => {
      hideMarkerTooltip();
    });

    markersContainer!.appendChild(marker);
  });

  progressBar.appendChild(markersContainer);
}

export function removeMarkers(): void {
  if (markersContainer) {
    markersContainer.remove();
    markersContainer = null;
  }
  
  const existing = document.getElementById("sophism-markers");
  if (existing) {
    existing.remove();
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

let tooltipEl: HTMLDivElement | null = null;

function showMarkerTooltip(marker: HTMLElement, fallacy: Fallacy): void {
  hideMarkerTooltip();

  tooltipEl = document.createElement("div");
  tooltipEl.className = "sophism-marker-tooltip";
  tooltipEl.innerHTML = `
    <div class="tooltip-name">${fallacy.label}</div>
    <div class="tooltip-type">${fallacy.type}</div>
    <div class="tooltip-time">${formatTime(fallacy.timestamp)}</div>
    <div class="tooltip-brief">${fallacy.brief}</div>
  `;

  const rect = marker.getBoundingClientRect();
  tooltipEl.style.left = `${rect.left}px`;
  tooltipEl.style.bottom = "40px";

  document.body.appendChild(tooltipEl);
}

function hideMarkerTooltip(): void {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}
