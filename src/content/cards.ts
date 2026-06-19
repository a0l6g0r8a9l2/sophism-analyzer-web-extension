import type { Fallacy } from "../shared/types";

let cardEl: HTMLDivElement | null = null;

export function showFallacyCard(fallacy: Fallacy): void {
  hideFallacyCard();

  cardEl = document.createElement("div");
  cardEl.className = `sophism-card sophism-card-${fallacy.severity}`;
  cardEl.innerHTML = `
    <div class="card-label">${fallacy.label}</div>
    <div class="card-category" data-category="${fallacy.category}">${fallacy.category}</div>
    <div class="card-brief">${fallacy.brief}</div>
    ${fallacy.quote ? `<div class="card-quote">"${fallacy.quote}"</div>` : ""}
  `;

  const playerContainer = document.querySelector(".html5-video-container");
  if (playerContainer) {
    playerContainer.appendChild(cardEl);
  }
}

export function hideFallacyCard(): void {
  if (cardEl) {
    cardEl.remove();
    cardEl = null;
  }

  const existing = document.querySelector(".sophism-card");
  if (existing) {
    existing.remove();
  }
}
