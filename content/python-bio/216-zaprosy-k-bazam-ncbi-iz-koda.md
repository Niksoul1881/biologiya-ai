---
title: "Запросы к базам NCBI из кода"
seo_title: "NCBI из Python: E-utilities, Biopython Entrez и запросы к GenBank"
description: "Как из Python искать и скачивать данные NCBI: три запроса E-utilities, разбор JSON и XML, Biopython Entrez, правила вежливости и готовый сценарий «ген → последовательность RefSeq → FASTA»."
seo_description: "Запросы к NCBI из Python: E-utilities esearch, efetch и esummary, разбор JSON и XML, Biopython Entrez, лимиты 3 запроса в секунду и 30 заданий."
date: 2026-11-13
lastmod: 2026-11-13
grade: "IT"
category: "Биоинформатика"
emoji: "🌐"
level: "bio-it"
difficulty: 5.0
duration: 70
lesson_number: 216
weight: 216
keywords: ["NCBI", "E-utilities", "esearch", "efetch", "Biopython Entrez", "GenBank", "RefSeq", "requests Python", "API NCBI"]
prerequisites: ["215-vizualizaciya-matplotlib-i-seaborn"]
next_lesson: "217-rabota-s-vcf-varianty-genoma"
---

# Запросы к базам NCBI из кода 🌐

{{< kratko >}}
**NCBI** — это не один сайт, а сеть баз: **GenBank** (все присланные последовательности), **RefSeq** (эталонные), **PubMed** (статьи), **SRA** (сырые прочтения), **Taxonomy** (дерево организмов) и **BLAST** (поиск похожих).
Из кода с ними работают через **E-utilities** — три главных запроса:

- **esearch** — найти ID по запросу;
- **efetch** — скачать запись по ID;
- **esummary** — получить краткую сводку.

Параметры: `db` (база), `term` (запрос), `id` (запись), `retmode` (формат ответа), `rettype` (что вернуть). В Python — `requests` + `json`/`xml.etree.ElementTree` или `Bio.Entrez`, где **email обязателен**. Лимит — 3 запроса в секунду без ключа и 10 с ключом.
{{< /kratko >}}

Представь: тебе нужна последовательность гена BRCA1. Не картинка, не описание, а 7088 символов — чтобы найти праймер, проверить мутацию или посчитать GC-состав. Ты открываешь сайт NCBI, вводишь название гена, получаешь таблицу, щёлкаешь по ссылке, скачиваешь файл. Один раз — нормально. А если таких генов сто? А если завтра нужно повторить то же самое для десяти образцов?

Руками это превращается в вечер кликов и три ошибки копирования. Из кода — в цикл на двадцать строк, который можно запустить снова и получить тот же результат. Разница примерно как между переписыванием книги от руки и загрузкой файла.

NCBI — один из крупнейших в мире архивов биологических данных. В нём лежит всё: от последовательности бактериофага, прочитанной в 1977 году, до миллионов геномов SARS-CoV-2 и статей, в которых эти геномы обсуждают. И почти всё это доступно не только через браузер, но и через **HTTP-запросы** — то есть из твоего Python-скрипта.

В этом уроке разберёмся, какие базы есть в NCBI, как устроены три главных запроса, как разобрать ответ в JSON и XML, как работает Biopython и как скачать последовательность гена, не получив бан за наглость.

> **Проверено на практике.** Все ответы NCBI в этом уроке — настоящие: я выполнил запросы 13 ноября 2026 года на `requests 2.34.2` и `Biopython 1.88`. Числа, ID и последовательности взяты из ответов сервера. Если база обновится, счётчик `368` или версия `NM_007294.4` могут измениться — код от этого не сломается.

🎯 Ты узнаешь:
- какие базы живут в NCBI и какую задачу решает каждая;
- из чего состоит любой запрос к E-utilities: `db`, `term`, `id`, `retmode`, `rettype`;
- как найти запись через `esearch`, скачать через `efetch` и посмотреть сводку через `esummary`;
- как разобрать ответ в Python: JSON в словарь, XML в дерево;
- как работает `Bio.Entrez` и почему без `Entrez.email` не обойтись;
- как собрать скрипт «название гена → последовательность RefSeq → FASTA-файл»;
- какие лимиты у NCBI и что бывает за их нарушение.

## История: как GenBank научился отвечать по HTTP 📜

В 1979 году американский физик Уолтер Гоад предложил собрать все известные последовательности нуклеиновых кислот в одну базу. Идея была простой и назревшей: к концу 1970-х секвенирование перестало быть экзотикой, и разные лаборатории начали публиковать тысячи коротких последовательностей, которые никто не сводил вместе. Гоад работал в Лос-Аламосской национальной лаборатории, и там же, при поддержке NIH, выросла база **GenBank**.

Первый выпуск, который сохранился в статистике NCBI, — Release 3 от декабря 1982 года: **606 последовательностей** и **680 338 оснований**. Сегодня столько оснований у небольшой бактерии. Данные тогда распространяли на магнитных лентах и по FTP: чтобы получить свежую версию, нужно было скачать архив целиком и разобрать его самому.

В 1988 году Конгресс США создал **NCBI** — National Center for Biotechnology Information, национальный центр биотехнологической информации при Национальной медицинской библиотеке. Через четыре года GenBank переехал в NCBI, и вокруг него начали собираться другие базы. В 1990 году вышла статья с алгоритмом **BLAST** — поиском похожих последовательностей, который до сих пор остаётся одним из самых используемых инструментов в биологии. В 1996 году открылся **PubMed**, в 2000-м появилась **RefSeq** — коллекция эталонных, курируемых записей, а в конце 2000-х — **SRA**, архив сырых прочтений секвенаторов.

Примерно в 2002 году NCBI открыл **E-utilities** — Entrez Programming Utilities. До этого человек работал с базой через браузер или FTP: вводил запрос, нажимал кнопку, получал страницу. E-utilities дали программе те же возможности: отправить запрос по HTTP, получить ответ в XML или JSON и разобрать его. С этого момента «сходить в GenBank» стало такой же операцией, как прочитать файл.

## Какие базы живут в NCBI

Когда биологи говорят «посмотри в NCBI», они почти никогда не имеют в виду одну базу. Внутри — несколько разных хранилищ, и у каждого своя логика.

| База | Что хранит | Пример записи | Зачем нужна |
|---|---|---|---|
| **GenBank** | все последовательности, которые прислали авторы | MN908947.3 — геном SARS-CoV-2 | найти запись, на которую ссылается статья |
| **RefSeq** | эталонные, курируемые последовательности | NM_007294.4 — мРНК BRCA1 | взять канонический транскрипт гена |
| **PubMed** | статьи и рефераты по биомедицине | PMID 20301425 — GeneReviews о BRCA1/BRCA2 | найти публикации о гене или болезни |
| **SRA** | сырые прочтения секвенаторов | SRR-номер запуска | пересчитать экспрессию или собрать геном |
| **Taxonomy** | дерево организмов и номера таксонов | taxid 9606 — человек | узнать вид по последовательности |
| **BLAST** | не база, а поисковая служба | результат выравнивания | найти гомолог или проверить сборку |

