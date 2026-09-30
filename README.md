# SciTech

A small illustrated field guide to the night sky, ocean, and forest. Each chapter starts with an original image and explains details visible in it. The site works as static HTML, CSS, SVG, and JavaScript without a build step or external dependencies.

## Preview and test

Run `npm run serve` and visit <http://localhost:8000/> to preview the site locally. Run `npm test` for focused checks of page links, image references, chapter order, and the theme switch. Python 3 and Node.js are needed only for these development commands, not for visitors.

## Publish on GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select the publishing branch and **/(root)** folder, then save. GitHub Pages will serve `index.html` and the linked chapter pages directly. The site uses relative URLs so it also works under a project URL such as `/SciTech/`.