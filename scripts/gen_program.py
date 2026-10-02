"""PROGRAM.md → data/program.yaml + заготовки уроков в content/.

Заготовка — страница с placeholders: true (noindex, не в sitemap, в программе помечена «скоро»).
Готовые уроки (файл без placeholders) не трогаются. Запуск из корня biologiya-ai:
    python scripts/gen_program.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TR = dict(zip("абвгдеёзийклмнопрстуфы", "abvgdeeziyklmnoprstufy"))
TR.update({"ж": "zh", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ь": "", "э": "e", "ю": "yu", "я": "ya"})

COURSES = [  # (номер курса в PROGRAM.md, папка, короткое название, подпись, цвет, эмодзи)
    (1, "organizmy", "Растения, грибы, бактерии", "5–7 класс: живые организмы, растения, грибы и бактерии", "#16A34A", "🌱"),
    (2, "zhivotnye", "Животные", "7–8 класс: от простейших до млекопитающих", "#CA8A04", "🦎"),
    (3, "chelovek", "Человек и его здоровье", "8–9 класс: анатомия, физиология, гигиена", "#DC2626", "❤️"),
    (4, "obshchaya-biologiya", "Общая биология", "10–11 класс: клетка, генетика, эволюция, экология", "#0F766E", "🧬"),
    (5, "ege", "ЕГЭ по биологии", "Все 28 заданий с разборами", "#7C3AED", "🎯"),
    (6, "oge", "ОГЭ по биологии", "Все 26 заданий с разборами", "#2563EB", "📝"),
    (7, "bio-it", "Биология для программиста", "ДНК, белки и гены языком IT", "#0891B2", "💻"),
    (8, "biostatistika", "Математика и статистика для биологии", "Вероятности, тесты, модели", "#4F46E5", "📊"),
    (9, "python-bio", "Python для биологов", "От строк ДНК до Biopython и pandas", "#0D9488", "🐍"),
    (10, "algoritmy", "Алгоритмы биоинформатики", "Выравнивание, сборка генома, филогенетика", "#9333EA", "🧩"),
    (11, "genomika", "Геномика и транскриптомика", "Секвенирование, GWAS, RNA-seq, single-cell", "#C026D3", "🔬"),
    (12, "ml-bio", "ML в биологии", "AlphaFold, белковые модели, поиск лекарств", "#E11D48", "🤖"),
    (13, "sinbio", "Синтетическая биология", "CRISPR, клетки-фабрики, профессии будущего", "#65A30D", "⚗️"),
]


def slug(text):
    t = text.lower().replace("—", " ").replace("–", " ")
    t = "".join(TR.get(c, c) for c in t)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    words = t.split("-")
    out = ""
    for w in words:                      # не длиннее ~60 символов, по словам
        if len(out) + len(w) + 1 > 60:
            break
        out = f"{out}-{w}" if out else w
    return out


def parse():
    text = (ROOT / "PROGRAM.md").read_text(encoding="utf-8")
    courses, cur, sec = {}, None, None
    for line in text.splitlines():
        m = re.match(r"^## Курс (\d+)\.", line)
        if m:
            cur = int(m.group(1)); courses[cur] = []; sec = None
            continue
        if line.startswith("## "):
            cur = None
            continue
        if cur is None:
            continue
        m = re.match(r"^\*\*Раздел [\d.]+\. (.+)\*\*$", line)
        if m:
            sec = {"title": m.group(1), "lessons": []}; courses[cur].append(sec)
            continue
        m = re.match(r"^(\d+)\. (.+)$", line)
        if m:
            if sec is None:
                sec = {"title": "", "lessons": []}; courses[cur].append(sec)
            sec["lessons"].append((int(m.group(1)), m.group(2).strip()))
    return courses


EGE = ["Биология как наука: термины", "Результаты эксперимента", "Расчётная задача", "Генетика: задача в одно действие",
       "Клетка и организм: работа с рисунком", "Клетка и организм: соответствие", "Клетка и организм: выбор трёх ответов",
       "Клетка и организм: последовательность", "Многообразие организмов: работа с рисунком",
       "Многообразие организмов: соответствие", "Многообразие организмов: выбор трёх ответов",
       "Систематика: последовательность таксонов", "Человек: работа с рисунком", "Человек: соответствие",
       "Человек: выбор трёх ответов", "Человек: последовательность", "Эволюция: работа с текстом",
       "Экология: выбор трёх ответов", "Эволюция и экология: соответствие",
       "Общебиологические закономерности: работа с таблицей", "Анализ данных: выбор верных утверждений",
       "Методология эксперимента", "Выводы из эксперимента", "Задание с иллюстрацией",
       "Многообразие организмов и человек: развёрнутый ответ", "Общебиологические закономерности: развёрнутый ответ",
       "Задача по цитологии", "Задача по генетике"]


def exam_lessons(first, count, kind):
    if kind == "ege":
        return [{"title": "Часть 1: краткий ответ", "lessons": [(first + i, f"Задание {i + 1}: {EGE[i]}") for i in range(21)]},
                {"title": "Часть 2: развёрнутый ответ", "lessons": [(first + i, f"Задание {i + 1}: {EGE[i]}") for i in range(21, 28)]}]
    oge = {26: "задача на питание и энергозатраты"}
    t = lambda i: f"Задание {i}" + (f": {oge[i]}" if i in oge else "")
    return [{"title": "Часть 1: краткий ответ", "lessons": [(first + i - 1, t(i)) for i in range(1, 22)]},
            {"title": "Часть 2: развёрнутый ответ", "lessons": [(first + i - 1, t(i)) for i in range(22, 27)]}]


def main():
    parsed = parse()
    parsed[5] = exam_lessons(113, 28, "ege")
    parsed[6] = exam_lessons(141, 26, "oge")
    yaml = ["# Сгенерировано scripts/gen_program.py из PROGRAM.md — правь PROGRAM.md и перезапускай", "courses:"]
    made = 0
    for num, d, title, sub, color, emoji in COURSES:
        secs = parsed[num]
        n = sum(len(s["lessons"]) for s in secs)
        yaml += [f"  - id: {d}", f'    title: "{title}"', f'    subtitle: "{sub}"', f'    color: "{color}"',
                 f'    emoji: "{emoji}"', f"    count: {n}", "    sections:"]
        (ROOT / "content" / d).mkdir(parents=True, exist_ok=True)
        idx = ROOT / "content" / d / "_index.md"
        if not idx.exists():
            idx.write_text(f'---\ntitle: "{title}"\ndescription: "{sub}"\nweight: {num}\n---\n', encoding="utf-8")
        flat = [l for s in secs for l in s["lessons"]]
        for s in secs:
            yaml += [f'      - title: "{s["title"]}"', "        lessons:"]
            for no, t in s["lessons"]:
                if d in ("ege", "oge"):
                    sl = f"zadanie-{no - (113 if d == 'ege' else 141) + 1}"
                else:
                    sl = f"{no:03d}-{slug(t)}"
                existing = list((ROOT / "content" / d).glob(f"{no:03d}-*.md")) if d not in ("ege", "oge") else []
                if existing:
                    sl = existing[0].stem
                yaml.append(f'          - {{ num: {no}, slug: "{sl}", title: "{t}" }}')
                f = ROOT / "content" / d / f"{sl}.md"
                if f.exists():
                    continue
                i = flat.index((no, t))
                prev_ = flat[i - 1][1] if i > 0 else ""
                f.write_text(f"""---
title: "{t}"
date: 2026-10-02
lastmod: 2026-10-02
lesson_number: {no}
placeholders: true
weight: {no}
---

{{{{< kratko >}}}}
**Урок готовится.** Здесь будет большой урок по теме «{t}»: объяснение со схемами и рисунками, история открытия, таблицы, 30 заданий в формате ОГЭ и ЕГЭ с решениями и блок «Биология будущего» — где эта тема работает в биотехнологиях, медицине и биоинформатике.
{{{{< /kratko >}}}}

Пока урок пишется, посмотри [всю программу курса](/program/) — уже готовые уроки отмечены в ней.
""", encoding="utf-8")
                made += 1
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "program.yaml").write_text("\n".join(yaml) + "\n", encoding="utf-8")
    print("заготовок создано:", made)


if __name__ == "__main__":
    main()
