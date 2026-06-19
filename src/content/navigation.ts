let lastUrl = window.location.href;

export function getCurrentVideoId(): string | null {
  const url = window.location.href;
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

export function setupNavigationListener(onNavigate: () => void): void {
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      onNavigate();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("popstate", () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      onNavigate();
    }
  });

  document.addEventListener("yt-navigate-finish", () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      onNavigate();
    }
  });
}
