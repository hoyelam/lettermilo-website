#!/usr/bin/env python3
"""Build the LetterMilo static site with only the Python standard library."""

from __future__ import annotations

import html
import hashlib
import json
import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
SOURCE = ROOT / "src" / "pages"

with (ROOT / "site.json").open(encoding="utf-8") as handle:
    SITE = json.load(handle)

SITE["base_url"] = os.environ.get("SITE_BASE_URL", SITE["base_url"]).rstrip("/")
BASE_URL = urlparse(SITE["base_url"])
if BASE_URL.scheme not in {"https", "http"} or not BASE_URL.netloc or BASE_URL.query or BASE_URL.fragment:
    raise ValueError("SITE_BASE_URL must be an absolute HTTP(S) URL without a query or fragment")
BASE_PATH = BASE_URL.path

PAGES = {
    "index": {
        "route": "/",
        "title": "LetterMilo — Little reading adventures for iPad",
        "description": "Practise English letter sounds, words, and short sentences with Milo on iPad.",
    },
    "privacy": {
        "route": "/privacy/",
        "title": "Privacy Policy — LetterMilo",
        "description": "How LetterMilo handles learning progress, speech, diagnostics, analytics, sharing, and support messages.",
    },
    "terms": {
        "route": "/terms/",
        "title": "Terms of Use — LetterMilo",
        "description": "Terms governing the LetterMilo app and website.",
    },
    "support": {
        "route": "/support/",
        "title": "Support — LetterMilo",
        "description": "Help with LetterMilo, including sound, speech practice, progress, sharing, and privacy.",
    },
    "404": {
        "route": "/404.html",
        "title": "Page not found — LetterMilo",
        "description": "This LetterMilo page could not be found.",
        "robots": "noindex",
    },
}


def asset_url(filename: str) -> str:
    version = hashlib.sha256((ROOT / "static" / filename).read_bytes()).hexdigest()[:12]
    return f"/assets/{filename}?v={version}"


def logo() -> str:
    return f"""<a class="brand" href="/" aria-label="LetterMilo home">
        <img class="brand-mark" src="{asset_url('logo.png')}" width="38" height="38" alt="">
        <span>LetterMilo</span>
      </a>"""


def page_html(key: str, body: str) -> str:
    page = PAGES[key]
    body = body.replace("{{last_updated}}", html.escape(SITE["last_updated"]))
    body = body.replace("/assets/logo.png", asset_url("logo.png"))
    canonical = SITE["base_url"] + page["route"]
    robots = page.get("robots", "index, follow")
    structured = {
        "@context": "https://schema.org",
        "@type": "WebSite" if key == "index" else "WebPage",
        "name": page["title"],
        "url": canonical,
        "description": page["description"],
        "publisher": {
            "@type": "Organization",
            "name": SITE["publisher"],
            "legalName": SITE["publisher"],
            "email": SITE["support_email"],
        },
    }
    nav = """<nav aria-label="Main navigation">
        <a href="/#how-it-works">How it works</a>
        <a href="/support/">Support</a>
        <a href="/privacy/">Privacy</a>
      </nav>"""
    document = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(page['title'])}</title>
  <meta name="description" content="{html.escape(page['description'])}">
  <meta name="author" content="{SITE['publisher']}">
  <meta name="robots" content="{robots}">
  <meta name="theme-color" content="#f8f7ec">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" href="{asset_url('favicon.svg')}" type="image/svg+xml">
  <link rel="icon" href="{asset_url('favicon-32.png')}" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="{asset_url('apple-touch-icon.png')}" sizes="180x180">
  <link rel="stylesheet" href="{asset_url('site.css')}">
  <meta property="og:site_name" content="LetterMilo">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{html.escape(page['title'])}">
  <meta property="og:description" content="{html.escape(page['description'])}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{SITE['base_url']}/assets/milo.png">
  <meta property="og:locale" content="{SITE['locale']}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">{json.dumps(structured, ensure_ascii=False)}</script>
</head>
<body class="page-{key}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="shell header-inner">{logo()}{nav}</div></header>
  <main id="main">{body}</main>
  <footer class="site-footer"><div class="shell footer-inner">
    <div>{logo()}<p>A small reading companion for iPad.</p></div>
    <div class="footer-links" aria-label="Footer links">
      <a href="/support/">Support</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a>
      <a href="mailto:{SITE['support_email']}">Email support</a>
    </div>
    <div class="legal-line">
      <p>©{SITE['copyright_year']} {SITE['publisher']}. All rights reserved.</p>
      <p>Milo, the LetterMilo character, and its artwork are owned by {SITE['publisher']}.</p>
    </div>
  </div></footer>
</body>
</html>
"""
    return re.sub(
        r'\b(href|src)="(/(?!/)[^"]*)"',
        lambda match: f'{match[1]}="{BASE_PATH}{match[2]}"',
        document,
    )


def output_path(route: str) -> Path:
    if route == "/":
        return DIST / "index.html"
    if route == "/404.html":
        return DIST / "404.html"
    return DIST / route.strip("/") / "index.html"


def build() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "static", DIST / "assets")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    for key, page in PAGES.items():
        body = (SOURCE / f"{key}.html").read_text(encoding="utf-8")
        destination = output_path(page["route"])
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(page_html(key, body), encoding="utf-8")

    routes = [page["route"] for key, page in PAGES.items() if key != "404"]
    urls = "\n".join(
        f"  <url><loc>{SITE['base_url']}{route}</loc></url>" for route in routes
    )
    (DIST / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8",
    )
    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {SITE['base_url']}/sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"Built {len(PAGES)} pages in {DIST}")


if __name__ == "__main__":
    build()
