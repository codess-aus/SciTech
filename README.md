# SciTech

A small illustrated field guide to the night sky, ocean, and forest. Each chapter starts with an original image and explains details visible in it. The site works as static HTML, CSS, SVG, and JavaScript without a build step or external dependencies.

## Preview and test

Run `npm run serve` and visit <http://localhost:8000/> to preview the site locally. Run `npm test` for focused checks of page links, image references, chapter order, and the theme switch. Python 3 and Node.js are needed only for these development commands, not for visitors.

## Publish on GitHub Pages

The workflow in `.github/workflows/pages.yml` runs `npm test` and deploys the static site from `main`. It publishes only the HTML pages, stylesheet, theme script, and illustrations in `images/`; no build step is needed.

Expected site URL: <https://codess-aus.github.io/SciTech/>.

To activate deployment:

1. Merge the workflow into `main`.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Pushes to `main` start deployment. To run it manually, open **Actions → Deploy to GitHub Pages → Run workflow** and select `main`.
4. Check the workflow run's `test` and `deploy` jobs for success. The deployed URL is also shown on the `github-pages` environment.

The site uses relative links, so it works under the project URL `/SciTech/`.