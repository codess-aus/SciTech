const toggle = document.querySelector(".theme-toggle");

if (toggle) {
  let savedTheme;
  try {
    savedTheme = localStorage.getItem("scitech-theme");
  } catch {
    // The switch still works when storage is unavailable.
  }

  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  let dark = savedTheme === "dark" || (savedTheme !== "light" && preferredDark);

  function updateTheme() {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    toggle.setAttribute("aria-pressed", String(dark));
  }

  updateTheme();
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    dark = !dark;
    updateTheme();
    try {
      localStorage.setItem("scitech-theme", dark ? "dark" : "light");
    } catch {
      // The current page can still change theme without storage.
    }
  });
}
