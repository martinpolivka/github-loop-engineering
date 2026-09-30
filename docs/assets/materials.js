(() => {
  "use strict";

  function revealTarget() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const slide = target.closest(".deck-stage > .slide");
    if (slide && target !== slide) {
      const url = new URL(location.href);
      url.hash = slide.id;
      history.replaceState(null, "", url.href);
    }
    for (let parent = target; parent; parent = parent.parentElement) {
      if (parent.tagName === "DETAILS") parent.open = true;
    }
  }

  // Resolve legacy numeric slide links before the unchanged deck runtime starts.
  revealTarget();
  window.addEventListener("hashchange", revealTarget);

  document.addEventListener("keydown", (event) => {
    if (!document.querySelector(".deck-stage") || !["ArrowUp", "ArrowDown"].includes(event.key) ||
        document.querySelector("dialog[open]") || event.altKey || event.ctrlKey || event.metaKey ||
        !(event.target instanceof Element) ||
        event.target.closest("input, select, textarea, [contenteditable]")) return;
    event.preventDefault();
    event.target.dispatchEvent(new KeyboardEvent("keydown", {
      key: event.key === "ArrowDown" ? "ArrowRight" : "ArrowLeft",
      bubbles: true, cancelable: true, shiftKey: event.shiftKey
    }));
  });

  for (const pre of document.querySelectorAll(".code pre")) {
    if (pre.closest(".slide-content, .deck-stage")) continue;
    const text = pre.querySelector("code")?.textContent ?? pre.textContent;
    const button = document.createElement("button");
    button.className = "ctrl";
    button.type = "button";
    button.dataset.copyCommand = "";
    button.setAttribute("aria-label", "Copy command");
    button.setAttribute("aria-live", "polite");
    button.title = "Copy command";
    button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h7.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11H13V9.5h1.25a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25h-7.5a.25.25 0 0 0-.25.25V3H5Z"/></svg>';
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        button.setAttribute("aria-label", "Copied");
        button.title = "Copied";
      } catch {
        button.setAttribute("aria-label", "Select and copy manually");
        button.title = "Select and copy manually";
      }
      window.setTimeout(() => {
        button.setAttribute("aria-label", "Copy command");
        button.title = "Copy command";
      }, 1500);
    });
    pre.before(button);
  }
})();
