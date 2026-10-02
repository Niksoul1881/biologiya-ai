"""Картинки для уроков с Wikimedia Commons.

    python scripts/commons.py search "mitochondrion diagram" [--n 12]
        → кандидаты: имя файла, размер, лицензия, автор (только свободные лицензии)
    python scripts/commons.py get 088 mitochondrion "File:Animal mitochondrion diagram en.svg"
        → static/images/lessons/088/mitochondrion.webp (≤1200 px) и строка credit для шорткода figure

Берёт только Public Domain, CC0, CC BY, CC BY-SA. Credit собирается из метаданных Commons.
"""
import html
import io
import json
import pathlib
import re
import sys
import time

import requests
from PIL import Image

API = "https://commons.wikimedia.org/w/api.php"
H = {"User-Agent": "BiologiyaAI/0.1 (educational site; contact via site)"}
OK = re.compile(r"^(public domain|pd|cc0|cc[ -]by(-sa)?[ -]?\d)", re.I)
ROOT = pathlib.Path(__file__).resolve().parent.parent
CREDITS = ROOT / "data" / "image_credits.json"


def api(params):
    """Запрос к API Commons с повтором при ограничении частоты."""
    for attempt in range(6):
        r = requests.get(API, params=params, headers=H, timeout=30)
        if r.ok and r.text.lstrip().startswith("{"):
            return r.json()
        time.sleep(5 * (attempt + 1))
    sys.exit(f"Commons не отвечает: {r.status_code}")


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def info(titles, width=None):
    p = {"action": "query", "titles": "|".join(titles), "prop": "imageinfo", "format": "json",
         "iiprop": "url|size|extmetadata|mime"}
    if width:
        p["iiurlwidth"] = width
    pages = api(p)["query"]["pages"]
    return [pg for pg in pages.values() if "imageinfo" in pg]


def meta(pg):
    ii = pg["imageinfo"][0]
    em = ii.get("extmetadata", {})
    lic = clean(em.get("LicenseShortName", {}).get("value"))
    author = clean(em.get("Artist", {}).get("value")) or "автор не указан"
    return ii, lic, author[:80]


def search(q, n=12):
    r = api({"action": "query", "list": "search", "srsearch": q, "srnamespace": 6,
             "srlimit": n * 2, "format": "json"})
    titles = [x["title"] for x in r["query"]["search"]
              if not x["title"].lower().endswith((".pdf", ".djvu", ".tif", ".tiff", ".ogv", ".webm", ".ogg"))]
    shown = 0
    for pg in info(titles[:40]):
        ii, lic, author = meta(pg)
        if not OK.match(lic):
            continue
        print(f"{pg['title']}\n    {ii['width']}x{ii['height']} | {lic} | {author}")
        shown += 1
        if shown >= n:
            break


def get(lesson, name, title):
    pg = info([title], width=1200)[0]
    ii, lic, author = meta(pg)
    if not OK.match(lic):
        sys.exit(f"лицензия не подходит: {lic}")
    url = ii.get("thumburl") or ii["url"]
    for attempt in range(4):
        r = requests.get(url, headers=H, timeout=60)
        if r.ok and r.headers.get("content-type", "").startswith("image"):
            break
        time.sleep(3 + attempt * 4)
    else:
        sys.exit(f"не скачалось: {r.status_code}")
    im = Image.open(io.BytesIO(r.content))
    if im.mode in ("P", "LA", "RGBA"):
        bg = Image.new("RGB", im.size, "white")
        im = im.convert("RGBA")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > 1200:
        im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
    out = ROOT / "static" / "images" / "lessons" / lesson / f"{name}.webp"
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=82, method=6)
    page = "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_")
    credit = f"{author}, [Wikimedia Commons]({page}), {lic}"
    data = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    data[f"/images/lessons/{lesson}/{name}.webp"] = {"source": page, "author": author, "license": lic}
    CREDITS.parent.mkdir(parents=True, exist_ok=True)
    CREDITS.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{out.relative_to(ROOT)}  {im.width}x{im.height}  {out.stat().st_size // 1024} КБ")
    print(f'credit="{credit}"')


if __name__ == "__main__":
    if sys.argv[1] == "search":
        n = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 12
        search(sys.argv[2], n)
    elif sys.argv[1] == "get":
        get(sys.argv[2], sys.argv[3], sys.argv[4])
