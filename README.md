# SciTech

An illustrated, dependency-free introduction to AI for curious students. The site consists of static HTML, CSS, and vanilla JavaScript. Chapter data lives in `chapters.json`; the committed HTML is generated from it.

## Build, preview, and test

Run `python3 build.py` from the repository root after editing chapter data. To preview locally, run `python3 -m http.server 8000` and open <http://localhost:8000/>. Run `npm test` to check the generated pages and deployment setup. Python 3 and Node.js are development tools only; visitors need neither.

## Add a chapter

Add the PNG to `docs/assets/`, then add an entry to `chapters.json` in the desired order. Give it a unique slug matching the PNG filename without `.png`, an `image` filename, a title, description, topic-based alt text, intro, two or three `[heading, paragraph]` sections, and a `question` for the Think about it note. Run `python3 build.py` and commit the generated pages along with the data. If you remove a chapter, remove its old generated HTML too.

The builder reads PNG header dimensions to avoid layout shift; it does not display or process the images. All HTML files stay at the repository root so relative `docs/assets/` paths work both locally and at the GitHub Pages project URL <https://codess-aus.github.io/SciTech/>.

## Publish on GitHub Pages

The workflow in `.github/workflows/pages.yml` runs `npm test` and publishes the root HTML pages, `styles.css`, `theme.js`, and `docs/assets/*.png` from `main`. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. Pushes to `main` deploy automatically; the workflow can also be run manually from Actions.