{{< figure src="/images/lessons/216/bazy-ncbi.svg"
    alt="Схема баз NCBI: GenBank, RefSeq, PubMed, SRA, Taxonomy и BLAST с типичными задачами для каждой"
    caption="Шесть сервисов NCBI и типичная задача для каждого. BLAST — это поисковая служба, остальные пять — базы данных."
    credit="Схема «Биология AI»" >}}

Разница между GenBank и RefSeq — как между архивом рукописей и полкой проверенных изданий. В GenBank лежит всё, что прислали: и хорошие сборки, и фрагменты, и записи с ошибками. RefSeq — это отобранные и приведённые к единому виду последовательности: для большинства генов человека есть эталонная мРНК и эталонный белок. Если тебе нужна последовательность «вот этого гена», обычно берут RefSeq. Если нужна именно та запись, которую упомянули в статье, — GenBank.

> **Определение:** **accession** (номер доступа) — уникальный идентификатор записи в базе, например `NM_007294.4`. Точка и число в конце — версия: `NM_007294.3` и `NM_007294.4` — одна и та же запись до и после обновления. Ссылаться в статье или скрипте лучше на версию: без неё результат может измениться.

Есть ещё десятки баз: GEO с данными микрочипов, ClinVar с клиническими вариантами, Protein с аминокислотными последовательностями, Assembly со сборками геномов. Принцип один: у каждой базы есть короткое имя, которое подставляется в параметр `db`.

Почему это важно? Потому что один и тот же ген живёт сразу в нескольких местах: последовательность — в GenBank и RefSeq, статья о нём — в PubMed, сырые данные эксперимента — в SRA, таксон — в Taxonomy. Запрос из кода умеет соединять эти миры: найти ID гена, получить его последовательность, проверить, в каких организмах он встречается, и подтянуть публикации. Об этом — дальше.

## E-utilities: три запроса, из которых состоит всё

У NCBI есть один адрес для программных запросов:

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
```

> **Определение:** **API** (application programming interface) — набор адресов и правил, по которым одна программа запрашивает данные у другой. E-utilities — публичный API NCBI: те же базы, что и на сайте, только ответ приходит не страницей, а XML, JSON или текстом.

Дальше добавляется имя функции. Нас интересуют три:

| Запрос | Что делает | Что возвращает |
|---|---|---|
| `esearch.fcgi` | ищет записи по запросу | количество совпадений и список ID |
| `efetch.fcgi` | скачивает запись по ID | саму запись: FASTA, GenBank, abstract |
| `esummary.fcgi` | даёт краткую сводку по ID | название, accession, длину, дату обновления |

Логика работы с NCBI почти всегда одна и та же: **esearch → ID → esummary или efetch**. Сначала ты узнаёшь, какие записи вообще есть, потом решаешь, какую из них скачать.

{{< figure src="/images/lessons/216/esearch-efetch-fasta.svg"
    alt="Схема esearch → esummary → efetch → FASTA: от запроса BRCA1 до файла brca1.fasta"
    caption="Путь от названия гена до файла: esearch находит ID, esummary переводит ID в accession, efetch скачивает запись в FASTA."
    credit="Схема «Биология AI»" >}}

### esearch: найти ID по запросу

Самый простой запрос выглядит так:

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=BRCA1[gene]&retmax=3
```

Параметр `db=nucleotide` говорит: ищи в базе нуклеотидных последовательностей. `term=BRCA1[gene]` — ищи записи, у которых в поле «ген» стоит BRCA1. `retmax=3` — верни не больше трёх ID.

Квадратные скобки в `term` — это **теги полей**. Они превращают обычный текст в точный запрос:

- `BRCA1[gene]` — ген с именем BRCA1;
- `Homo sapiens[organism]` — только человек;
- `srcdb_refseq[prop]` — только записи из RefSeq;
- `mRNA[filter]` — только мРНК.

Без тегов поиск идёт по всем полям сразу и часто приносит мусор: упоминание BRCA1 в статье, белок, фрагмент. С тегами запрос становится предсказуемым.

