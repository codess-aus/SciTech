const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, existsSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const root = join(__dirname, "..");
const chapters = JSON.parse(readFileSync(join(root, "chapters.json"), "utf8"));
const html = (page) => readFileSync(join(root, page), "utf8");

test("home links to every chapter with a numbered, lazy-loaded thumbnail", () => {
  const home = html("index.html");
  assert.equal(chapters.length, 17);
  assert.deepEqual(
    readdirSync(join(root, "docs/assets")).filter((name) => name.endsWith(".png")).sort(),
    chapters.map(({ image }) => image).sort(),
  );
  assert.equal((home.match(/<h1\b/g) || []).length, 1);
  assert.equal((home.match(/class="chapter-card"/g) || []).length, 17);
  chapters.forEach((chapter, index) => {
    assert.ok(home.includes(`href="${chapter.slug}.html"`));
    assert.ok(home.includes(`Chapter ${String(index + 1).padStart(2, "0")}`));
    assert.match(home, new RegExp(`<img src="docs/assets/${chapter.image}"[^>]*loading="lazy" decoding="async"`));
    assert.ok(home.includes(chapter.description));
  });
});

test("each chapter begins with its own eager hero and has ordered navigation", () => {
  const pages = readdirSync(root).filter((name) => name.endsWith(".html") && name !== "index.html");
  assert.equal(pages.length, 17);
  chapters.forEach((chapter, index) => {
    const page = `${chapter.slug}.html`;
    assert.ok(existsSync(join(root, page)), `${page} is missing`);
    const markup = html(page);
    assert.equal((markup.match(/<h1\b/g) || []).length, 1);
    assert.ok(markup.includes(`<h1>${chapter.title}</h1>`));
    assert.match(markup, /<main id="main">\s*<article>\s*<figure class="chapter-hero"><img /);
    assert.match(markup, new RegExp(`<figure class="chapter-hero"><img src="docs/assets/${chapter.image}"[^>]*width="[1-9][0-9]*" height="[1-9][0-9]*" loading="eager" fetchpriority="high"`));
    assert.ok(markup.includes(`alt="${chapter.alt}"`));
    assert.ok(existsSync(join(root, "docs/assets", chapter.image)));
    assert.equal((markup.match(/<section><h2>/g) || []).length, chapter.sections.length);
    assert.ok(chapter.sections.length >= 2 && chapter.sections.length <= 3);
    assert.ok(chapter.story && chapter.story.paragraphs.length >= 2, `${page}: missing story`);
    assert.ok(chapter.example && chapter.example.body, `${page}: missing example`);
    assert.ok(chapter.fun_fact, `${page}: missing fun fact`);
    assert.ok(chapter.try_it && chapter.try_it.steps.length >= 3, `${page}: missing try-it activity`);
    assert.match(markup, /<section class="story-card">[\s\S]*?<\/section>/);
    assert.match(markup, /<section class="example-card">[\s\S]*?<\/section>/);
    assert.match(markup, /<aside class="fun-fact">[\s\S]*?<h2>Fun fact<\/h2>/);
    assert.match(markup, /<section class="try-it-card">[\s\S]*?<ol>[\s\S]*?<\/ol>/);
    assert.ok(markup.indexOf('class="story-card"') < markup.indexOf('class="example-card"'));
    assert.ok(markup.indexOf('class="example-card"') < markup.indexOf('class="fun-fact"'));
    assert.ok(markup.indexOf('class="fun-fact"') < markup.indexOf('class="try-it-card"'));
    assert.ok(markup.includes("<h2>Think about it</h2>"));
    const previous = index ? `${chapters[index - 1].slug}.html` : "index.html";
    const next = index < chapters.length - 1 ? `${chapters[index + 1].slug}.html` : "index.html";
    assert.match(markup, new RegExp(`<nav class="chapter-nav container"[^>]*>\\s*<a href="${previous}">`));
    assert.ok(markup.includes(`<a href="${next}"><span>${index < chapters.length - 1 ? "Next" : "Home"}</span>`));
    assert.ok(markup.includes(index ? chapters[index - 1].title : "<strong>Home</strong>"));
    assert.ok(markup.includes(index < chapters.length - 1 ? chapters[index + 1].title : "<strong>Home</strong>"));
  });
});

