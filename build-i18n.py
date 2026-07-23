#!/usr/bin/env python3
"""Pre-render language pages for redbrickhouse.gg.

Source of truth:
  - index.html : Korean root page (structure + ko copy)
  - i18n.js    : per-language dictionaries (en / ko / zh)

Output:
  - en/index.html , zh/index.html : fully pre-rendered so search engines index
    each language separately. The Korean page stays at the root.

Run after editing index.html or i18n.js:
    python3 build-i18n.py
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://redbrickhouse.gg"

# language key -> (output subdir, <html lang>, og:locale)
TARGETS = {
    "en": ("en", "en", "en_US"),
    "zh": ("zh", "zh-Hans", "zh_CN"),
}
# language key -> canonical path
PATHS = {"ko": "/", "en": "/en/", "zh": "/zh/"}

SKIP_URL_PREFIXES = ("http://", "https://", "//", "/", "#", "mailto:", "tel:", "data:")


def load_translations():
    """Extract the `translations` object from i18n.js via Node."""
    js = (
        "const fs=require('fs');"
        "const s=fs.readFileSync('i18n.js','utf8');"
        "const cut=s.slice(0,s.indexOf('function setLang'))"
        ".replace('const translations','globalThis.translations');"
        "eval(cut);"
        "process.stdout.write(JSON.stringify(globalThis.translations));"
    )
    out = subprocess.run(
        ["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True
    )
    return json.loads(out.stdout)


def absolutize(soup):
    """Rewrite root-relative asset paths so pages in /en/ and /zh/ still resolve."""
    for attr in ("src", "href", "poster"):
        for el in soup.find_all(attrs={attr: True}):
            val = el[attr]
            if not val or val.startswith(SKIP_URL_PREFIXES):
                continue
            el[attr] = "/" + val


def set_meta(soup, name=None, prop=None, value=""):
    if name:
        tag = soup.find("meta", attrs={"name": name})
    else:
        tag = soup.find("meta", attrs={"property": prop})
    if tag:
        tag["content"] = value


def build_lang(html, tr, lang):
    from bs4 import BeautifulSoup

    subdir, html_lang, og_locale = TARGETS[lang]
    d = tr[lang]
    soup = BeautifulSoup(html, "html.parser")

    # <html lang>
    soup.find("html")["lang"] = html_lang

    # Fill translated content (innerHTML, keeping inline tags like <br>).
    missing = []
    for el in soup.select("[data-i18n]"):
        key = el["data-i18n"]
        val = d.get(key)
        if val is None:
            missing.append(key)
            continue
        el.clear()
        frag = BeautifulSoup(val, "html.parser")
        for node in list(frag.contents):
            el.append(node)
    for el in soup.select("[data-i18n-ph]"):
        val = d.get(el["data-i18n-ph"])
        if val is not None:
            el["placeholder"] = val

    # Title + meta.
    title = d.get("docTitle", "")
    desc = d.get("metaDesc", "")
    if soup.title:
        soup.title.string = title
    set_meta(soup, name="description", value=desc)
    set_meta(soup, prop="og:title", value=title)
    set_meta(soup, prop="og:description", value=desc)
    set_meta(soup, prop="og:locale", value=og_locale)
    set_meta(soup, name="twitter:title", value=title)
    set_meta(soup, name="twitter:description", value=desc)

    # Canonical + og:url -> language URL.
    page_url = BASE_URL + PATHS[lang]
    canon = soup.find("link", attrs={"rel": "canonical"})
    if canon:
        canon["href"] = page_url
    set_meta(soup, prop="og:url", value=page_url)

    # Active language button.
    for btn in soup.select(".lang-btn"):
        if btn.get("data-lang") == lang:
            btn["class"] = list(dict.fromkeys(list(btn.get("class", [])) + ["active"]))
        else:
            btn["class"] = [c for c in btn.get("class", []) if c != "active"]

    absolutize(soup)

    out_dir = os.path.join(ROOT, subdir)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(str(soup))
    return out_path, missing


def main():
    tr = load_translations()
    with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as f:
        html = f.read()

    for lang in TARGETS:
        out_path, missing = build_lang(html, tr, lang)
        rel = os.path.relpath(out_path, ROOT)
        if missing:
            print(f"[{lang}] WARN missing keys: {', '.join(sorted(set(missing)))}")
        print(f"[{lang}] wrote {rel}")


if __name__ == "__main__":
    main()