Вот настоящий запрос, который я выполнил:

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=BRCA1%5Bgene%5D+AND+Homo+sapiens%5Borganism%5D+AND+srcdb_refseq%5Bprop%5D+AND+mRNA%5Bfilter%5D&retmode=json&retmax=3
```

`%5B` — это закодированная квадратная скобка `[`, а `+` — пробел. Вручную такие URL собирать не нужно: `requests` сделает кодирование сам, если передать параметры словарём.

Ответ в JSON (сократил, убрав служебные поля):

```json
{
  "header": {"type": "esearch", "version": "0.3"},
  "esearchresult": {
    "count": "368",
    "retmax": "3",
    "retstart": "0",
    "idlist": ["1732746264", "1677529721", "1677501432"],
    "querytranslation": "BRCA1[gene] AND \"Homo sapiens\"[Organism] AND srcdb_refseq[prop] AND mRNA[filter]"
  }
}
```

Что здесь важно:

- `count` — сколько всего записей подходит под запрос. Их **368**: у BRCA1 много транскриптов и вариантов.
- `idlist` — первые три ID, потому что `retmax=3`. Это внутренние числовые идентификаторы, а не accession.
- `querytranslation` — как NCBI понял твой запрос. Если тут ерунда, ищи ошибку в `term`: чаще всего забыт тег или кавычки.
- `count` приходит **строкой**, а элементы `idlist` — строки, даже когда выглядят числами.

> **Определение:** **UID** (unique identifier) — внутренний числовой ID записи в Entrez, например `1732746264`. **Accession** — человекочитаемый номер вроде `NM_007294.4`. `esearch` возвращает UID, `esummary` переводит UID в accession.

### efetch: скачать запись

`efetch` берёт ID или accession и отдаёт саму запись. Что именно отдать, решает `rettype`:

- `rettype=fasta` — последовательность в FASTA;
- `rettype=gb` — полная запись GenBank с аннотацией;
- `rettype=abstract` — реферат статьи для `db=pubmed`.

Для FASTA нужен ещё `retmode=text`: это текстовый формат, а не XML.

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=NM_007294.4&rettype=fasta&retmode=text
```

Ответ начинается так:

```
>NM_007294.4 Homo sapiens BRCA1 DNA repair associated (BRCA1), transcript variant 1, mRNA
GCTGAGACTTCCTGGACGGGGGACAGGCTGTGGGGTTTCTCAGATAACTGGGCCCCTGCGCTCAGGAGGC
CTTCACCCTCTGCTCTGGGTAAAGTTCATTGGAACAGAAAGAAATGGATTTATCTGCTCTTCGCGTTGAA
```

Первая строка — заголовок, начинается с `>`. Дальше — последовательность, разбитая на строки по 70 символов. Всего в записи **7088 нуклеотидов**.

`efetch` работает не только с последовательностями. Тот же запрос с `db=pubmed` и `rettype=abstract` возвращает реферат статьи по её PMID:

```python
r = requests.get(
    BASE + "efetch.fcgi",
    params={"db": "pubmed", "id": "20301425", "rettype": "abstract", "retmode": "text"},
    timeout=30,
)
print("\n".join(r.text.splitlines()[:3]))
```

```
1. BRCA1- and BRCA2-Associated Hereditary Breast and Ovarian Cancer.

Petrucelli N(1), Daly MB(2), Pal T(3).
```

Вот почему параметр `db` так важен: один и тот же `efetch` с разными базами достаёт то последовательность, то статью.

### esummary: краткая сводка

`esummary` не отдаёт последовательность — он даёт «карточку» записи: accession, название, длину, дату обновления, организм.

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nucleotide&id=1732746264&retmode=json
```

Для ID `1732746264` сводка содержит:

```
Caption:           NM_007294
AccessionVersion:  NM_007294.4
Title:             Homo sapiens BRCA1 DNA repair associated (BRCA1),
                   transcript variant 1, mRNA
Length:            7088
UpdateDate:        2026/09/10
```

Именно `esummary` превращает непонятный числовой ID в нормальный accession, по которому запись можно найти на сайте и в статье.

### Параметры, которые повторяются

У трёх запросов один и тот же набор имён. Запомнишь его — перестанешь подсматривать в документацию.

{{< figure src="/images/lessons/216/e-utilities-parametry.svg"
    alt="Таблица параметров E-utilities: db, term, id, retmode, rettype, retmax, email, api_key"
    caption="Восемь имён, которые встречаются в запросах к E-utilities. Набор одинаковый у esearch, efetch и esummary, но нужны они в разных сочетаниях."
    credit="Схема «Биология AI»" >}}

Ключевая пара, на которой спотыкаются чаще всего, — `retmode` и `rettype`:

- **`retmode`** — в каком формате придёт **ответ**: `json` (у `esearch` и `esummary`), `xml` или `text`;
- **`rettype`** — какую **запись** ты просишь: `fasta`, `gb`, `abstract`.

Если перепутать, сервер не обязательно упадёт. Он может молча отдать не то, что ты ждёшь, — и ошибка вылезет позже, при разборе.

## Как это делать в Python: requests

Самый прямой путь — библиотека `requests`. Она уже стоит в окружении курса; проверь версию:

```powershell
.venv\Scripts\python.exe -c "import requests; print(requests.__version__)"
```

```
2.34.2
```

Если у тебя другая версия — не страшно, базовый синтаксис не меняется. Главное, что `requests` умеет передавать параметры словарём и сам кодирует спецсимволы.

### Один запрос — двадцать строк

```python
import requests

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
TERM = ("BRCA1[gene] AND Homo sapiens[organism] "
        "AND srcdb_refseq[prop] AND mRNA[filter]")

params = {
    "db": "nucleotide",
    "term": TERM,
    "retmode": "json",
    "retmax": 3,
}

r = requests.get(BASE + "esearch.fcgi", params=params, timeout=30)
r.raise_for_status()

res = r.json()["esearchresult"]
print("Найдено:", res["count"])
print("ID:", res["idlist"])
```

Вывод:

```
Найдено: 368
ID: ['1732746264', '1677529721', '1677501432']
```

Разберём, что произошло по шагам.

1. `BASE` — общий адрес E-utilities. Дальше приклеивается имя функции.
2. `params` — словарь параметров. `requests` превращает его в `?db=nucleotide&term=...`, кодируя пробелы и скобки.
3. `timeout=30` — страховка. Без таймаута запрос может висеть минутами, если сеть или сервер не отвечают.
4. `raise_for_status()` — проверка HTTP-кода. Если сервер ответил `400` или `500`, программа упадёт с понятной ошибкой, а не попытается разобрать пустоту.
5. `r.json()` — разбор JSON в словарь. Дальше `["esearchresult"]` достаёт нужный блок.

Посмотри на `r.url` — там видно, как `requests` закодировал запрос:

```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=BRCA1%5Bgene%5D+AND+Homo+sapiens%5Borganism%5D+AND+srcdb_refseq%5Bprop%5D+AND+mRNA%5Bfilter%5D&retmode=json&retmax=3
```

Собирать такую строку вручную через `f"..."` — плохая идея: однажды забудешь `quote()` и получишь битый запрос. Словарь `params` надёжнее.

### JSON: словарь из ответа

`r.json()` возвращает обычные Python-объекты: словари, списки, строки. Поэтому работают привычные обращения:

```python
res = r.json()["esearchresult"]

print(res["count"])
print(res["idlist"][0])
print(res["querytranslation"])
```

```
368
1732746264
BRCA1[gene] AND "Homo sapiens"[Organism] AND srcdb_refseq[prop] AND mRNA[filter]
```

Обрати внимание: `res["count"]` — строка `"368"`, а не число. Если захочешь сравнить её с числом или поделить, нужно `int(res["count"])`. Это частая причина странных ошибок: выражение `"368" > 100` в Python 3 вызовет `TypeError`, потому что строку и число сравнивать нельзя.

### XML: дерево элементов

Если не указывать `retmode`, `esearch` по умолчанию отвечает XML. Его разбирает стандартный модуль `xml.etree.ElementTree`:

```python
import xml.etree.ElementTree as ET
import requests

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
TERM = ("BRCA1[gene] AND Homo sapiens[organism] "
        "AND srcdb_refseq[prop] AND mRNA[filter]")
params = {"db": "nucleotide", "term": TERM, "retmax": 3}

r = requests.get(BASE + "esearch.fcgi", params=params, timeout=30)
root = ET.fromstring(r.text)

print(root.findtext("Count"))
print([e.text for e in root.findall("IdList/Id")])
```

```
368
['1732746264', '1677529721', '1677501432']
```

Ответ выглядит примерно так (сократил):

```xml
<eSearchResult>
  <Count>368</Count>
  <RetMax>3</RetMax>
  <IdList>
    <Id>1732746264</Id>
    <Id>1677529721</Id>
    <Id>1677501432</Id>
  </IdList>
  <QueryTranslation>BRCA1[gene] AND "Homo sapiens"[Organism] ...</QueryTranslation>
</eSearchResult>
```

`ET.fromstring` создаёт дерево. `findtext("Count")` возвращает текст первого элемента `Count`, `findall("IdList/Id")` — список всех `Id` внутри `IdList`. Путь через слэш читается как путь к папке.

{{< figure src="/images/lessons/216/json-ili-xml.svg"
    alt="Два способа разобрать ответ NCBI: JSON через r.json() и XML через ElementTree"
    caption="Один и тот же ответ esearch: JSON даёт готовый словарь, XML — дерево элементов. Формат выбирается параметром retmode."
    credit="Схема «Биология AI»" >}}

Что выбрать? JSON короче и удобнее, если тебе нужны только поля. XML полезен, когда нужен полный ответ с атрибутами или когда инструмент умеет работать только с ним. Для `esearch` оба варианта равноценны — главное, не путать их.

## Biopython: Bio.Entrez

`requests` даёт полный контроль, но заставляет вручную возиться с разбором. Biopython делает то же самое аккуратнее: у него есть модуль `Bio.Entrez`, который сам формирует запрос, проверяет ответ и разбирает XML в объекты Python.

Версия в окружении курса:

```powershell
.venv\Scripts\python.exe -c "import Bio; print(Bio.__version__)"
```

```
1.88
```

### Entrez.email — не формальность

Первое, что нужно сделать до любого запроса, — представиться:

```python
from Bio import Entrez

Entrez.email = "you@example.org"
Entrez.tool = "biologiya-ai-course"
```

`Entrez.email` — твой адрес. NCBI требует его по правилам: если скрипт начнёт мешать другим пользователям, администраторы должны знать, кому писать. `Entrez.tool` — имя программы, тоже полезно для разбора инцидентов.

Если забыть email, Biopython 1.88 не упадёт, а напечатает предупреждение:

```
UserWarning: Email address is not specified.
To make use of NCBI's E-utilities, NCBI requires you to specify your
email address with each request.
```

Предупреждение легко не заметить в выводе. А правило простое: **email указывают один раз в начале скрипта, до первого запроса**. Это не бюрократия, а условие доступа.

### esearch и read

```python
from Bio import Entrez

Entrez.email = "you@example.org"

handle = Entrez.esearch(
    db="nucleotide",
    term="BRCA1[gene] AND Homo sapiens[organism] AND srcdb_refseq[prop] AND mRNA[filter]",
    retmax=3,
)
result = Entrez.read(handle)
handle.close()

print(result["Count"])
print(result["IdList"])
```

```
368
['1732746264', '1677529721', '1677501432']
```

`Entrez.esearch` возвращает **handle** — открытый поток с ответом. `Entrez.read(handle)` разбирает его в словаре-подобный объект, а `handle.close()` освобождает соединение. Если забыть закрыть, при сотне запросов можно упереться в лимит открытых соединений.

То же самое короче, через контекстный менеджер:

```python
with Entrez.esearch(db="nucleotide", term=TERM, retmax=3) as handle:
    result = Entrez.read(handle)
```

`with` закроет handle сам, даже если внутри случится ошибка. Привыкай к этой форме — она безопаснее.

### esummary: сводка по ID

```python
with Entrez.esummary(db="nucleotide", id="1732746264") as handle:
    summary = Entrez.read(handle)

doc = summary[0]
print(doc["AccessionVersion"])
print(doc["Title"])
print(doc["Length"])
```

```
NM_007294.4
Homo sapiens BRCA1 DNA repair associated (BRCA1), transcript variant 1, mRNA
7088
```

`Entrez.read` возвращает список записей — даже если запись одна, бери `[0]`. Поля называются почти как в документации: `AccessionVersion`, `Title`, `Length`, `UpdateDate`. `Length` — число, но хранится в специальном объекте `IntegerElement`; для арифметики используй `int(doc["Length"])`.

### efetch и SeqIO

Для последовательности одного `Entrez.read` мало: FASTA — не XML. Здесь нужен `SeqIO`:

```python
from Bio import Entrez, SeqIO

Entrez.email = "you@example.org"

with Entrez.efetch(
    db="nucleotide", id="NM_007294.4", rettype="fasta", retmode="text"
) as handle:
    record = SeqIO.read(handle, "fasta")

print(record.id)
print(len(record.seq))
```

```
NM_007294.4
7088
```

`SeqIO.read` читает **ровно одну** запись. Если в ответе их несколько — а так бывает, когда передаёшь список ID, — нужен `SeqIO.parse`, который возвращает итератор:

```python
with Entrez.efetch(
    db="nucleotide", id="NM_007294.4,NM_007300.4", rettype="fasta", retmode="text"
) as handle:
    for record in SeqIO.parse(handle, "fasta"):
        print(record.id, len(record.seq))
```

```
NM_007294.4 7088
NM_007300.4 7151
```

Если попробовать `Entrez.read` на FASTA, Biopython 1.88 выдаст ошибку `StreamModeError: the XML file must be opened in binary mode.` Смысл простой: `Entrez.read` ждёт XML, а получил текст. Для FASTA — только `SeqIO`.

### API-ключ

Если запросов много, возьми бесплатный API-ключ в настройках аккаунта NCBI и передай его Biopython:

```python
Entrez.api_key = "твой_ключ_из_настроек_NCBI"
```

С ключом лимит вырастает с 3 до 10 запросов в секунду. Ключ — не пароль от аккаунта, но публиковать его в открытом репозитории не стоит: храни в переменной окружения.

### requests или Biopython

| | `requests` | `Bio.Entrez` |
|---|---|---|
| контроль над запросом | полный | базовый |
| разбор XML | вручную, `ElementTree` | автоматически, `Entrez.read` |
| FASTA | текст, потом `SeqIO` | сразу `SeqIO` |
| зависимости | только `requests` | весь Biopython |
| когда выбирать | нестандартные API, JSON, отладка | стандартные E-utilities, много XML |

На практике их часто совмещают: `requests` — для JSON-запросов и проверки статуса, `Bio.Entrez` — для пакетной работы с записями.

## Сценарий: по названию гена — последовательность в FASTA

Теперь соберём то, ради чего всё затевалось. Скрипт делает четыре шага: ищет RefSeq-мРНК гена, берёт первый ID, узнаёт accession и скачивает FASTA.

```python
import time
from Bio import Entrez, SeqIO

Entrez.email = "you@example.org"
Entrez.tool = "biologiya-ai"

TERM = "BRCA1[gene] AND Homo sapiens[organism] AND srcdb_refseq[prop] AND mRNA[filter]"

handle = Entrez.esearch(db="nucleotide", term=TERM, retmax=5)
result = Entrez.read(handle)
handle.close()

print("Найдено:", result["Count"])
print("ID:", result["IdList"][:3])

uid = result["IdList"][0]
time.sleep(0.4)

handle = Entrez.esummary(db="nucleotide", id=uid)
summary = Entrez.read(handle)
handle.close()

acc = summary[0]["AccessionVersion"]
print("Берём:", acc, "—", summary[0]["Title"])
time.sleep(0.4)

handle = Entrez.efetch(db="nucleotide", id=acc, rettype="fasta", retmode="text")
record = SeqIO.read(handle, "fasta")
handle.close()

with open("brca1.fasta", "w", encoding="utf-8") as f:
    SeqIO.write(record, f, "fasta")

print("Длина:", len(record.seq))
print("Первые 30:", record.seq[:30])
print("GC:", (record.seq.count("G") + record.seq.count("C")) / len(record.seq))
```

Реальный вывод:

```
Найдено: 368
ID: ['1732746264', '1677529721', '1677501432']
Берём: NM_007294.4 — Homo sapiens BRCA1 DNA repair associated (BRCA1), transcript variant 1, mRNA
Длина: 7088
Первые 30: GCTGAGACTTCCTGGACGGGGGACAGGCTG
GC: 0.4177483069977427
```

Файл `brca1.fasta` начинается так:

```
>NM_007294.4 Homo sapiens BRCA1 DNA repair associated (BRCA1), transcript variant 1, mRNA
GCTGAGACTTCCTGGACGGGGGACAGGCTGTGGGGTTTCTCAGATAACTGGGCCCCTGCG
CTCAGGAGGCCTTCACCCTCTGCTCTGGGTAAAGTTCATTGGAACAGAAAGAAATGGATT
```

`SeqIO.write` разбивает последовательность на строки по 60 символов, поэтому файл получается 120 строк и 7417 байт. Если открыть его в другом инструменте, формат останется валидным FASTA.

Несколько важных деталей:

- **Первый ID — не всегда лучший.** Скрипт берёт первый результат, потому что для примера этого хватает. В реальной работе проверяй `Title`: у BRCA1 368 записей RefSeq, и среди них разные транскрипты. Для клинической задачи обычно нужен MANE Select — основной транскрипт гена.
- **`retmax=5` — не «скачай пять».** Это «верни пять ID». Скачивает только `efetch`, и только то, что ты попросил.
- **`time.sleep(0.4)`** — пауза между запросами. Без неё скрипт формально может успеть больше трёх запросов в секунду и получить отпор.
- **GC-состав** считается по последовательности, а не по длине файла: заголовок и переводы строк в расчёт не входят.

Если тебе нужно то же самое для другого гена, достаточно поменять `BRCA1` в `TERM`. Именно так E-utilities превращают ручную работу в функцию.

## Правила вежливости: как не получить бан

NCBI — бесплатный сервис, который обслуживает весь мир. Поэтому у него есть правила, и они не рекомендательные.

{{< figure src="/images/lessons/216/pravila-vezhlivosti.svg"
    alt="Правила вежливости NCBI: 3 запроса в секунду без ключа, 10 с ключом, обязательный email, пауза и блокировка IP"
    caption="Лимиты и правила NCBI. Массовые запросы без ключа заканчиваются блокировкой IP, а не ускорением работы."
    credit="Схема «Биология AI»" >}}

**Лимит запросов.** Без API-ключа — не больше **3 запросов в секунду**. С ключом — **10 запросов в секунду**. Это именно запросы к серверу, а не строки в файле: один `efetch` с сотней ID — это один запрос.

**Email и tool.** В каждом запросе должны быть контакт и имя программы. В `requests` их добавляют в `params`:

```python
params = {
    "db": "nucleotide",
    "term": TERM,
    "retmode": "json",
    "email": "you@example.org",
    "tool": "biologiya-ai",
}
```

В Biopython достаточно один раз задать `Entrez.email` и `Entrez.tool`.

**Пауза между запросами.** Простейшая страховка — `time.sleep(0.4)` после каждого запроса. Это чуть меньше 3 запросов в секунду, с запасом на сетевые задержки. С ключом можно `time.sleep(0.1)`.

**Большие выборки — порциями.** Не надо пытаться выгрузить всю базу одним `efetch`. Правильный путь: `esearch` с `usehistory=y` возвращает `WebEnv` и `QueryKey`, а `efetch` забирает записи порциями через `retstart` и `retmax`. Для целых геномов E-utilities вообще не лучший инструмент — там есть FTP и NCBI Datasets.

**Что бывает за нарушения.** Сначала NCBI может ограничить скорость, потом — заблокировать IP. Разблокировка требует переписки, а письмо придёт на email из запроса. Если email не указан, искать виновника сложнее, и это ещё один повод его не забывать.

> **⚠️ Важно:** массовые запросы без ключа — плохая идея. Ты не «ускоришь» работу, а получишь `429` или блокировку IP на часы. Если задача пахнет тысячами запросов, сначала возьми ключ и разбей работу на порции.

## Ловушки: где код ломается

### Забыл Entrez.email

Biopython предупредит, но запрос всё равно уйдёт. Проблема в том, что предупреждение легко пропустить, а NCBI может ограничить доступ. Лечение: `Entrez.email = "..."` первой строкой после импорта.

### Перепутал retmode и rettype

`retmode` — формат ответа, `rettype` — тип записи. Если попросить `efetch` с `rettype=fasta` и `retmode=json`, сервер всё равно вернёт **текст FASTA**, а `r.json()` упадёт с `JSONDecodeError`. Проверяй, что формат соответствует тому, чем собираешься разбирать.

### Забыл timeout

`requests.get(...)` без `timeout` может висеть, пока соединение не оборвётся само. В цикле из сотни запросов это превращается в зависший скрипт. Ставь `timeout=30` и обрабатывай `requests.exceptions.Timeout`.

### Пустой IdList

Если запрос ничего не нашёл, `count` равен `"0"`, а `idlist` — пустой список. Код `result["IdList"][0]` в этот момент падает с `IndexError`. Проверяй `int(result["Count"]) > 0` до того, как лезть за первым элементом.

### Неверный accession

`efetch` с несуществующим ID отвечает `400 Bad Request`, а тело ответа — закодированная строка ошибки. Без `raise_for_status()` ты попытаешься разобрать её как FASTA и получишь загадочный результат. С `raise_for_status()` — понятный `HTTPError`.

### Entrez.read на FASTA

`Entrez.read` ждёт XML. На FASTA он выдаёт `StreamModeError`. Для последовательностей есть `SeqIO.read` и `SeqIO.parse` — не путай инструменты.

### Тысячи записей одним запросом

Слишком длинный URL упирается в ограничение сервера, а ответ — в таймаут. Один `efetch` на сотни ID может сработать, на тысячи — нет. Дроби на порции и используй историю запросов.

### Кодировка при записи

В ответе NCBI кириллицы нет, а вот в твоих подписях и названиях файлов — есть. `open(..., "w", encoding="utf-8")` избавит от сюрпризов на Windows, где консоль по умолчанию может быть в `cp1251`. Данные при этом не портятся — портится только вывод.

## Биология будущего: где это пригодится 🚀

**🧬 Данные растут быстрее, чем когда-либо.** В декабре 1982 года в GenBank было 606 последовательностей и 680 338 оснований. В октябре 2026 года, по статистике NCBI, — 269 895 537 последовательностей и 9 384 961 284 424 основания. Это почти 9,4 триллиона букв, и база удваивается примерно каждые 18 месяцев. Ни один человек не просмотрит это руками — только кодом.

**💊 Клиническая геномика.** Лаборатории проверяют варианты в генах вроде BRCA1 и сверяются с ClinVar — базой NCBI, где собраны интерпретации вариантов. Скрипт может по списку вариантов подтянуть данные из нескольких баз NCBI и собрать отчёт, который врач обсудит с пациентом.

**🦠 Надзор за патогенами.** Во время пандемии COVID-19 новые геномы SARS-CoV-2 загружали в GenBank и SRA тысячами. Программные запросы позволяют следить за появлением вариантов, не открывая браузер: скачать метаданные, отфильтровать по стране и дате, сравнить последовательности.

**🌿 Биоразнообразие и метабаркодинг.** Экологи секвенируют ДНК из почвы, воды и воздуха и сравнивают полученные фрагменты с GenBank и Taxonomy. Один скрипт может прогнать тысячи последовательностей через таксономическую проверку — так оценивают, какие виды живут в образце.

**📚 Тексты как данные.** PubMed отдаёт рефераты через `efetch` с `db=pubmed` и `rettype=abstract`. На этих текстах обучают модели, которые ищут связи «ген — болезнь — лекарство». E-utilities здесь — входная дверь к корпусу статей.

**🔁 Воспроизводимость.** В статье можно написать «последовательность взята из RefSeq» и оставить accession. Через год читатель запустит скрипт и получит ту же версию записи. Это простая, но мощная практика: данные должны быть воспроизводимы, а не «где-то скачаны».

**Профессии:** биоинформатик, специалист по геномным данным, разработчик клинических пайплайнов, аналитик в области инфекционных болезней, биолог-вычислитель.

## Практика: 30 заданий

### Базовые (задания 1–10)

**Задание 1.** В какой базе NCBI хранятся научные статьи и рефераты?

{{< solution >}}
**Решение:** статьи и рефераты — это PubMed. GenBank и RefSeq хранят последовательности, SRA — сырые прочтения, Taxonomy — классификацию.

**Ответ:** PubMed.
{{< /solution >}}

**Задание 2.** Где хранятся сырые прочтения секвенаторов?

{{< solution >}}
**Решение:** для сырых данных секвенирования NCBI создал Sequence Read Archive — SRA.

**Ответ:** SRA.
{{< /solution >}}

**Задание 3.** Что возвращает `esearch`: последовательности или идентификаторы?

{{< solution >}}
**Решение:** `esearch` только ищет. Он возвращает количество совпадений (`count`) и список ID (`idlist`). Сами последовательности скачивает `efetch`.

**Ответ:** идентификаторы и количество совпадений, без последовательностей.
{{< /solution >}}

**Задание 4.** Какой параметр задаёт базу данных в запросе E-utilities?

{{< solution >}}
**Решение:** база задаётся параметром `db`: `db=nucleotide`, `db=protein`, `db=pubmed` и так далее.

**Ответ:** `db`.
{{< /solution >}}

**Задание 5.** Какой `rettype` вернёт последовательность в формате FASTA?

{{< solution >}}
**Решение:** тип записи задаёт `rettype`. Для FASTA это `rettype=fasta`, а формат ответа — `retmode=text`.

**Ответ:** `rettype=fasta`.
{{< /solution >}}

**Задание 6.** Что означает запись `NM_007294.4`?

{{< solution >}}
**Решение:** `NM_` — префикс RefSeq для мРНК, `007294` — номер записи, `.4` — версия. Это accession, а не внутренний UID.

**Ответ:** accession мРНК BRCA1, версия 4.
{{< /solution >}}

**Задание 7.** Чем `efetch` отличается от `esearch`?

{{< solution >}}
**Решение:** `esearch` ищет и возвращает ID, `efetch` по ID скачивает саму запись — последовательность, GenBank-формат или реферат.

**Ответ:** `esearch` ищет, `efetch` скачивает запись.
{{< /solution >}}

**Задание 8.** Какой `retmode` нужен, чтобы получить ответ в JSON?

{{< solution >}}
**Решение:** формат ответа задаёт `retmode`. Значение `json` вернёт JSON; по умолчанию многие запросы отвечают XML.

**Ответ:** `retmode=json`.
{{< /solution >}}

**Задание 9.** Что означает taxid 9606?

{{< solution >}}
**Решение:** таксономический номер 9606 в NCBI Taxonomy закреплён за человеком — *Homo sapiens*.

**Ответ:** человек, *Homo sapiens*.
{{< /solution >}}

**Задание 10.** В какой базе искать эталонную, курируемую последовательность гена?

{{< solution >}}
**Решение:** эталонные последовательности собирает RefSeq. В GenBank лежит всё присланное, включая фрагменты и черновые записи.

**Ответ:** RefSeq.
{{< /solution >}}

### Средние (задания 11–20)

**Задание 11.** Что выведет программа?

```python
res = {"count": "368", "idlist": ["1732746264", "1677529721"]}
print(res["count"])
print(type(res["count"]).__name__)
```

{{< solution >}}
**Решение:** в JSON-ответе NCBI число приходит строкой. `print` выведет её без кавычек, а `type` покажет `str`.

**Ответ:** `368` и `str`.
{{< /solution >}}

**Задание 12.** Что вернёт `root.findtext("Count")` для XML-ответа esearch?

{{< solution >}}
**Решение:** `findtext` возвращает текст элемента — строку `"368"`, а не число. Для арифметики понадобится `int(...)`.

**Ответ:** строку `"368"`.
{{< /solution >}}

**Задание 13.** `esearch` выполнен с `retmax=3`, и найдено 368 записей. Чему равна длина `res["idlist"]`?

{{< solution >}}
**Решение:** `retmax=3` ограничивает число возвращаемых ID тремя, даже если всего совпадений 368.

**Ответ:** 3.
{{< /solution >}}

**Задание 14.** Какой запрос точнее найдёт мРНК BRCA1 человека в RefSeq?

```text
A. "BRCA1"
B. "BRCA1[gene] AND Homo sapiens[organism]"
C. "BRCA1[gene] AND Homo sapiens[organism] AND srcdb_refseq[prop] AND mRNA[filter]"
```

{{< solution >}}
**Решение:** вариант A ищет BRCA1 по всем полям и принесёт упоминания в статьях и белках. Вариант B ограничивает геном и организмом, но оставляет и геномную ДНК, и другие типы записей. Вариант C добавляет источник RefSeq и фильтр мРНК — это и есть нужная выборка.

**Ответ:** C.
{{< /solution >}}

**Задание 15.** Что произойдёт при запросе `efetch` с несуществующим accession, если вызвать `raise_for_status()`?

{{< solution >}}
**Решение:** сервер ответит `400 Bad Request`, а `raise_for_status()` превратит этот код в исключение `requests.exceptions.HTTPError`. Без проверки код попытался бы разобрать тело ошибки как данные.

**Ответ:** `HTTPError` с кодом 400.
{{< /solution >}}

**Задание 16.** Зачем в скрипт добавляют `time.sleep(0.4)` между запросами?

{{< solution >}}
**Решение:** NCBI разрешает не больше 3 запросов в секунду без ключа. Пауза 0,4 секунды держит темп около 2,5 запроса в секунду и не даёт превысить лимит.

**Ответ:** чтобы не превысить лимит и не получить блокировку.
{{< /solution >}}

**Задание 17.** Программа не задала `Entrez.email`. Что произойдёт?

{{< solution >}}
**Решение:** Biopython 1.88 напечатает `UserWarning` о том, что email не указан, но запрос может уйти. Формально NCBI требует email, поэтому такой код ненадёжен: при проблемах доступ могут ограничить.

**Ответ:** появится предупреждение; правило NCBI при этом нарушено.
{{< /solution >}}

**Задание 18.** Почему `Entrez.read` падает на ответе `efetch` с `rettype=fasta`?

{{< solution >}}
**Решение:** `Entrez.read` разбирает XML. FASTA — текстовый формат, поэтому возникает `StreamModeError: the XML file must be opened in binary mode.` Для FASTA нужен `SeqIO.read` или `SeqIO.parse`.

**Ответ:** `Entrez.read` не умеет FASTA, нужен `SeqIO`.
{{< /solution >}}

**Задание 19.** Сколько запросов в секунду разрешено с API-ключом?

{{< solution >}}
**Решение:** без ключа — 3 запроса в секунду, с ключом — 10. Ключ бесплатно выдаётся в настройках аккаунта NCBI.

**Ответ:** 10.
{{< /solution >}}

**Задание 20.** Как из числового ID `1732746264` получить accession `NM_007294.4`?

{{< solution >}}
**Решение:** вызвать `esummary` с этим ID и прочитать поле `AccessionVersion` (в JSON — `accessionversion`). В Biopython:

```python
with Entrez.esummary(db="nucleotide", id="1732746264") as h:
    doc = Entrez.read(h)[0]
print(doc["AccessionVersion"])
```

**Ответ:** через `esummary`, поле `AccessionVersion`.
{{< /solution >}}

### Продвинутые (задания 21–30)

**Задание 21.** Напиши функцию, которая делает `esearch` в базе `nucleotide` и возвращает словарь `esearchresult`.

{{< solution >}}
**Решение:** нужны параметры `db`, `term`, `retmode`, `retmax`, таймаут и проверка статуса. Функция возвращает блок `esearchresult`.

```python
import requests

BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"

def esearch(term, retmax=3):
    params = {
        "db": "nucleotide",
        "term": term,
        "retmode": "json",
        "retmax": retmax,
    }
    r = requests.get(BASE + "esearch.fcgi", params=params, timeout=30)
    r.raise_for_status()
    return r.json()["esearchresult"]

res = esearch("BRCA1[gene] AND Homo sapiens[organism]")
print(res["count"])
```

**Ответ:** функция возвращает `esearchresult`; для запроса выше `count` равен `1334`.
{{< /solution >}}

**Задание 22.** Разбери XML-ответ `esearch` и получи список ID без `retmode=json`.

{{< solution >}}
**Решение:** XML разбирается через `ElementTree`. Нужно найти все элементы `Id` внутри `IdList` и взять их текст.

```python
import xml.etree.ElementTree as ET
import requests

TERM = ("BRCA1[gene] AND Homo sapiens[organism] "
        "AND srcdb_refseq[prop] AND mRNA[filter]")

r = requests.get(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
    params={"db": "nucleotide", "term": TERM, "retmax": 3},
    timeout=30,
)
root = ET.fromstring(r.text)
ids = [e.text for e in root.findall("IdList/Id")]
print(ids)
```

**Ответ:** `['1732746264', '1677529721', '1677501432']` для RefSeq-запроса из урока.
{{< /solution >}}

**Задание 23.** Почему этот код не работает и как исправить?

```python
r = requests.get(BASE + "efetch.fcgi", params={
    "db": "nucleotide", "id": "NM_007294.4",
    "rettype": "fasta", "retmode": "json",
}, timeout=30)
record = r.json()
```

{{< solution >}}
**Решение:** `efetch` с `rettype=fasta` возвращает текст FASTA, даже если указан `retmode=json`. `r.json()` пытается разобрать этот текст как JSON и падает с `JSONDecodeError`. Нужно поставить `retmode=text` и читать через `SeqIO`.

```python
from Bio import Entrez, SeqIO
with Entrez.efetch(db="nucleotide", id="NM_007294.4",
                   rettype="fasta", retmode="text") as h:
    record = SeqIO.read(h, "fasta")
```

**Ответ:** FASTA не JSON; исправить на `retmode=text` + `SeqIO.read`.
{{< /solution >}}

**Задание 24.** Составь `term` для поиска мРНК человеческого TP53 в RefSeq.

{{< solution >}}
**Решение:** заменяем имя гена и оставляем те же ограничения: ген, организм, источник RefSeq, фильтр мРНК.

```python
term = ("TP53[gene] AND Homo sapiens[organism] "
        "AND srcdb_refseq[prop] AND mRNA[filter]")
```

**Ответ:** `TP53[gene] AND Homo sapiens[organism] AND srcdb_refseq[prop] AND mRNA[filter]`.
{{< /solution >}}

**Задание 25.** Скачай две записи — `NM_007294.4` и `NM_007300.4` — и выведи их длины.

{{< solution >}}
**Решение:** ID перечисляются через запятую, а ответ читается `SeqIO.parse`, потому что записей несколько.

```python
from Bio import Entrez, SeqIO
Entrez.email = "you@example.org"

with Entrez.efetch(db="nucleotide",
                   id="NM_007294.4,NM_007300.4",
                   rettype="fasta", retmode="text") as h:
    for rec in SeqIO.parse(h, "fasta"):
        print(rec.id, len(rec.seq))
```

**Ответ:** `NM_007294.4 7088` и `NM_007300.4 7151`.
{{< /solution >}}

**Задание 26.** Нужно скачать 1000 записей порциями по 100 ID. Сколько запросов и сколько времени займёт минимум без ключа при паузе 0,4 с?

{{< solution >}}
**Решение:** 1000 / 100 = 10 запросов. Между ними 9 пауз по 0,4 с — это 3,6 секунды, не считая времени ответа. Это минимум; реальное время зависит от сети и размера записей.

**Ответ:** 10 запросов, минимум около 3,6 секунды пауз.
{{< /solution >}}

**Задание 27.** Почему код падает и что добавить?

```python
res = esearch("ген_которого_нет[gene]")
uid = res["idlist"][0]
```

{{< solution >}}
**Решение:** при отсутствии совпадений `count` равен `"0"`, а `idlist` пуст. Обращение к `[0]` даёт `IndexError`. Нужно проверить количество до извлечения ID.

```python
if int(res["count"]) == 0:
    print("ничего не найдено")
else:
    uid = res["idlist"][0]
```

**Ответ:** пустой `idlist`; проверять `count` перед `[0]`.
{{< /solution >}}

**Задание 28.** Сохрани запись в FASTA-файл так, чтобы кириллица в заголовке не испортилась.

{{< solution >}}
**Решение:** файл открывают в UTF-8, а запись пишут через `SeqIO.write`. Заголовок FASTA начнётся с `>`.

```python
with open("gene.fasta", "w", encoding="utf-8") as f:
    SeqIO.write(record, f, "fasta")
```

**Ответ:** `open(..., encoding="utf-8")` + `SeqIO.write`; файл начинается с `>`.
{{< /solution >}}

**Задание 29.** Получи accession из заголовка FASTA `>NM_007294.4 Homo sapiens ...`.

{{< solution >}}
**Решение:** заголовок начинается с `>`, дальше до первого пробела идёт accession. Берём первую строку, режем по пробелу и отбрасываем `>`.

```python
header = ">NM_007294.4 Homo sapiens BRCA1 ..."
acc = header[1:].split()[0]
print(acc)
```

**Ответ:** `NM_007294.4`.
{{< /solution >}}

**Задание 30.** Сколько времени займут 100 одиночных запросов без ключа и с ключом?

{{< solution >}}
**Решение:** без ключа лимит 3 запроса в секунду: 100 / 3 ≈ 33 секунды. С ключом 10 запросов в секунду: 100 / 10 = 10 секунд. Это оценка по лимиту, без учёта времени ответа; на практике лучше объединять ID в пакеты.

**Ответ:** около 33 секунд без ключа и около 10 секунд с ключом.
{{< /solution >}}

## Частые ошибки

❌ **Думать, что `esearch` скачивает последовательность** → `esearch` отдаёт только ID и количество → последовательность забирает `efetch`.

❌ **Путать UID и accession** → `1732746264` — внутренний ID, `NM_007294.4` — accession → для ссылок и файлов бери accession, для запросов годится и то и другое.

❌ **Не указывать email** → Biopython предупреждает, но правило NCBI нарушено → `Entrez.email` до первого запроса.

❌ **Ждать JSON от `efetch` с FASTA** → сервер вернёт текст, `r.json()` упадёт → `retmode=text` и `SeqIO`.

❌ **Не проверять `status_code` и пустой ответ** → `400` или `count=0` приводят к загадочным ошибкам → `raise_for_status()` и проверка `count`.

❌ **Скачивать тысячи записей одним запросом** → длинный URL, таймаут, отпор сервера → порции, `WebEnv`, ключ.

❌ **Забывать `handle.close()`** → открытые соединения накапливаются → используй `with`.

❌ **Разбирать XML регулярками** → хрупко и ломается на атрибутах → `ElementTree` или `Entrez.read`.

## Главное запомнить

✅ NCBI — это набор баз: GenBank, RefSeq, PubMed, SRA, Taxonomy; BLAST — поисковая служба.

✅ `esearch` ищет ID, `efetch` скачивает запись, `esummary` даёт сводку.

✅ `db` — где искать, `term` — что искать, `id` — какую запись брать.

✅ `retmode` — формат ответа (`json`, `xml`, `text`), `rettype` — тип записи (`fasta`, `gb`, `abstract`).

✅ `requests` + `params` + `timeout` + `raise_for_status()` — минимальный надёжный набор.

✅ JSON разбирается через `r.json()`, XML — через `ElementTree.fromstring`.

✅ В Biopython обязателен `Entrez.email`; для FASTA — `SeqIO`, а не `Entrez.read`.

✅ Лимит — 3 запроса в секунду без ключа и 10 с ключом; пауза `time.sleep(0.4)`.

✅ Массовые запросы без ключа заканчиваются блокировкой IP.

✅ `esearch` возвращает ID, а accession появляется в `esummary`; в статье указывай версию.

## Частые вопросы

**Что такое NCBI простыми словами?**
Это один из крупнейших архивов биологических данных: последовательности, статьи, сырые прочтения, таксономия. Работает как библиотека, в которую учёные со всего мира сдают данные, а все остальные их читают.

**Чем GenBank отличается от RefSeq?**
GenBank — всё, что прислали авторы, включая фрагменты и черновые записи. RefSeq — отобранные и курируемые эталоны: для гена есть каноническая мРНК и белок. Для анализа обычно берут RefSeq, для ссылки на конкретную публикацию — GenBank.

**Что такое accession?**
Номер записи в базе, например `NM_007294.4`. Он стабильнее внутреннего ID и понятен человеку. Версия после точки показывает, сколько раз запись обновлялась.

**Зачем NCBI требует email?**
Чтобы связаться с автором скрипта, если запросы мешают другим. Это условие бесплатного доступа, а не сбор данных. В Biopython адрес задаётся через `Entrez.email`.

**Можно ли скачать весь GenBank через E-utilities?**
Нет, и не нужно. Для больших объёмов есть FTP и NCBI Datasets. E-utilities предназначены для точечных запросов и небольших выборок; массовая загрузка через них быстро упрётся в лимиты.

**Что делать, если сеть недоступна?**
`requests` выбросит `ConnectionError`, а Biopython — ошибку соединения. Обрабатывай исключение и делай повтор с паузой. Если сервер NCBI недоступен, код не «придумает» ответ: без сети данных не будет.

## Связь с другими темами

**До этого:** [207. Python с нуля для биолога](/python-bio/207-python-s-nulya-dlya-biologa-ustanovka-i-pervye-shagi/) — установка, переменные и типы. [208. Строки: работа с последовательностями ДНК](/python-bio/208-stroki-rabota-s-posledovatelnostyami-dnk/) — срезы, поиск мотивов и GC-состав, которые мы применили к скачанной записи. [215. Визуализация: matplotlib и seaborn](/python-bio/215-vizualizaciya-matplotlib-i-seaborn/) — как потом показать результаты.

**Следующий шаг:** [217. Работа с VCF: варианты генома](/python-bio/217-rabota-s-vcf-varianty-genoma/) — там данные приходят уже не из NCBI, а из секвенирования, и их нужно сравнивать с референсом.

**Рядом:** [210. Чтение FASTA-файлов](/python-bio/210-chtenie-fasta-faylov/) — разбор формата, который мы только что сохранили. [211. Biopython: основы](/python-bio/211-biopython-osnovy/) — больше возможностей `SeqIO` и `SeqRecord`.

**Биология за этим:** [84. Нуклеиновые кислоты: ДНК и РНК](/obshchaya-biologiya/084-nukleinovye-kisloty-dnk-i-rnk/) — что именно мы скачиваем и почему последовательность записывают буквами.

## Интересные факты

- В декабре 1982 года в GenBank было 606 последовательностей и 680 338 оснований. В октябре 2026 года — 269 895 537 последовательностей и более 9,3 триллиона оснований. База выросла примерно в 13,8 миллиона раз по числу букв.
- По данным NCBI, с 1982 года объём GenBank увеличивается примерно вдвое каждые 18 месяцев. Это значит, что через полтора года данных станет примерно вдвое больше — и без кода с ними не справиться.
- Статья с алгоритмом BLAST (1990) — одна из самых цитируемых работ в биологии. Через неё прошли почти все, кто искал гомологи.
- GI-номера, которыми раньше обозначали записи, NCBI отменил в 2016 году. Остались accession и внутренние UID — путаница с ними до сих пор встречается в старых скриптах.
- Префикс accession говорит о типе записи: `NM_` — мРНК, `NP_` — белок, `NC_` — хромосома, `NR_` — некодирующая РНК.

## Лайфхаки для запоминания

- **`esearch` — search, `efetch` — fetch, `esummary` — summary.** Английские слова буквально описывают действие.
- **`db` — где, `term` — что, `id` — кто.** Три вопроса, на которые отвечает любой запрос.
- **`rettype` — тип записи, `retmode` — режим ответа.** Тип — что, режим — как.
- **3 без ключа, 10 с ключом.** Как два тарифа мобильной связи: базовый и с опцией.
- **Accession начинается с букв:** `NM_` — мРНК, `NP_` — белок. Буква подсказывает тип.
- **Пусто — значит `count=0`.** Не лезь в `idlist[0]`, сначала посмотри на счётчик.
- **`raise_for_status()` и `timeout` — как ремень безопасности.** Добавляются один раз, спасают всегда.

---

Ты собрал рабочий мост между Python и одним из крупнейших биологических архивов мира: теперь код сам находит ген, достаёт его последовательность и сохраняет файл. Это не учебная игрушка — ровно так работают пайплайны в лабораториях и биоинформатических компаниях, только вместо BRCA1 там сотни образцов и очередь задач.

Дальше — данные другого типа: не последовательность, а таблица вариантов. В следующем уроке разберём формат VCF, научимся читать его и отличать реальные мутации от артефактов.

[217. Работа с VCF: варианты генома →](/python-bio/217-rabota-s-vcf-varianty-genoma/)
