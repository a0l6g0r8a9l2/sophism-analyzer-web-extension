import type { Fallacy } from "../shared/types";

let counterEl: HTMLDivElement | null = null;
let currentFallacies: Fallacy[] = [];

export function createCounter(): HTMLDivElement {
  const existing = document.getElementById("sophism-counter");
  if (existing) {
    return existing as HTMLDivElement;
  }

  counterEl = document.createElement("div");
  counterEl.id = "sophism-counter";
  counterEl.className = "sophism-counter";
  counterEl.innerHTML = `
    <span class="counter-icon">⚠</span>
    <span class="counter-count">0</span>
  `;

  counterEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (__DEBUG__) {
      console.log("[Counter] Clicked, fallacies count:", currentFallacies.length);
    }
    document.dispatchEvent(
      new CustomEvent("sophism-toggle-list", {
        detail: { fallacies: currentFallacies },
        bubbles: true,
      })
    );
  });

  return counterEl;
}

export function setCounterFallacies(fallacies: Fallacy[]): void {
  currentFallacies = fallacies;
}

export function updateCounter(count: number): void {
  counterEl = document.getElementById("sophism-counter") as HTMLDivElement;
  if (!counterEl) return;

  const countEl = counterEl.querySelector(".counter-count");
  if (countEl) {
    countEl.textContent = String(count);
  }

  if (count > 0) {
    counterEl.classList.add("sophism-counter-visible");
  } else {
    counterEl.classList.remove("sophism-counter-visible");
  }
}

export function showCounterPulse(): void {
  counterEl = document.getElementById("sophism-counter") as HTMLDivElement;
  if (!counterEl) return;

  counterEl.classList.add("sophism-counter-pulse");
  
  setTimeout(() => {
    counterEl?.classList.remove("sophism-counter-pulse");
  }, 600);
}
