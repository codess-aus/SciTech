const toggle = document.querySelector(".theme-toggle");

if (toggle) {
  let dark = document.documentElement.dataset.theme === "dark";

  function updateTheme() {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    toggle.setAttribute("aria-pressed", String(dark));
    const label = dark ? "Switch to light mode" : "Switch to dark mode";
    toggle.setAttribute("aria-label", label);
    toggle.querySelector(".theme-label").textContent = label;
  }

  updateTheme();
  toggle.addEventListener("click", () => {
    dark = !dark;
    updateTheme();
    try {
      localStorage.setItem("scitech-theme", dark ? "dark" : "light");
    } catch {
      // The switch still works when storage is unavailable.
    }
  });
}
