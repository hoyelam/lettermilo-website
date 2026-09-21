#!/usr/bin/env python3
"""Structural checks for generated LetterMilo pages and same-host links."""

from __future__ import annotations

import sys
import json
import os
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
BASE_URL = os.environ.get("SITE_BASE_URL", json.loads((ROOT / "site.json").read_text())["base_url"]).rstrip("/")
SITE_URL = urlparse(BASE_URL)
BASE_PATH = SITE_URL.path


class Document(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.title = ""
        self._in_title = False
        self.description = False
        self.canonical = ""
        self.h1 = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(values["href"] or "")
        if tag in {"img", "link", "script"}:
            source = values.get("src") or values.get("href")
            if source:
                self.links.append(source)
        if tag == "meta" and values.get("property") == "og:image" and values.get("content"):
            self.links.append(values["content"])
        if tag == "h1":
            self.h1 += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta" and values.get("name") == "description" and values.get("content"):
            self.description = True
        if tag == "link" and values.get("rel") == "canonical" and values.get("href"):
            self.canonical = values["href"]

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def target_for(link: str) -> Path | None:
    parsed = urlparse(link)
    if link.startswith(("mailto:", "tel:", "#")):
        return None
    if parsed.netloc and (parsed.scheme, parsed.netloc) != (SITE_URL.scheme, SITE_URL.netloc):
        return None
    clean = parsed.path
    if not clean:
        return None
    if BASE_PATH:
        if clean == BASE_PATH:
            clean = "/"
        elif clean.startswith(BASE_PATH + "/"):
            clean = clean[len(BASE_PATH):]
        else:
            raise ValueError(f"Local URL escapes the site's {BASE_PATH}/ prefix: {link}")
    if clean == "/":
        return DIST / "index.html"
    path = DIST / clean.lstrip("/")
    if clean.endswith("/"):
        path = path / "index.html"
    return path


def main() -> int:
    errors: list[str] = []
    pages = sorted(DIST.rglob("*.html"))
    expected = {"index.html", "privacy/index.html", "terms/index.html", "support/index.html", "404.html"}
    actual = {str(page.relative_to(DIST)) for page in pages}
    if actual != expected:
        errors.append(f"HTML routes differ: expected {sorted(expected)}, got {sorted(actual)}")
    for page in pages:
        parser = Document()
        parser.feed(page.read_text(encoding="utf-8"))
        relative = page.relative_to(DIST)
        if not parser.title.strip() or not parser.description or not parser.canonical or parser.h1 != 1:
            errors.append(f"{relative}: expected title, description, canonical, and exactly one h1")
        route = "/" if str(relative) == "index.html" else "/404.html" if str(relative) == "404.html" else f"/{relative.parent}/"
        if parser.canonical != BASE_URL + route:
            errors.append(f"{relative}: incorrect canonical URL {parser.canonical}")
        for link in parser.links:
            try:
                target = target_for(link)
            except ValueError as error:
                errors.append(f"{relative}: {error}")
                continue
            if target is not None and not target.exists():
                errors.append(f"{relative}: broken local target {link} -> {target.relative_to(DIST)}")
    for required in (DIST / ".nojekyll", DIST / "robots.txt", DIST / "sitemap.xml", DIST / "assets" / "site.css", DIST / "assets" / "favicon.svg"):
        if not required.exists():
            errors.append(f"Missing {required.relative_to(DIST)}")
    demo_assets = ["word-demo.js"] + [f"demo/word-{word}.png" for word in ("mat", "map", "tap")]
    demo_assets += [f"demo/{clip}.m4a" for clip in ("picture-word", "retry-picture-word", "great-job", "word-mat", "word-map", "word-tap")]
    for asset in demo_assets:
        if not (DIST / "assets" / asset).is_file():
            errors.append(f"Missing word-game asset: {asset}")
    if (DIST / "sitemap.xml").exists():
        locations = {node.text for node in ET.parse(DIST / "sitemap.xml").iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
        if locations != {BASE_URL + route for route in ["/", "/privacy/", "/terms/", "/support/"]}:
            errors.append("Sitemap URLs do not match the configured site address")
    if (DIST / "robots.txt").exists() and f"Sitemap: {BASE_URL}/sitemap.xml" not in (DIST / "robots.txt").read_text():
        errors.append("robots.txt points to the wrong sitemap")
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"Checked {len(pages)} pages at {BASE_URL}; metadata, sitemap, and local links pass.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
