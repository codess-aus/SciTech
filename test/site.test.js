const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const root = join(__dirname, "..");
const pages = ["index.html", "stars.html", "ocean.html", "forest.html"];

for (const page of pages) {
  test(`${page} includes accessible images and working local links`, () => {
    const html = readFileSync(join(root, page), "utf8");
    assert.match(html, /<main id="main">/);
    assert.match(html, /<h1\b/);
    assert.match(html, /href="#main">Skip to content/);
    assert.match(html, /class="theme-toggle".*aria-pressed="false"/);

    for (const [, src, alt] of html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)) {
      assert.ok(alt, `${page}: image ${src} needs alternate text`);
      assert.ok(existsSync(join(root, src)), `${page}: missing image ${src}`);
    }
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (href === "styles.css") continue;
      const [path, fragment] = href.split("#");
      const target = readFileSync(join(root, path || page), "utf8");
      if (fragment) assert.ok(target.includes(`id="${fragment}"`), `${page}: missing #${fragment}`);
    }
  });
}

test("chapters have matching hero images and ordered previous/next links", () => {
  const chapters = ["stars", "ocean", "forest"];
  chapters.forEach((chapter, index) => {
    const html = readFileSync(join(root, `${chapter}.html`), "utf8");
    assert.match(html, new RegExp(`<figure class="chapter-figure"><img src="images/${chapter}.svg" alt="[^"]+"`));
    assert.match(html, /<figcaption>[^<]+<\/figcaption>/);
    assert.match(html, /<div class="chapter-content">[\s\S]*<h2>/);
    if (index > 0) assert.ok(html.includes(`href="${chapters[index - 1]}.html"`));
    if (index < chapters.length - 1) assert.ok(html.includes(`href="${chapters[index + 1]}.html"`));
    else assert.ok(html.includes('href="index.html#chapters"'));
  });
});

test("Pages deployment waits for tests and publishes only the site files", () => {
  const workflow = readFileSync(join(root, ".github/workflows/pages.yml"), "utf8");
  assert.match(workflow, /push:\s*\n\s+branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /deploy:\s*\n\s+needs: test/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /permissions:\s*\n\s+contents: read\s*\n\s+pages: write\s*\n\s+id-token: write/);
  assert.match(workflow, /cp index\.html stars\.html ocean\.html forest\.html styles\.css theme\.js "\$site\/"/);
  assert.match(workflow, /cp images\/\*\.svg "\$site\/images\/"/);
  assert.match(workflow, /touch "\$site\/\.nojekyll"/);
  assert.doesNotMatch(workflow, /cp .*\b(?:test|docs|package\.json|README\.md|LICENSE)\b/);
});

test("theme follows system preference, toggles, and persists across pages", () => {
  const script = readFileSync(join(root, "theme.js"), "utf8");
  const saved = new Map();
  const createPage = (systemDark) => {
    const attributes = {};
    const button = {
      hidden: true,
      setAttribute(name, value) { attributes[name] = value; },
      addEventListener(_event, handler) { this.click = handler; },
    };
    const document = {
      documentElement: { dataset: {} },
      querySelector() { return button; },
    };
    const localStorage = {
      getItem(key) { return saved.get(key) ?? null; },
      setItem(key, value) { saved.set(key, value); },
    };
    runInNewContext(script, {
      document, localStorage,
      window: { matchMedia() { return { matches: systemDark }; } },
    });
    return { button, document, attributes };
  };

  const first = createPage(true);
  assert.equal(first.document.documentElement.dataset.theme, "dark");
  assert.equal(first.attributes["aria-pressed"], "true");
  assert.equal(first.button.hidden, false);
  first.button.click();
  assert.equal(first.document.documentElement.dataset.theme, "light");
  assert.equal(first.attributes["aria-pressed"], "false");
  assert.equal(saved.get("scitech-theme"), "light");
  assert.equal(createPage(true).document.documentElement.dataset.theme, "light");
});
