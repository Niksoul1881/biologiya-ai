/* 3D-белки и ДНК: настоящие структуры из PDB во вьюере 3Dmol.js — режимы, раскраски, подсветка, подписи и уровни структуры белка. */
(function () {
  "use strict";
  var app = document.getElementById("b3-app");
  if (!app) return;
  var PDB = app.getAttribute("data-pdb"), IMG = app.getAttribute("data-img"), ROOT = app.getAttribute("data-root") || "/";
  var $ = function (s, el) { return (el || app).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || app).querySelectorAll(s)); };
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOUCH = window.matchMedia && matchMedia("(hover: none)").matches;

  function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ---------- справочники ---------- */
  var AA = { ALA: ["A", "Ала", "Аланин", "h"], ARG: ["R", "Арг", "Аргинин", "+"], ASN: ["N", "Асн", "Аспарагин", "p"], ASP: ["D", "Асп", "Аспарагиновая кислота", "-"],
    CYS: ["C", "Цис", "Цистеин", "p"], GLN: ["Q", "Глн", "Глутамин", "p"], GLU: ["E", "Глу", "Глутаминовая кислота", "-"], GLY: ["G", "Гли", "Глицин", "h"],
    HIS: ["H", "Гис", "Гистидин", "+"], ILE: ["I", "Иле", "Изолейцин", "h"], LEU: ["L", "Лей", "Лейцин", "h"], LYS: ["K", "Лиз", "Лизин", "+"],
    MET: ["M", "Мет", "Метионин", "h"], MSE: ["M", "Мет", "Селенометионин", "h"], PHE: ["F", "Фен", "Фенилаланин", "h"], PRO: ["P", "Про", "Пролин", "h"],
    HYP: ["O", "Гип", "Гидроксипролин", "p"], SER: ["S", "Сер", "Серин", "p"], THR: ["T", "Тре", "Треонин", "p"], TRP: ["W", "Три", "Триптофан", "h"],
    TYR: ["Y", "Тир", "Тирозин", "p"], VAL: ["V", "Вал", "Валин", "h"] };
  var NUC = { DA: ["А", "аденин", "A"], DT: ["Т", "тимин", "T"], DG: ["Г", "гуанин", "G"], DC: ["Ц", "цитозин", "C"], A: ["А", "аденин", "A"], T: ["Т", "тимин", "T"], G: ["Г", "гуанин", "G"], C: ["Ц", "цитозин", "C"] };
  var HET = { HEM: ["гем", 0xff3b3b], CRO: ["хромофор GFP", 0x7dff9c] };
  var BB = { "P": 1, "OP1": 1, "OP2": 1, "O1P": 1, "O2P": 1, "O5'": 1, "C5'": 1, "C4'": 1, "O4'": 1, "C3'": 1, "O3'": 1, "C2'": 1, "C1'": 1 };
  var HYD = { h: [0xffc233, "Гидрофобные"], p: [0x4ade80, "Полярные"], "+": [0x60a5fa, "Заряженные +"], "-": [0xff5c6c, "Заряженные −"] };
  var SS = { h: [0xff4d8d, "α-спираль"], s: [0xffd21f, "β-слой"], c: [0x9aa8b8, "петли и изгибы"] };
  var BASE = { A: [0x22d36e, "А — аденин"], T: [0xff4d6d, "Т — тимин"], G: [0xffd21f, "Г — гуанин"], C: [0x38bdf8, "Ц — цитозин"] };
  var BBC = 0xd8ccff, PHOS = 0xff9d3b;
  var ELEM = { C: 0xc8d2dc, N: 0x5b8cff, O: 0xff4d4d, S: 0xffd21f, P: 0xff9d3b, FE: 0xff7a1a, ZN: 0x8b9bb4, SE: 0xffa500 };
  var PLDDT = [[90, 0x0053d6, "очень уверенно (>90)"], [70, 0x65cbf3, "уверенно (70–90)"], [50, 0xffdb13, "слабо (50–70)"], [0, 0xff7d45, "очень слабо (<50)"]];
  var PAL = [0x22c55e, 0x38bdf8, 0xf472b6, 0xfacc15, 0xa78bfa, 0xfb923c, 0x2dd4bf, 0xf87171, 0x818cf8, 0xa3e635];
  var DIM = 0x34444c;
  var hex = function (n) { return "#" + ("00000" + n.toString(16)).slice(-6); };
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); };
    return (f(0) << 16) | (f(8) << 8) | f(4);
  }
  function spec(t) { return hsl(235 * (1 - t), 92, 58); }

  var CNAMES = { spectrum: "Радуга N→C", chain: "По цепям", ss: "Вторичная структура", hydro: "Свойства аминокислот", elem: "По элементам", bases: "Нуклеотиды", plddt: "Уверенность AlphaFold" };

  /* ---------- коллекция ---------- */
  var L = function (p, t) { return [p, t]; };
  var MOLS = [
    { id: "4hhb", name: "Гемоглобин", sub: "Переносчик кислорода в эритроцитах · человек", kind: "белок · 4 цепи", emoji: "🩸", acc: "#ef4444",
      color: "chain", colors: ["chain", "spectrum", "ss", "hydro", "elem"],
      chains: { A: ["α1", 0xff4d6d], B: ["β1", 0x38bdf8], C: ["α2", 0xff8fa3], D: ["β2", 0x7dd3fc] },
      what: "Белок, который переносит кислород от лёгких ко всем тканям, а часть углекислого газа — обратно. Состоит из четырёх цепей: двух α и двух β. В каждой цепи есть гем — небольшая молекула с атомом железа, к которому и присоединяется O₂.",
      where: "Эритроциты крови: в одном эритроците около 270 млн молекул гемоглобина.",
      stats: [["574", "аминокислоты"], ["4", "цепи: 2α + 2β"], ["4", "гема = 4 молекулы O₂"], ["≈ 64,5 кДа", "масса молекулы"]],
      fact: "Замена всего одной аминокислоты — глутаминовой кислоты на валин в 6-м положении β-цепи — вызывает серповидноклеточную анемию: эритроциты становятся похожими на серп. Подсветите «Глу-6 β-цепи».",
      lessons: [L("chelovek/063-krov-sostav-i-funkcii", "Кровь: состав и функции"), L("obshchaya-biologiya/083-belki-stroenie-i-funkcii", "Белки: строение и функции"), L("chelovek/075-nasledstvennye-zabolevaniya-cheloveka", "Наследственные заболевания")],
      focus: [{ t: "Гем", c: 0xff3b3b, sel: { resn: "HEM" }, rep: "sphere" }, { t: "α-цепи", c: 0xff4d6d, sel: { chain: ["A", "C"] } }, { t: "β-цепи", c: 0x38bdf8, sel: { chain: ["B", "D"] } },
        { t: "Глу-6 β-цепи", c: 0xffd21f, sel: { chain: ["B", "D"], resi: 6 }, rep: "sphere", spot: [{ chain: "B", resi: 6 }, "β6: здесь мутация при серповидноклеточной анемии"] }],
      spots: [[{ chain: "A", resn: "HEM" }, "Гем: здесь связывается O₂", 0xff3b3b], [{ chain: "C", resi: range(60, 80) }, "α-цепь", 0xff4d6d], [{ chain: "B", resi: range(60, 80) }, "β-цепь", 0x38bdf8]] },

    { id: "4ins", name: "Инсулин", sub: "Гормон, снижающий уровень глюкозы в крови · свинья", kind: "белок-гормон · 2 цепи", emoji: "💉", acc: "#f59e0b",
      color: "chain", colors: ["chain", "spectrum", "ss", "hydro", "elem"],
      chains: { A: ["Цепь A (21 ак)", 0xffb020], B: ["Цепь B (30 ак)", 0x38bdf8] },
      what: "Маленький белок-гормон из двух цепей, сшитых дисульфидными мостиками. Сигнализирует клеткам печени, мышц и жировой ткани, что пора забирать глюкозу из крови. Когда инсулина не хватает или клетки перестают на него отвечать, развивается сахарный диабет.",
      where: "Вырабатывается β-клетками островков Лангерганса поджелудочной железы, работает по всему организму.",
      stats: [["51", "аминокислота"], ["2", "цепи: A и B"], ["3", "дисульфидных мостика"], ["≈ 5,8 кДа", "масса"]],
      fact: "Инсулин — первый белок, у которого полностью прочитали последовательность аминокислот (Фредерик Сенгер, Нобелевская премия 1958 г.). Свиной инсулин отличается от человеческого всего одной аминокислотой, поэтому им десятилетиями лечили диабет. Сейчас человеческий инсулин производят генно-инженерные бактерии.",
      lessons: [L("chelovek/060-endokrinnaya-sistema-i-gormony", "Эндокринная система и гормоны"), L("obshchaya-biologiya/107-selekciya-i-biotehnologiya", "Селекция и биотехнология"), L("sinbio/290-gennaya-inzheneriya-plazmidy-i-vektory", "Генная инженерия")],
      focus: [{ t: "Цепь A", c: 0xffb020, sel: { chain: "A" } }, { t: "Цепь B", c: 0x38bdf8, sel: { chain: "B" } },
        { t: "Дисульфидные мостики", c: 0xffe14d, sel: { resn: "CYS" }, rep: "stick", spot: [{ resn: "CYS", chain: "A", resi: 7 }, "S–S мостик между цепями"] }],
      spots: [[{ chain: "A" }, "Цепь A — 21 аминокислота", 0xffb020], [{ chain: "B", resi: range(20, 30) }, "Цепь B — 30 аминокислот", 0x38bdf8], [{ chain: "A", resi: [6, 11] }, "S–S мостик внутри цепи A", 0xffe14d]] },

    { id: "1igt", name: "Антитело IgG", sub: "Иммуноглобулин G — «самонаводящаяся ракета» иммунитета · мышь", kind: "белок · 4 цепи", emoji: "🛡️", acc: "#a78bfa",
      color: "chain", colors: ["chain", "spectrum", "ss", "hydro", "elem"],
      chains: { A: ["Лёгкая цепь", 0xf9a8d4], B: ["Тяжёлая цепь", 0x8b5cf6], C: ["Лёгкая цепь", 0xfbcfe8], D: ["Тяжёлая цепь", 0x60a5fa] },
      what: "Молекула в форме буквы Y из двух тяжёлых и двух лёгких цепей. Кончики «рук» (Fab-фрагменты) узнают и хватают чужеродную молекулу — антиген, а «ножка» (Fc-фрагмент) подаёт сигнал фагоцитам и системе комплемента: «уничтожить!».",
      where: "Плазма крови и тканевая жидкость. Вырабатывают плазматические клетки — потомки B-лимфоцитов.",
      stats: [["≈ 1320", "аминокислот"], ["4", "цепи: 2 тяжёлые + 2 лёгкие"], ["2", "антигенсвязывающих участка"], ["≈ 150 кДа", "масса"]],
      fact: "Это первая расшифрованная структура целого антитела (1997 г.). Иммунная система может выработать миллиарды разных антител: гены их «рук» собираются в каждом B-лимфоците из кусочков в новой комбинации. На этом основана вакцинация.",
      lessons: [L("chelovek/064-immunitet-i-vakcinaciya", "Иммунитет и вакцинация"), L("bio-it/179-immunnaya-sistema-kak-sistema-raspoznavaniya", "Иммунная система как система распознавания"), L("obshchaya-biologiya/083-belki-stroenie-i-funkcii", "Функции белков")],
      focus: [{ t: "Лёгкие цепи", c: 0xf9a8d4, sel: { chain: ["A", "C"] } }, { t: "Тяжёлые цепи", c: 0x8b5cf6, sel: { chain: ["B", "D"] } },
        { t: "Участки узнавания антигена", c: 0xffd21f, sel: { or: [{ chain: ["A", "C"], resi: range(24, 34).concat(range(50, 56), range(89, 97)) }, { chain: ["B", "D"], resi: range(31, 35).concat(range(50, 65), range(95, 102)) }] }, rep: "sphere" }],
      spots: [[{ chain: "A", resi: range(1, 107) }, "Fab: хватает антиген", 0xf9a8d4], [{ chain: "C", resi: range(1, 107) }, "Fab: второй «захват»", 0xfbcfe8], [{ chain: ["B", "D"], resi: range(340, 444) }, "Fc: сигнал иммунным клеткам", 0x8b5cf6]] },

    { id: "1bna", rot: [90, "x"], zoom: 0.95, name: "ДНК", sub: "Двойная спираль B-формы · 12 пар нуклеотидов", kind: "нуклеиновая кислота · 2 цепи", emoji: "🧬", acc: "#38bdf8", rep: "stick",
      color: "bases", colors: ["bases", "chain", "elem"], dna: true,
      chains: { A: ["Цепь 1 (5′→3′)", 0x38bdf8], B: ["Цепь 2 (3′→5′)", 0xf472b6] },
      what: "Две цепи нуклеотидов закручены в правую спираль и соединены друг с другом по принципу комплементарности: напротив аденина всегда тимин (А–Т), напротив гуанина — цитозин (Г–Ц). Снаружи — сахарофосфатный остов, внутри — «ступеньки» из пар оснований. Цепи антипараллельны.",
      where: "Ядро клетки (хромосомы), а также митохондрии и хлоропласты; у бактерий — нуклеоид и плазмиды.",
      stats: [["12", "пар нуклеотидов в этой модели"], ["≈ 10", "пар на один виток"], ["2 нм", "диаметр спирали"], ["3,4 нм", "длина витка"]],
      fact: "Между А и Т — две водородные связи, между Г и Ц — три, поэтому участки, богатые Г–Ц, прочнее. Если вытянуть всю ДНК одной клетки человека в нитку, получится около 2 метров.",
      lessons: [L("obshchaya-biologiya/084-nukleinovye-kisloty-dnk-i-rnk", "Нуклеиновые кислоты: ДНК и РНК"), L("bio-it/169-dnk-kak-kod-alfavit-a-c-g-t", "ДНК как код"), L("obshchaya-biologiya/093-geneticheskiy-kod-i-ego-svoystva", "Генетический код")],
      focus: [{ t: "Пары А–Т", c: 0x22d36e, sel: { resn: ["DA", "DT"] }, rep: "sphere" }, { t: "Пары Г–Ц", c: 0xffd21f, sel: { resn: ["DG", "DC"] }, rep: "sphere" },
        { t: "Сахарофосфатный остов", c: 0xd8ccff, sel: { atom: Object.keys(BB) }, rep: "sphere" }],
      spots: [[{ chain: "A", resi: 5, not: { atom: Object.keys(BB) } }, "Пара А–Т: 2 водородные связи", 0x22d36e], [{ chain: "A", resi: 2, not: { atom: Object.keys(BB) } }, "Пара Г–Ц: 3 водородные связи", 0xffd21f], [{ chain: "B", resi: [17, 18], atom: ["P", "OP1", "OP2"] }, "Сахарофосфатный остов", 0xd8ccff]] },

    { id: "1mbn", name: "Миоглобин", sub: "Кислородный «аккумулятор» мышц · кашалот", kind: "белок · 1 цепь", emoji: "🐋", acc: "#f43f5e",
      color: "spectrum", colors: ["spectrum", "ss", "hydro", "elem"],
      chains: { A: ["Миоглобин", 0xf43f5e] },
      what: "Родственник гемоглобина, но из одной цепи и с одним гемом. Запасает кислород прямо в мышцах и отдаёт его, когда мышца интенсивно работает. Цепь уложена в восемь α-спиралей, между которыми, как в кармане, лежит гем.",
      where: "Скелетные мышцы и сердце; особенно много — у ныряющих млекопитающих.",
      stats: [["153", "аминокислоты"], ["1", "цепь"], ["8", "α-спиралей"], ["≈ 17 кДа", "масса"]],
      fact: "Миоглобин — первый белок, чью трёхмерную структуру увидели учёные (Джон Кендрю, 1958 г., Нобелевская премия 1962 г.). У кашалота миоглобина в мышцах так много, что мясо почти чёрное — это помогает нырять больше чем на час.",
      lessons: [L("chelovek/062-myshcy-i-dvizhenie", "Мышцы и движение"), L("obshchaya-biologiya/083-belki-stroenie-i-funkcii", "Белки: строение и функции"), L("bio-it/174-pochemu-forma-belka-opredelyaet-funkciyu", "Почему форма белка определяет функцию")],
      focus: [{ t: "Гем", c: 0xff3b3b, sel: { resn: "HEM" }, rep: "sphere" }, { t: "α-спирали", c: 0xff4d8d, sel: { ss: "h" } }],
      spots: [[{ resn: "HEM" }, "Гем с атомом железа", 0xff3b3b], [{ resi: range(3, 18) }, "α-спираль A", 0xff4d8d], [{ resi: range(124, 149) }, "α-спираль H — самая длинная", 0x38bdf8]] },

    { id: "1ema", name: "Зелёный флуоресцентный белок", short: "GFP", sub: "GFP — светящийся белок медузы Aequorea victoria", kind: "белок · 1 цепь", emoji: "💚", acc: "#22c55e",
      color: "spectrum", colors: ["spectrum", "ss", "hydro", "elem"],
      chains: { A: ["GFP", 0x22c55e] },
      what: "Белок-«фонарик»: под синим или ультрафиолетовым светом он светится ярко-зелёным. Его цепь образует β-бочонок из 11 нитей, а в центре, надёжно спрятанный от воды, находится хромофор — светящаяся группа, которая сама собирается из трёх аминокислот этого же белка.",
      where: "Светящиеся клетки медузы Aequorea victoria; в лабораториях — почти в любом организме как генетическая метка.",
      stats: [["238", "аминокислот"], ["11", "β-нитей в «бочонке»"], ["3", "аминокислоты образуют хромофор"], ["≈ 27 кДа", "масса"]],
      fact: "Ген GFP «пришивают» к другим генам, и нужный белок начинает светиться прямо в живой клетке — так видно, где он работает. За открытие и развитие GFP в 2008 г. дали Нобелевскую премию по химии. Есть даже светящиеся рыбки и мыши.",
      lessons: [L("sinbio/290-gennaya-inzheneriya-plazmidy-i-vektory", "Генная инженерия"), L("sinbio/289-chto-takoe-sinteticheskaya-biologiya", "Синтетическая биология"), L("obshchaya-biologiya/083-belki-stroenie-i-funkcii", "Белки")],
      focus: [{ t: "Хромофор", c: 0x7dff9c, sel: { resn: "CRO" }, rep: "sphere" }, { t: "β-слои", c: 0xffd21f, sel: { ss: "s" } }, { t: "α-спирали", c: 0xff4d8d, sel: { ss: "h" } }],
      spots: [[{ resn: "CRO" }, "Хромофор — источник свечения", 0x7dff9c], [{ resi: range(140, 150) }, "β-бочонок из 11 нитей", 0xffd21f]] },

    { id: "1cgd", rot: [35, "z"], zoom: 1, name: "Коллаген", sub: "Тройная спираль — фрагмент белка соединительной ткани", kind: "белок · 3 цепи", emoji: "🦴", acc: "#fb923c",
      color: "chain", colors: ["chain", "spectrum", "hydro", "elem"],
      chains: { A: ["Цепь 1", 0xfb923c], B: ["Цепь 2", 0xfacc15], C: ["Цепь 3", 0xf472b6] },
      what: "Фибриллярный белок: три длинные цепи свиваются в прочный канат — тройную спираль. Каждая третья аминокислота — глицин, самая маленькая: только она помещается в центре каната. Здесь показан короткий фрагмент из 30 аминокислот в каждой цепи; настоящая цепь коллагена — около 1000 аминокислот.",
      where: "Кожа, сухожилия, связки, хрящи, кости, стенки сосудов, роговица глаза.",
      stats: [["≈ 30%", "всех белков тела млекопитающих"], ["3", "цепи в тройной спирали"], ["каждая 3-я", "аминокислота — глицин"], ["≈ 300 нм", "длина молекулы"]],
      fact: "Чтобы коллаген был прочным, часть пролина превращается в гидроксипролин — для этого ферменту нужен витамин C. Без витамина C коллаген получается слабым: развивается цинга — кровоточат дёсны, выпадают зубы. Из коллагена варят желатин.",
      lessons: [L("chelovek/071-vitaminy", "Витамины"), L("chelovek/061-oporno-dvigatelnaya-sistema-skelet", "Скелет"), L("chelovek/054-tkani-cheloveka", "Ткани человека")],
      focus: [{ t: "Глицин", c: 0x7dff9c, sel: { resn: "GLY" }, rep: "sphere" }, { t: "Гидроксипролин", c: 0xff5c8a, sel: { resn: "HYP" }, rep: "stick" }, { t: "Пролин", c: 0x38bdf8, sel: { resn: "PRO" }, rep: "stick" }],
      spots: [[{ chain: "A", resi: range(1, 6) }, "Три цепи свиты в канат", 0xfb923c], [{ resn: "GLY", chain: "B", resi: range(12, 18) }, "Глицин — в центре спирали", 0x7dff9c]] },

    { id: "1lyz", name: "Лизоцим", sub: "Фермент, разрушающий клеточную стенку бактерий · белок куриного яйца", kind: "фермент · 1 цепь", emoji: "🥚", acc: "#2dd4bf",
      color: "spectrum", colors: ["spectrum", "ss", "hydro", "elem"],
      chains: { A: ["Лизоцим", 0x2dd4bf] },
      what: "Фермент-«ножницы» врождённого иммунитета. Разрезает полисахарид муреин (пептидогликан), из которого построена клеточная стенка бактерий, — и бактерия лопается. В щели на поверхности белка находится активный центр, куда входит кусок полисахаридной цепи.",
      where: "Слёзы, слюна, носовая слизь, грудное молоко, белок куриного яйца.",
      stats: [["129", "аминокислот"], ["1", "цепь"], ["4", "дисульфидных мостика"], ["≈ 14,3 кДа", "масса"]],
      fact: "Лизоцим открыл Александр Флеминг в 1922 г. — за шесть лет до пенициллина: он заметил, что капля из его носа растворяет бактерии. В 1965 г. лизоцим стал первым ферментом, чью трёхмерную структуру расшифровали.",
      lessons: [L("chelovek/069-fermenty-pishchevareniya", "Ферменты"), L("organizmy/006-bakterii-stroenie-razmnozhenie-znachenie", "Бактерии"), L("chelovek/064-immunitet-i-vakcinaciya", "Иммунитет")],
      focus: [{ t: "Активный центр", c: 0xff3b3b, sel: { resi: [35, 52] }, rep: "sphere", spot: [{ resi: [35, 52] }, "Активный центр: Глу-35 и Асп-52"] },
        { t: "Дисульфидные мостики", c: 0xffe14d, sel: { resn: "CYS" }, rep: "stick" }, { t: "α-спирали", c: 0xff4d8d, sel: { ss: "h" } }, { t: "β-слои", c: 0xffd21f, sel: { ss: "s" } }],
      spots: [[{ resi: [35, 52] }, "Активный центр — «ножницы»", 0xff3b3b], [{ resi: range(5, 15) }, "α-спираль", 0xff4d8d]] },

    { id: "1aoi", name: "Нуклеосома", sub: "ДНК, намотанная на «катушку» из белков-гистонов", kind: "ДНК + белки · 10 цепей", emoji: "🧶", acc: "#e879f9",
      color: "chain", colors: ["chain", "bases", "spectrum", "ss"], dna: true,
      chains: { A: ["Гистон H3", 0x60a5fa], E: ["Гистон H3", 0x60a5fa], B: ["Гистон H4", 0x22c55e], F: ["Гистон H4", 0x22c55e], C: ["Гистон H2A", 0xfacc15], G: ["Гистон H2A", 0xfacc15], D: ["Гистон H2B", 0xfb7185], H: ["Гистон H2B", 0xfb7185], I: ["ДНК", 0xe9d5ff], J: ["ДНК", 0xd8b4fe] },
      what: "Первый уровень упаковки ДНК в хромосоме. Нить ДНК почти в два оборота наматывается на «катушку» из восьми белков-гистонов (по две копии H2A, H2B, H3 и H4). Гистоны заряжены положительно, а ДНК — отрицательно, поэтому они крепко притягиваются. Нуклеосомы на нити ДНК похожи на бусины.",
      where: "Ядро любой эукариотической клетки — в хроматине.",
      stats: [["146", "пар нуклеотидов на катушке"], ["8", "белков-гистонов"], ["≈ 1,7", "оборота ДНК"], ["≈ 11 нм", "диаметр «бусины»"]],
      fact: "Химические метки на «хвостах» гистонов решают, будут ли гены рядом включены или выключены, — это одна из основ эпигенетики. Благодаря нуклеосомам и следующим уровням упаковки 2 метра ДНК помещаются в ядро диаметром около 6 микрометров.",
      lessons: [L("obshchaya-biologiya/089-yadro-i-hromosomy", "Ядро и хромосомы"), L("bio-it/177-epigenetika", "Эпигенетика"), L("obshchaya-biologiya/084-nukleinovye-kisloty-dnk-i-rnk", "ДНК и РНК")],
      focus: [{ t: "ДНК", c: 0xe9d5ff, sel: { chain: ["I", "J"] } }, { t: "H3", c: 0x60a5fa, sel: { chain: ["A", "E"] } }, { t: "H4", c: 0x22c55e, sel: { chain: ["B", "F"] } },
        { t: "H2A", c: 0xfacc15, sel: { chain: ["C", "G"] } }, { t: "H2B", c: 0xfb7185, sel: { chain: ["D", "H"] } }],
      spots: [[{ chain: "I", resi: range(66, 76) }, "ДНК обвивает катушку", 0xe9d5ff], [{ chain: ["A", "B"] }, "Гистоновый октамер", 0x60a5fa]] },

    { id: "6vxx", rot: [-90, "x"], zoom: 1, name: "Спайк-белок коронавируса", short: "Спайк SARS-CoV-2", sub: "Шип на поверхности вируса SARS-CoV-2", kind: "вирусный белок · 3 цепи", emoji: "🦠", acc: "#f87171",
      color: "chain", colors: ["chain", "spectrum", "ss", "hydro"],
      chains: { A: ["Цепь A", 0xf87171], B: ["Цепь B", 0xfbbf24], C: ["Цепь C", 0x38bdf8] },
      what: "Шипы (spike) торчат из оболочки коронавируса и придают ему вид короны. Это тример — три одинаковые цепи. Верхний участок RBD узнаёт рецептор ACE2 на клетках дыхательных путей человека, после чего шип перестраивается и сливает оболочку вируса с мембраной клетки.",
      where: "Поверхность вирусной частицы SARS-CoV-2; на одном вирусе — несколько десятков шипов.",
      stats: [["3 × 1273", "аминокислот"], ["3", "одинаковые цепи (тример)"], ["≈ 10 нм", "высота шипа над оболочкой"], ["2020", "год расшифровки"]],
      fact: "Структуру шипа расшифровали за считанные недели в начале 2020 г., и именно на него «нацелены» мРНК- и векторные вакцины: организм учится делать антитела, которые закрывают RBD. В модели не видны гибкие участки и сахара, покрывающие белок.",
      lessons: [L("organizmy/007-virusy-nekletochnaya-forma-zhizni", "Вирусы"), L("chelovek/076-infekcionnye-bolezni-i-ih-profilaktika", "Инфекционные болезни"), L("chelovek/064-immunitet-i-vakcinaciya", "Вакцинация")],
      focus: [{ t: "RBD — связывание с ACE2", c: 0xff3b3b, sel: { resi: range(319, 541) } }, { t: "Одна цепь", c: 0xf87171, sel: { chain: "A" } }],
      spots: [[{ chain: "A", resi: range(330, 520) }, "RBD — цепляется за рецептор ACE2", 0xff3b3b], [{ resi: range(1100, 1147) }, "Ножка — уходит в оболочку вируса", 0x38bdf8]] },

    { id: "af-p53", name: "Белок p53 (AlphaFold)", short: "p53 · AlphaFold", sub: "«Страж генома» — предсказание нейросети AlphaFold · человек", kind: "модель ИИ · 1 цепь", emoji: "🤖", acc: "#3b82f6", af: true,
      color: "plddt", colors: ["plddt", "spectrum", "ss", "hydro"],
      chains: { A: ["p53", 0x3b82f6] },
      what: "Эта структура не измерена в эксперименте, а предсказана нейросетью AlphaFold по одной только последовательности аминокислот. Цвет — уверенность модели (pLDDT): синие участки предсказаны точно, оранжевые «макароны» — неупорядоченные концы белка, которые и в клетке не имеют постоянной формы.",
      where: "Ядро клеток человека. p53 — транскрипционный фактор: садится на ДНК и включает гены защиты.",
      stats: [["393", "аминокислоты"], ["94–292", "ДНК-связывающий домен"], ["≈ 50%", "опухолей несут мутации в гене TP53"], ["> 200 млн", "структур в базе AlphaFold"]],
      fact: "p53 останавливает деление клетки с повреждённой ДНК и, если ремонт невозможен, запускает апоптоз — программируемую гибель клетки. Создатели AlphaFold получили Нобелевскую премию по химии 2024 г.",
      lessons: [L("ml-bio/274-alphafold-kak-predskazyvayut-strukturu-belka", "AlphaFold: как предсказывают структуру белка"), L("algoritmy/242-struktura-belka-ot-posledovatelnosti-k-3d", "От последовательности к 3D"), L("genomika/264-genomika-raka", "Геномика рака")],
      focus: [{ t: "ДНК-связывающий домен", c: 0x0053d6, sel: { resi: range(94, 292) } }, { t: "Тетрамеризационный домен", c: 0x22c55e, sel: { resi: range(325, 356) } }, { t: "Неупорядоченные концы", c: 0xff7d45, sel: { resi: range(1, 60).concat(range(362, 393)) } }],
      spots: [[{ resi: range(94, 292) }, "Ядро белка: уверенное предсказание", 0x0053d6], [{ resi: range(1, 40) }, "Неупорядоченный конец", 0xff7d45], [{ resi: range(325, 356) }, "Домен сборки в тетрамер", 0x22c55e]] }
  ];
  MOLS.forEach(function (m) { if (!m.rep) m.rep = "cartoon"; });

  /* ---------- уровни структуры (гемоглобин) ---------- */
  var LEVELS = [
    { t: "Первичная структура", bond: "Пептидные связи", txt: "Последовательность аминокислот в цепи — как буквы в слове. Её записывает ген: ДНК → иРНК → белок. В α-цепи гемоглобина 141 аминокислота; каждая бусина на модели — одна аминокислота, цвет — её свойства. Наведите на букву ниже." },
    { t: "Вторичная структура", bond: "Водородные связи", txt: "Участки цепи закручиваются в α-спирали или складываются в β-слои. Их удерживают водородные связи между группами C=O и N–H соседних витков. Цепь гемоглобина почти целиком состоит из α-спиралей (розовые), между ними — короткие петли." },
    { t: "Третичная структура", bond: "Гидрофобные, ионные, водородные связи, S–S мостики", txt: "Спирали укладываются в компактный клубок — глобулу. Гидрофобные аминокислоты прячутся внутрь, полярные остаются снаружи, в контакте с водой. В «кармане» между спиралями лежит гем — именно форма глобулы позволяет ему связывать кислород." },
    { t: "Четвертичная структура", bond: "Те же связи, но между цепями", txt: "Несколько глобул объединяются в один белок. Гемоглобин — это четыре цепи: две α (красные) и две β (синие), у каждой свой гем. Когда одна цепь присоединяет O₂, остальным становится легче это сделать — поэтому гемоглобин так эффективно забирает кислород в лёгких." }
  ];

  /* ---------- DOM ---------- */
  var view = $(".b3-view"), frame = $(".b3-frame"), spotsEl = $(".b3-spots"), tipEl = $(".b3-tip"), legend = $(".b3-legend"), loading = $(".b3-loading");
  var colorsEl = $(".b3-colors"), focusEl = $(".b3-focus"), info = $(".b3-info"), tray = $(".b3-tray"), seqEl = $(".b3-seq");
  var v = null, model = null, atoms = [], cur = null, cache = {}, loadTok = 0;
  var S = { rep: "cartoon", color: "chain", focus: -1, labels: true, spin: !REDUCE, mode: "gallery", level: 0, glow: !TOUCH };
  var seen = store("b3-seen") || {};
  var spots = [], visible = true, hoverAtom = null;

  if (!S.glow) $(".b3-glow").checked = false;
  app.classList.toggle("b3-glowon", S.glow);
  if (!S.spin) { $(".b3-spin").classList.remove("on"); $(".b3-spin").setAttribute("aria-pressed", "false"); }

  /* карусель */
  tray.innerHTML = MOLS.map(function (m, i) {
    return '<button type="button" class="b3-mol" role="listitem" data-i="' + i + '" style="--c:' + m.acc + '">' +
      '<span class="b3-pic"><img src="' + IMG + m.id + '.webp" alt="" loading="lazy" width="300" height="220"></span>' +
      '<span class="b3-mn">' + esc(m.short || m.name) + '</span><span class="b3-mi">' + (m.af ? "AlphaFold" : "PDB " + m.id.toUpperCase()) + '</span><span class="b3-ok">✓</span></button>';
  }).join("");
  $$(".b3-pic img", tray).forEach(function (img, i) { img.addEventListener("error", function () { img.outerHTML = "<em>" + MOLS[i].emoji + "</em>"; }); });
  $$(".b3-mol", tray).forEach(function (b) { b.addEventListener("click", function () { setMode("gallery"); load(+b.getAttribute("data-i")); }); });
  $(".b3-prev").addEventListener("click", function () { tray.scrollBy({ left: -tray.clientWidth * 0.8, behavior: "smooth" }); });
  $(".b3-next").addEventListener("click", function () { tray.scrollBy({ left: tray.clientWidth * 0.8, behavior: "smooth" }); });

  /* ---------- цвета ---------- */
  function prep() {
    // доля положения остатка в цепи — для радуги N→C; метка нуклеотидов и остова
    var per = {};
    atoms.forEach(function (a) {
      if (a.hetflag) return;
      var c = per[a.chain] || (per[a.chain] = { list: [], seen: {} });
      if (!c.seen[a.resi]) { c.seen[a.resi] = c.list.length; c.list.push(a.resi); }
    });
    atoms.forEach(function (a) {
      var c = per[a.chain];
      a.__t = c && c.list.length > 1 ? c.seen[a.resi] / (c.list.length - 1) : 0.5;
      a.__n = NUC[a.resn] ? NUC[a.resn][2] : null;
      a.__bb = a.__n && BB[a.atom] ? (a.atom === "P" || a.atom.indexOf("OP") === 0 || a.atom === "O1P" || a.atom === "O2P" ? 2 : 1) : 0;
    });
  }
  function chainCol(a) {
    var ch = cur.chains && cur.chains[a.chain];
    if (ch) return ch[1];
    var keys = Object.keys(cur.chains || {}); return PAL[(a.chain.charCodeAt(0) + keys.length) % PAL.length];
  }
  function baseCol(a, mode) {
    if (a.hetflag && HET[a.resn]) return HET[a.resn][1];
    if (a.hetflag) return ELEM[(a.elem || "").toUpperCase()] || 0xc8d2dc;
    switch (mode) {
      case "spectrum": return spec(a.__t);
      case "chain": return chainCol(a);
      case "ss": if (a.__n) return 0x9aa8b8; return (SS[a.ss] || SS.c)[0];
      case "hydro": if (a.__n) return 0x9aa8b8; return AA[a.resn] ? HYD[AA[a.resn][3]][0] : 0xc8d2dc;
      case "elem": return ELEM[(a.elem || "").toUpperCase()] || 0xc8d2dc;
      case "bases": if (!a.__n) return a.chain && cur.chains[a.chain] ? mute(chainCol(a)) : 0x7c8a96; return a.__bb ? (a.__bb === 2 ? PHOS : BBC) : BASE[a.__n][0];
      case "plddt": for (var i = 0; i < PLDDT.length; i++) if (a.b >= PLDDT[i][0]) return PLDDT[i][1]; return PLDDT[3][1];
    }
    return 0xc8d2dc;
  }
  function mute(c) { var r = c >> 16, g = (c >> 8) & 255, b = c & 255, k = 0.45, m = 70; return (Math.round(r * k + m * (1 - k)) << 16) | (Math.round(g * k + m * (1 - k)) << 8) | Math.round(b * k + m * (1 - k)); }

  function colorFn(mode) {
    var f = S.focus >= 0 && cur.focus ? cur.focus[S.focus] : null;
    if (!f) return function (a) { return baseCol(a, mode); };
    return function (a) { return a.__f ? f.c : DIM; };
  }
  function markFocus() {
    atoms.forEach(function (a) { a.__f = false; });
    var f = S.focus >= 0 && cur.focus ? cur.focus[S.focus] : null;
    if (!f) return null;
    v.selectedAtoms(f.sel).forEach(function (a) { a.__f = true; });
    return f;
  }

  /* ---------- отрисовка ---------- */
  function draw(skipSurface) {
    if (!v || !model) return;
    var f = markFocus(), cf = colorFn(S.color), big = atoms.length > 9000;
    v.setStyle({}, {});
    v.removeAllSurfaces();
    var NUCS = Object.keys(NUC);
    if (S.rep === "cartoon" || S.rep === "surface") {
      var thin = S.rep === "surface";
      v.setStyle({ hetflag: false }, { cartoon: { colorfunc: cf, thickness: thin ? 0.3 : 0.55, arrows: true, opacity: 1 } });
      if (cur.dna) v.addStyle({ resn: NUCS, not: { atom: Object.keys(BB) } }, { stick: { colorfunc: cf, radius: 0.24 } });
      v.setStyle({ hetflag: true }, { stick: { colorfunc: cf, radius: 0.3 } });
      v.addStyle({ elem: ["Fe", "FE", "Zn", "ZN"] }, { sphere: { colorfunc: cf, scale: 0.9 } });
      if (f && f.rep && S.rep === "cartoon") {
        var st = {}; st[f.rep] = f.rep === "sphere" ? { color: f.c, scale: 0.95 } : { color: f.c, radius: 0.3 };
        v.addStyle(f.sel, st);
      }
      if (S.rep === "surface" && !skipSurface) {
        var type = big ? $3Dmol.SurfaceType.VDW : $3Dmol.SurfaceType.MS;
        busy(true);
        var p = v.addSurface(type, { opacity: 0.86, colorfunc: cf }, { hetflag: false });
        var done = function () { busy(false); v.render(); };
        if (p && p.then) p.then(done, done); else setTimeout(done, 30);
      }
    } else if (S.rep === "sphere") {
      v.setStyle({}, { sphere: { colorfunc: cf, scale: 1 } });
    } else {
      v.setStyle({}, { stick: { colorfunc: cf, radius: big ? 0.16 : 0.2 } });
      v.addStyle({ hetflag: true }, { stick: { colorfunc: cf, radius: 0.32 } });
    }
    v.render();
    renderLegend();
  }
  function busy(on) { loading.classList.toggle("on", on); $("span", loading).textContent = on === true ? "Строим поверхность…" : "Загружаем структуру…"; }

  function renderLegend() {
    var f = S.focus >= 0 && cur.focus ? cur.focus[S.focus] : null, h = "";
    var it = function (c, t) { return '<span><i style="--c:' + hex(c) + '"></i>' + esc(t) + "</span>"; };
    if (S.mode === "levels") h = levelLegend();
    else if (f) h = it(f.c, f.t) + it(DIM, "остальное");
    else switch (S.color) {
      case "spectrum": h = '<span>N-конец <em class="b3-grad"></em> C-конец</span>'; break;
      case "chain": var seenN = {}; Object.keys(cur.chains).forEach(function (k) { var c = cur.chains[k]; if (!seenN[c[0]]) { seenN[c[0]] = 1; h += it(c[1], c[0]); } }); break;
      case "ss": h = it(SS.h[0], SS.h[1]) + it(SS.s[0], SS.s[1]) + it(SS.c[0], SS.c[1]); break;
      case "hydro": Object.keys(HYD).forEach(function (k) { h += it(HYD[k][0], HYD[k][1]); }); break;
      case "elem": [["C", "C углерод"], ["N", "N азот"], ["O", "O кислород"], ["S", "S сера"]].concat(cur.dna ? [["P", "P фосфор"]] : []).concat(cur.id.match(/hhb|mbn/) ? [["FE", "Fe железо"]] : []).forEach(function (e) { h += it(ELEM[e[0]], e[1]); }); break;
      case "bases": Object.keys(BASE).forEach(function (k) { h += it(BASE[k][0], BASE[k][1]); }); h += it(BBC, "сахар") + it(PHOS, "фосфат"); break;
      case "plddt": PLDDT.forEach(function (p) { h += it(p[1], p[2]); }); break;
    }
    legend.innerHTML = h.replace('<em class="b3-grad"></em>', '<i class="b3-grad" style="--c:transparent"></i>');
  }

  /* ---------- подписи-хотспоты ---------- */
  function centroid(sel) {
    var list = v.selectedAtoms(sel), x = 0, y = 0, z = 0;
    if (!list.length) return null;
    list.forEach(function (a) { x += a.x; y += a.y; z += a.z; });
    return { x: x / list.length, y: y / list.length, z: z / list.length };
  }
  function setSpots(defs) {
    spotsEl.innerHTML = ""; spots = [];
    (defs || []).forEach(function (d) {
      var p = centroid(d[0]); if (!p) return;
      var el = document.createElement("div");
      el.className = "b3-spot"; el.style.setProperty("--c", hex(d[2] || 0x22c55e));
      el.innerHTML = "<i></i><b>" + esc(d[1]) + "</b>";
      spotsEl.appendChild(el);
      spots.push({ p: p, el: el });
    });
    requestAnimationFrame(function () { spots.forEach(function (s) { s.el.classList.add("on"); }); });
  }
  function curSpots() {
    if (S.mode === "levels") return null;
    var f = S.focus >= 0 && cur.focus ? cur.focus[S.focus] : null;
    if (f) return f.spot ? [[f.spot[0], f.spot[1], f.c]] : [[f.sel, f.t, f.c]];
    return cur.spots;
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!v || !visible) return;
    var off = v.canvasOffset(), w = view.clientWidth, hh = view.clientHeight;
    if (S.labels) spots.forEach(function (s) {
      var q = v.modelToScreen(s.p), x = q.x - off.left, y = q.y - off.top;
      s.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      s.el.classList.toggle("left", x > w * 0.6);
      s.el.style.visibility = x < -20 || y < -20 || x > w + 20 || y > hh + 20 ? "hidden" : "";
    });
    if (hoverAtom && tipEl.firstChild) {
      var q2 = v.modelToScreen(hoverAtom), tx = q2.x - off.left, ty = q2.y - off.top, el = tipEl.firstChild;
      var tw = el.offsetWidth;
      tx = Math.max(6 + tw / 2, Math.min(w - 6 - tw / 2, tx));
      el.style.transform = "translate(" + (tx - tw / 2).toFixed(1) + "px," + (ty - el.offsetHeight - 14).toFixed(1) + "px)";
    }
  }
  requestAnimationFrame(tick);
  function atomText(a) {
    if (HET[a.resn]) return [HET[a.resn][0].replace(/^./, function (c) { return c.toUpperCase(); }), ((a.elem || "").toUpperCase() === "FE" ? "атом железа Fe²⁺" : "небелковая группа")];
    if (NUC[a.resn]) { var n = NUC[a.resn]; return [n[0] + " — " + n[1] + " · нуклеотид " + a.resi, a.__bb ? (a.__bb === 2 ? "фосфатная группа" : "сахар дезоксирибоза") : "азотистое основание"]; }
    var aa = AA[a.resn];
    var ch = cur.chains && cur.chains[a.chain] ? cur.chains[a.chain][0] : "цепь " + a.chain;
    if (aa) return [aa[1] + "-" + a.resi + " · " + aa[2], ch + (cur.af ? " · уверенность " + Math.round(a.b) : "")];
    return [a.resn + " " + a.resi, ch];
  }

  /* ---------- загрузка ---------- */
  function ensureViewer() {
    if (v) return true;
    if (!window.$3Dmol) return false;
    v = $3Dmol.createViewer(view, { backgroundColor: "#06100c", backgroundAlpha: 0, antialias: true, cartoonQuality: TOUCH ? 6 : 10 });
    v.setBackgroundColor("#06100c", 0);
    try { v.setViewStyle({ style: "outline", color: "black", width: 0.02 }); } catch (e) { /* старый WebGL */ }
    v.setHoverDuration(40);
    var start = function () { app.classList.add("b3-used"); };
    view.addEventListener("pointerdown", start, { passive: true });
    view.addEventListener("wheel", start, { passive: true });
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; spin(); }).observe(view);
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { v.resize(); v.render(); }, 120); });
    return true;
  }
  function spin() { if (!v) return; if (S.spin && visible) v.spin("y", 0.3); else v.spin(false); }

  function fetchText(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch(PDB + id + ".pdb").then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (t) { cache[id] = t; return t; });
  }

  function load(i, after) {
    var m = MOLS[i], tok = ++loadTok;
    $$(".b3-mol", tray).forEach(function (b, k) { b.classList.toggle("on", k === i); });
    var card = $$(".b3-mol", tray)[i];
    if (card && tray.scrollWidth > tray.clientWidth) tray.scrollTo({ left: card.offsetLeft - tray.clientWidth / 2 + card.offsetWidth / 2, behavior: REDUCE ? "auto" : "smooth" });
    if (cur === m && model) { if (after) after(); return; }
    loading.classList.add("on"); $("span", loading).textContent = "Загружаем структуру…";
    app.classList.add("b3-swap");
    var waitLib = function (n) {
      if (ensureViewer()) return Promise.resolve();
      if (n > 200) return Promise.reject(new Error("3Dmol"));
      return new Promise(function (res) { setTimeout(res, 50); }).then(function () { return waitLib(n + 1); });
    };
    Promise.all([fetchText(m.id), waitLib(0)]).then(function (r) {
      if (tok !== loadTok) return;
      cur = m;
      v.clear();
      model = v.addModel(r[0], "pdb");
      atoms = model.selectedAtoms({});
      prep();
      S.rep = m.rep; S.color = m.color; S.focus = -1;
      v.setHoverable({}, true, function (a) {
        hoverAtom = a;
        var t = atomText(a);
        tipEl.innerHTML = "<div>" + esc(t[0]) + "<small>" + esc(t[1]) + "</small></div>";
      }, function () { hoverAtom = null; tipEl.innerHTML = ""; });
      fillUI();
      if (after) after(); else { draw(); v.zoomTo(); if (m.rot) v.rotate(m.rot[0], m.rot[1]); v.zoom(m.zoom || 1.15); setSpots(curSpots()); v.render(); }
      spin();
      requestAnimationFrame(function () { app.classList.remove("b3-swap"); });
      loading.classList.remove("on");
      if (!seen[m.id]) { seen[m.id] = 1; store("b3-seen", seen); }
      markSeen();
    }).catch(function () {
      loading.classList.add("on");
      $("span", loading).textContent = "Не удалось загрузить модель. Проверьте подключение к интернету.";
      $("i", loading).style.display = "none";
    });
  }
  function markSeen() {
    var n = 0;
    $$(".b3-mol", tray).forEach(function (b, k) { var s = !!seen[MOLS[k].id]; b.classList.toggle("seen", s); n += s ? 1 : 0; });
    $(".b3-count").textContent = n + " из " + MOLS.length;
  }

  function fillUI() {
    var m = cur;
    app.style.setProperty("--b3-acc", m.acc);
    $(".b3-title").textContent = m.name;
    $(".b3-sub").textContent = m.sub;
    $(".b3-pdbid").textContent = m.af ? "AlphaFold · P04637" : "PDB " + m.id.toUpperCase();
    $(".b3-kind").textContent = m.kind;
    syncReps();
    colorsEl.innerHTML = m.colors.map(function (c) { return '<button type="button" data-c="' + c + '">' + CNAMES[c] + "</button>"; }).join("");
    $$("button", colorsEl).forEach(function (b) { b.addEventListener("click", function () { S.color = b.getAttribute("data-c"); S.focus = -1; syncChips(); draw(); setSpots(curSpots()); }); });
    focusEl.innerHTML = (m.focus || []).map(function (f, k) { return '<button type="button" data-f="' + k + '" style="--c:' + hex(f.c) + '"><i></i>' + esc(f.t) + "</button>"; }).join("");
    $$("button", focusEl).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = +b.getAttribute("data-f");
        S.focus = S.focus === k ? -1 : k;
        syncChips(); draw(); setSpots(curSpots());
        if (S.focus >= 0 && !REDUCE) { v.zoomTo(cur.focus[k].sel, 900); }
        else if (!REDUCE) { v.zoomTo({}, 700); }
      });
    });
    syncChips();
    info.classList.remove("in"); void info.offsetWidth; info.classList.add("in");
    info.innerHTML =
      "<div><h3>" + m.emoji + " " + esc(m.name) + "</h3><p>" + esc(m.what) + '</p><p class="b3-where">📍 ' + esc(m.where) + "</p></div>" +
      '<div class="b3-stats">' + m.stats.map(function (s) { return '<div class="b3-stat"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("") + "</div>" +
      '<div class="b3-fact">' + esc(m.fact) + "</div>" +
      '<div class="b3-links">Уроки: ' + m.lessons.map(function (l) { return '<a href="' + ROOT + l[0] + '/">' + esc(l[1]) + "</a>"; }).join("") + "</div>";
  }
  function syncReps() { $$(".b3-reps button").forEach(function (b) { var on = b.getAttribute("data-r") === S.rep; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
  function syncChips() {
    $$("button", colorsEl).forEach(function (b) { var on = S.focus < 0 && b.getAttribute("data-c") === S.color; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $$("button", focusEl).forEach(function (b) { var on = +b.getAttribute("data-f") === S.focus; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  }

  /* ---------- уровни структуры ---------- */
  function levelLegend() {
    var it = function (c, t) { return '<span><i style="--c:' + hex(c) + '"></i>' + esc(t) + "</span>"; };
    switch (S.level) {
      case 1: return Object.keys(HYD).map(function (k) { return it(HYD[k][0], HYD[k][1]); }).join("");
      case 2: return it(SS.h[0], "α-спираль") + it(SS.c[0], "петли");
      case 3: return '<span>N-конец <i class="b3-grad" style="--c:transparent"></i> C-конец</span>' + it(0xff3b3b, "гем");
      case 4: return it(0xff4d6d, "α-цепи") + it(0x38bdf8, "β-цепи") + it(0xff3b3b, "гемы");
    }
    return "";
  }
  function showLevel(n) {
    S.level = n;
    $$(".b3-steps button").forEach(function (b) { var k = +b.getAttribute("data-l"); b.classList.toggle("on", k === n); b.classList.toggle("done", k < n); b.setAttribute("aria-pressed", k === n); });
    var L0 = LEVELS[n - 1];
    $(".b3-ltext").innerHTML = "<h4>" + n + ". " + L0.t + "</h4><p>" + L0.txt + '</p><span class="b3-bond">Что удерживает: ' + L0.bond + "</span>";
    load(0, function () {
      var hyd = function (a) { return AA[a.resn] ? HYD[AA[a.resn][3]][0] : 0xc8d2dc; };
      var ssf = function (a) { return (SS[a.ss] || SS.c)[0]; };
      v.setStyle({}, {}); v.removeAllSurfaces();
      var A = { chain: "A" }, defs = [];
      if (n === 1) {
        v.setStyle({ chain: "A", hetflag: false }, { cartoon: { style: "trace", color: "#cbd5e1", thickness: 0.22 } });
        v.addStyle({ chain: "A", atom: "CA" }, { sphere: { colorfunc: hyd, radius: 1.25 } });
        defs = [[{ chain: "A", resi: 1, atom: "CA" }, "N-конец: Вал-1", 0x60a5fa], [{ chain: "A", resi: 141, atom: "CA" }, "C-конец: Арг-141", 0xff5c6c]];
      } else if (n === 2) {
        v.setStyle({ chain: "A", hetflag: false }, { cartoon: { colorfunc: ssf, thickness: 0.6 } });
        defs = [[{ chain: "A", resi: range(52, 71) }, "α-спираль (20 аминокислот)", SS.h[0]], [{ chain: "A", resi: range(43, 50) }, "петля", SS.c[0]]];
      } else if (n === 3) {
        var sp = function (a) { return spec(a.__t); };
        v.setStyle({ chain: "A", hetflag: false }, { cartoon: { colorfunc: sp, thickness: 0.6 } });
        v.setStyle({ chain: "A", resn: "HEM" }, { stick: { color: "#ff3b3b", radius: 0.32 } });
        v.addStyle({ chain: "A", elem: ["FE", "Fe"] }, { sphere: { color: "#ff7a1a", scale: 1 } });
        v.addSurface($3Dmol.SurfaceType.MS, { opacity: 0.22, color: "#d1fae5" }, { chain: "A", hetflag: false });
        defs = [[{ chain: "A", resn: "HEM" }, "Гем в «кармане» глобулы", 0xff3b3b]];
      } else {
        v.setStyle({ hetflag: false }, { cartoon: { colorfunc: function (a) { return chainCol(a); }, thickness: 0.55 } });
        v.setStyle({ resn: "HEM" }, { sphere: { color: "#ff3b3b", scale: 0.8 } });
        defs = [[{ chain: "A", resi: range(60, 80) }, "α1", 0xff4d6d], [{ chain: "B", resi: range(60, 80) }, "β1", 0x38bdf8], [{ chain: "C", resi: range(60, 80) }, "α2", 0xff8fa3], [{ chain: "D", resi: range(60, 80) }, "β2", 0x7dd3fc]];
      }
      v.render();
      v.zoomTo(n === 4 ? {} : A, REDUCE ? 0 : 900);
      renderLegend();
      setSpots(defs);
      seqEl.classList.toggle("on", n === 1);
      if (n === 1 && !seqEl.childNodes.length) buildSeq();
    });
  }
  function buildSeq() {
    var ca = v.selectedAtoms({ chain: "A", atom: "CA" });
    seqEl.innerHTML = ca.map(function (a, k) {
      var aa = AA[a.resn] || ["?", a.resn, a.resn, "p"];
      return '<span style="--c:' + hex(HYD[aa[3]][0]) + ";animation-delay:" + (REDUCE ? 0 : k * 6) + 'ms" data-k="' + k + '" title="' + aa[1] + "-" + a.resi + " · " + aa[2] + '">' + aa[0] + "</span>";
    }).join("");
    var marker = null;
    seqEl.addEventListener("mouseover", function (e) {
      var s = e.target.closest("span[data-k]"); if (!s) return;
      var a = ca[+s.getAttribute("data-k")];
      if (marker) { $$(".b3-seq span.on").forEach(function (x) { x.classList.remove("on"); }); }
      s.classList.add("on"); marker = a;
      var aa = AA[a.resn] || [a.resn, a.resn, a.resn, "p"];
      setSpots([[{ chain: "A", resi: a.resi, atom: "CA" }, aa[1] + "-" + a.resi + " · " + aa[2], HYD[aa[3]][0]]]);
    });
  }

  function setMode(mode) {
    if (S.mode === mode) return;
    S.mode = mode;
    app.classList.toggle("b3-lv", mode === "levels");
    $$(".b3-mode button").forEach(function (b) { var on = b.getAttribute("data-m") === mode; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    if (mode === "levels") showLevel(S.level || 1);
    else if (cur) { seqEl.classList.remove("on"); draw(); v.zoomTo({}, REDUCE ? 0 : 700); setSpots(curSpots()); }
  }

  /* ---------- управление ---------- */
  $$(".b3-mode button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-m")); }); });
  $$(".b3-steps button").forEach(function (b) { b.addEventListener("click", function () { showLevel(+b.getAttribute("data-l")); }); });
  $$(".b3-reps button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (S.mode === "levels") setMode("gallery");
      S.rep = b.getAttribute("data-r"); syncReps(); draw();
    });
  });
  $(".b3-spin").addEventListener("click", function () {
    S.spin = !S.spin; this.classList.toggle("on", S.spin); this.setAttribute("aria-pressed", S.spin); spin();
  });
  $(".b3-reset").addEventListener("click", function () {
    if (!v) return;
    v.zoomTo(S.mode === "levels" && S.level < 4 ? { chain: "A" } : {}, REDUCE ? 0 : 600);
  });
  $(".b3-zin").addEventListener("click", function () { if (v) v.zoom(1.3, REDUCE ? 0 : 300); });
  $(".b3-zout").addEventListener("click", function () { if (v) v.zoom(1 / 1.3, REDUCE ? 0 : 300); });
  $(".b3-lbl").addEventListener("change", function () { S.labels = this.checked; spotsEl.style.display = S.labels ? "" : "none"; });
  $(".b3-glow").addEventListener("change", function () { S.glow = this.checked; app.classList.toggle("b3-glowon", S.glow); });

  markSeen();
  load(0);
})();