test("Michelle's chapter has secure blog and connections links after the activity", () => {
  const markup = html("hi-im-michelle-meet-the-ai-expert.html");
  const linksStart = markup.indexOf("<!-- Links to Michelle's blog and connections page. -->");
  const activityEnd = markup.indexOf("</section>", markup.indexOf('<section class="try-it-card">'));
  const thinkAboutIt = markup.indexOf('<aside class="detail-note">');

  assert.ok(linksStart > activityEnd && linksStart < thinkAboutIt);
  assert.match(markup, /<section class="example-card">\s*<h2>Connect with Michelle<\/h2>\s*<ul>/);
  assert.match(markup, /<a href="https:\/\/www\.scaling-guacamole\.com\/" target="_blank" rel="noopener noreferrer">Read Michelle&#x27;s blog<\/a>/);
  assert.match(markup, /<a href="https:\/\/www\.scaling-guacamole\.com\/about\.html" target="_blank" rel="noopener noreferrer">Find Michelle&#x27;s connections<\/a>/);
});

test("all pages contain landmarks, working local links, and a theme button", () => {
  for (const page of ["index.html", ...chapters.map(({ slug }) => `${slug}.html`)]) {
    const markup = html(page);
    assert.match(markup, /<html lang="en">/);
    assert.match(markup, /href="#main">Skip to content/);
    assert.match(markup, /<header class="site-header">/);
    assert.match(markup, /<nav aria-label="Main navigation">/);
    assert.match(markup, /<main id="main">/);
    assert.match(markup, /<footer class="site-footer">/);
    assert.match(markup, /<button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">/);
    for (const [, src, alt] of markup.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/g)) {
      assert.ok(alt, `${page}: ${src} has no alt text`);
      assert.ok(existsSync(join(root, src)), `${page}: missing ${src}`);
    }
    for (const [, href] of markup.matchAll(/href="([^"]+)"/g)) {
      if (/^https?:\/\//.test(href)) continue;
      const [path, fragment] = href.split("#");
      const targetPath = join(root, path || page);
      assert.ok(existsSync(targetPath), `${page}: missing ${href}`);
      if (fragment) assert.ok(html(path || page).includes(`id="${fragment}"`), `${page}: missing #${fragment}`);
    }
  }
});

test("theme is applied in head and switch persists with an updated accessible label", () => {
  const inline = html("index.html").match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const script = readFileSync(join(root, "theme.js"), "utf8");
  const saved = new Map();
  const createPage = (systemDark, storageAvailable = true) => {
    const attributes = {};
    const label = { textContent: "" };
    const button = {
      setAttribute(name, value) { attributes[name] = value; },
      querySelector() { return label; },
      addEventListener(_event, handler) { this.click = handler; },
    };
    const document = {
      documentElement: { dataset: {} },
      querySelector() { return button; },
    };
    const localStorage = {
      getItem(key) { if (!storageAvailable) throw Error("blocked"); return saved.get(key) ?? null; },
      setItem(key, value) { if (!storageAvailable) throw Error("blocked"); saved.set(key, value); },
    };
    const context = {
      document, localStorage,
      matchMedia() { return { matches: systemDark }; },
    };
    runInNewContext(inline, context);
    assert.equal(document.documentElement.dataset.theme, saved.get("scitech-theme") ?? (systemDark ? "dark" : "light"));
    runInNewContext(script, context);
    return { button, document, attributes, label };
  };
  const first = createPage(true);
  assert.equal(first.attributes["aria-pressed"], "true");
  assert.equal(first.attributes["aria-label"], "Switch to light mode");
  first.button.click();
  assert.equal(first.document.documentElement.dataset.theme, "light");
  assert.equal(first.label.textContent, "Switch to dark mode");
  assert.equal(saved.get("scitech-theme"), "light");
  assert.equal(createPage(true).document.documentElement.dataset.theme, "light");
  createPage(false, false).button.click();
});

test("Pages deploys the root HTML and PNG assets after tests pass", () => {
  const workflow = readFileSync(join(root, ".github/workflows/pages.yml"), "utf8");
  assert.match(workflow, /deploy:\s*\n\s+needs: test/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /cp \.\/\*\.html styles\.css theme\.js "\$site\/"/);
  assert.match(workflow, /cp docs\/assets\/\*\.png "\$site\/docs\/assets\/"/);
  assert.match(workflow, /touch "\$site\/\.nojekyll"/);
});
