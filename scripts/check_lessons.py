"""Проверка всех написанных уроков: не заготовка, объём, картинки на месте, 30 решений, «Биология будущего»."""
import pathlib
import re

bad = n = 0
for f in sorted(pathlib.Path("content").rglob("[0-9]*.md")):
    s = f.read_text(encoding="utf-8")
    head, _, body = s[3:].partition("\n---")
    if "placeholders: true" in head:
        continue
    n += 1
    figs = re.findall(r'src="(/images/[^"]+)"', s)
    issues = []
    words = len(re.sub(r"\{\{<[^>]*>\}\}", "", body).split())
    if words < 3500: issues.append(f"слов {words}")
    if len(figs) < 4: issues.append(f"картинок {len(figs)}")
    miss = [x for x in figs if not pathlib.Path("static" + x).exists()]
    if miss: issues.append(f"нет файлов {miss}")
    if s.count("{{< solution >}}") != 30: issues.append(f"решений {s.count('{{< solution >}}')}")
    if "Биология будущего" not in s: issues.append("нет «Биология будущего»")
    if any(ord(c) < 32 and c not in "\n\r\t" for c in s): issues.append("управляющие символы")
    if issues:
        bad += 1
        print(f"  {f}: {', '.join(issues)}")
print(f"уроков готово: {n}, с замечаниями: {bad}")
