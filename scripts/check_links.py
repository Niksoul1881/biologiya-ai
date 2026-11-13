"""Проверка внутренних ссылок в уроках: ссылка /раздел/slug/ должна вести на реальный файл
content/<раздел>/<slug>.md, а /раздел/ — на content/<раздел>/_index.md.

Раньше скрипт сверял только slug, и ссылка на правильный урок в неверном разделе
(например /obshchaya-biologiya/184-.../ вместо /bio-it/184-.../) проходила как валидная,
хотя на сайте это 404. Теперь раздел учитывается.

    python scripts/check_links.py              # все уроки
    python scripts/check_links.py 209 210      # только эти номера
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # консоль Windows иначе падает на кириллице

LINK = re.compile(r'\]\((/[^)\s#]*?)/?(?:#[^)\s]*)?\)')
only = {f"{int(a):03d}" for a in sys.argv[1:]} if len(sys.argv) > 1 else None

bad = checked = 0
for f in sorted(CONTENT.rglob("[0-9]*.md")):
    if only and not any(f.name.startswith(p) for p in only):
        continue
    for href in LINK.findall(f.read_text(encoding="utf-8")):
        parts = [p for p in href.split("/") if p]
        if not parts:
            continue
        checked += 1
        if len(parts) == 1:                       # /раздел/ или страница верхнего уровня
            sect = CONTENT / parts[0] / "_index.md"
            page = CONTENT / f"{parts[0]}.md"     # content/program.md и подобные
            target = sect if sect.exists() else page
            hint = f"/{parts[0]}/ (нет ни _index.md, ни {parts[0]}.md)"
        else:                                     # /раздел/slug/
            target = CONTENT / parts[0] / f"{parts[-1]}.md"
            hint = f"/{parts[0]}/{parts[-1]}/"
            if not target.exists():
                # подскажем, где этот slug лежит на самом деле
                alt = [p.parent.name for p in CONTENT.rglob(f"{parts[-1]}.md")]
                if alt:
                    hint += f" — урок есть, но в разделе {alt[0]}"
        if not target.exists():
            bad += 1
            print(f"  {f.relative_to(ROOT)}: {href}/ -> {hint}")

print(f"проверено ссылок: {checked}, битых: {bad}")
