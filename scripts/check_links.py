"""Проверка внутренних ссылок в уроках: каждая ссылка вида [текст](/раздел/slug/) должна
указывать на существующий файл content/<раздел>/<slug>.md (или на служебную страницу).

    python scripts/check_links.py                 # все уроки
    python scripts/check_links.py 209 210         # только уроки с этими номерами
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

# служебные страницы, у которых нет своего файла-урока
SERVICE = {"", "program", "courses", "oge", "ege", "instrumenty", "glossary", "reshit", "blog"}

exists = {p.stem for p in CONTENT.rglob("*.md")}
exists |= {p.parent.name for p in CONTENT.rglob("_index.md")}

LINK = re.compile(r'\]\((/[^)\s#]*?)/?(?:#[^)\s]*)?\)')

only = {f"{n:03d}" for n in (int(a) for a in sys.argv[1:])} if len(sys.argv) > 1 else None
bad = checked = 0

for f in sorted(CONTENT.rglob("[0-9]*.md")):
    if only and not any(f.name.startswith(p) for p in only):
        continue
    text = f.read_text(encoding="utf-8")
    for href in LINK.findall(text):
        slug = href.rstrip("/").split("/")[-1]
        if slug in SERVICE or not slug:
            continue
        checked += 1
        if slug not in exists:
            bad += 1
            print(f"  {f.relative_to(ROOT)}: битая ссылка {href}/")

print(f"проверено ссылок: {checked}, битых: {bad}")
