"""Generate the static SciTech site from its chapter data."""

import json
import re
import struct
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "docs" / "assets"


def text(value):
    return escape(value, quote=True)


def dimensions(path):
    # PNG dimensions are in the IHDR header; no image processing library is needed.
    with path.open("rb") as image:
        header = image.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"Not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


def head(title, description):
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{text(description)}">
  <title>{text(title)} | SciTech</title>
  <script>
    try {{
      const saved = localStorage.getItem("scitech-theme");
      document.documentElement.dataset.theme = saved === "light" || saved === "dark"
        ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }} catch {{
      document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }}
  </script>
  <link rel="stylesheet" href="styles.css">
  <script src="theme.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="index.html" aria-label="SciTech home">✳ SciTech</a>
      <nav aria-label="Main navigation"><a href="index.html#chapters">All chapters</a></nav>
      <button class="theme-toggle" type="button" aria-label="Switch to dark mode" aria-pressed="false">
        <span class="theme-icon" aria-hidden="true">◐</span> <span class="theme-label">Switch to dark mode</span>
      </button>
    </div>
  </header>
"""


def footer():
    return """  <footer class="site-footer">
    <div class="container footer-inner"><span>✳ SciTech</span><span>Curiosity makes a difference.</span><a href="#main">Back to top ↑</a></div>
  </footer>
</body>
</html>
"""


def image(chapter, hero=False):
    width, height = dimensions(ASSETS / chapter["image"])
    extra = 'loading="eager" fetchpriority="high"' if hero else 'loading="lazy" decoding="async"'
    return (f'<img src="docs/assets/{text(chapter["image"])}" alt="{text(chapter["alt"])}" '
            f'width="{width}" height="{height}" {extra}>')


def home(chapters):
    cards = []
    for number, chapter in enumerate(chapters, 1):
        cards.append(f"""        <article class="chapter-card">
          <a href="{text(chapter['slug'])}.html">
            <div class="card-image">{image(chapter)}</div>
            <div class="card-body">
              <span class="chapter-number">Chapter {number:02d}</span>
              <h3>{text(chapter['title'])}</h3>
              <p>{text(chapter['description'])}</p>
              <span class="card-cta">Read chapter <span aria-hidden="true">↗</span></span>
            </div>
          </a>
        </article>""")
    return head("Explore AI", "Seventeen illustrated chapters about AI, people, and the future.") + f"""  <main id="main">
    <section class="home-hero">
      <div class="container">
        <p class="eyebrow">An illustrated guide to AI</p>
        <h1>Curious about <em>AI?</em></h1>
        <p>Explore AI through friendly stories, everyday examples, and activities you can try. Meet new ideas one chapter at a time.</p>
        <a class="button-link" href="#chapters">Explore the chapters <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <section class="chapters container" id="chapters" aria-labelledby="chapters-title">
      <p class="eyebrow">Choose where to begin</p>
      <h2 id="chapters-title">The chapters</h2>
      <div class="chapter-grid">
{chr(10).join(cards)}
      </div>
    </section>
  </main>
""" + footer()


def story_section(story):
  # Render a short character story when the chapter includes one.
  if not story:
      return ""
  paragraphs = "\n".join(f"          <p>{text(paragraph)}</p>" for paragraph in story.get("paragraphs", []))
  return f"""        <section class="story-card">
        <h2>{text(story.get('title', 'A story'))}</h2>
{paragraphs}
      </section>"""


def example_section(example):
  # Show a familiar real-life example when one is available.
  if not example:
      return ""
  return f"""        <section class="example-card">
        <h2>{text(example.get('title', 'Everyday example'))}</h2>
        <p>{text(example.get('body', ''))}</p>
      </section>"""


def fun_fact_aside(fun_fact):
  # Highlight one optional, kid-friendly fact in a semantic aside.
  if not fun_fact:
      return ""
  return f"""        <aside class="fun-fact">
        <h2>Fun fact</h2>
        <p>{text(fun_fact)}</p>
      </aside>"""


def try_it_section(try_it):
  # Turn the optional activity steps into an ordered list.
  if not try_it:
      return ""
  steps = "\n".join(f"          <li>{text(step)}</li>" for step in try_it.get("steps", []))
  return f"""        <section class="try-it-card">
        <h2>{text(try_it.get('title', 'Try it'))}</h2>
        <ol>
{steps}
        </ol>
      </section>"""


def links_section(links):
  # Render optional external links as a compact enrichment card.
  if not links:
      return ""
  items = "\n".join(
      f'          <li><a href="{text(item["href"])}" target="_blank" rel="noopener noreferrer">{text(item["text"])}</a></li>'
      for item in links.get("items", [])
  )
  return f"""        <!-- Links to Michelle's blog and connections page. -->
        <section class="example-card">
        <h2>{text(links.get('title', 'Links'))}</h2>
        <ul>
{items}
        </ul>
      </section>"""


def chapter_page(chapters, index):
    chapter = chapters[index]
    sections = "\n".join(
        f"        <section><h2>{text(title)}</h2><p>{text(body)}</p></section>"
        for title, body in chapter["sections"]
    )
    # Keep optional enrichment blocks between the chapter text and its question.
    extras = "\n".join(filter(None, (
        story_section(chapter.get("story")),
        example_section(chapter.get("example")),
        fun_fact_aside(chapter.get("fun_fact")),
        try_it_section(chapter.get("try_it")),
        links_section(chapter.get("links")),
    )))
    previous = chapters[index - 1] if index else None
    following = chapters[index + 1] if index + 1 < len(chapters) else None
    back_href = f"{previous['slug']}.html" if previous else "index.html"
    next_href = f"{following['slug']}.html" if following else "index.html"
    back_title = previous["title"] if previous else "Home"
    next_title = following["title"] if following else "Home"
    return head(chapter["title"], chapter["description"]) + f"""  <main id="main">
    <article>
      <figure class="chapter-hero">{image(chapter, hero=True)}</figure>
      <div class="chapter-content">
        <p class="eyebrow">Chapter {index + 1:02d} / {len(chapters):02d}</p>
        <h1>{text(chapter['title'])}</h1>
        <p class="lead">{text(chapter['intro'])}</p>
{sections}
{extras}
        <aside class="detail-note"><h2>Think about it</h2><p>{text(chapter['question'])}</p></aside>
      </div>
    </article>
    <nav class="chapter-nav container" aria-label="Chapter navigation">
      <a href="{text(back_href)}"><span>{'Previous' if previous else 'Home'}</span><strong>{text(back_title)}</strong></a>
      <a href="{text(next_href)}"><span>{'Next' if following else 'Home'}</span><strong>{text(next_title)}</strong></a>
    </nav>
  </main>
""" + footer()


def main():
    chapters = json.loads((ROOT / "chapters.json").read_text(encoding="utf-8"))
    slugs = [chapter["slug"] for chapter in chapters]
    if len(slugs) != len(set(slugs)) or any(
        not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug)
        or chapter["image"] != f"{slug}.png"
        or not (ASSETS / chapter["image"]).is_file()
        for slug, chapter in zip(slugs, chapters)
    ):
        raise ValueError("Chapter slugs must be unique and match existing PNG filenames")
    (ROOT / "index.html").write_text(home(chapters), encoding="utf-8")
    for index, chapter in enumerate(chapters):
        (ROOT / f"{chapter['slug']}.html").write_text(chapter_page(chapters, index), encoding="utf-8")


if __name__ == "__main__":
    main()
