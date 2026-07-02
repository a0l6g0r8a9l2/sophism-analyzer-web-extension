/**
 * Transient toast notifications shown over the YouTube player.
 *
 * Single-instance: showing a new toast removes any existing one. Uses
 * `textContent` (never `innerHTML`) so the message is treated as plain text,
 * which is safe even if the string ever originates from user/model output.
 *
 * `error` variant announces a terminal analysis failure (red accent).
 * `info` variant announces in-flight retries (neutral/blue accent).
 */

export type ToastVariant = "error" | "info";

let toastEl: HTMLDivElement | null = null;
let hideTimerId: number | null = null;

export function hideToast(): void {
  if (hideTimerId !== null) {
    clearTimeout(hideTimerId);
    hideTimerId = null;
  }
  if (toastEl) {
    toastEl.remove();
    toastEl = null;
  }
  const existing = document.querySelector(".sophism-toast");
  if (existing) {
    existing.remove();
  }
}

/**
 * Show a toast with the given message for `displayMs` milliseconds.
 * Replaces any currently visible toast.
 *
 * @param variant visual style: "error" (red) or "info" (neutral)
 * @param message plain-text message
 * @param displayMs time until auto-hide, in milliseconds
 */
export function showToast(variant: ToastVariant, message: string, displayMs: number): void {
  hideToast();

  toastEl = document.createElement("div");
  toastEl.className = `sophism-toast sophism-toast-${variant}`;

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = variant === "error" ? "⚠" : "↻";

  const text = document.createElement("span");
  text.className = "toast-text";
  text.textContent = message;

  toastEl.appendChild(icon);
  toastEl.appendChild(text);

  const playerContainer = document.querySelector(".html5-video-container");
  if (playerContainer) {
    playerContainer.appendChild(toastEl);
  } else {
    document.body.appendChild(toastEl);
  }

  hideTimerId = window.setTimeout(() => {
    hideToast();
  }, displayMs);
}
