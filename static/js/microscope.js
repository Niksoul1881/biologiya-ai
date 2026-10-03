/* Виртуальный микроскоп: препараты, объективы, фокус, свет, подписи и задания «найди». */
(function () {
  "use strict";
  var app = document.getElementById("mk-app");
  if (!app) return;
  var IMG = app.getAttribute("data-img"), ROOT = app.getAttribute("data-root") || "/";
  var $ = function (s, el) { return (el || app).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || app).querySelectorAll(s)); };

  var C = "https://commons.wikimedia.org/wiki/File:";
  // координаты подписей и целей — в процентах ширины/высоты фото; r — радиус попадания в % ширины
  var SLIDES = [
    {
      id: "luk", name: "Кожица лука", sub: "Эпидермис чешуи репчатого лука", stain: "без окраски", bg: "#0a625e", um: 0.11,
      credit: ["loganrickert", "CC BY 2.0", "Onion_Epidermis_Cells_W.M._40x_-_109.jpg"],
      about: "Тонкая прозрачная плёнка с внутренней стороны мясистой чешуи лука — самый первый препарат школьного курса. Клетки вытянутые, плотно прилегают друг к другу и разделены прочными клеточными стенками. Хлоропластов нет: чешуя растёт под землёй, в темноте.",
      tip: "Почти весь объём клетки занимает вакуоль с клеточным соком, а цитоплазма прижата к стенкам тонким слоем. Без окраски ядро едва видно — на уроке препарат подкрашивают раствором йода, и ядра становятся жёлто-коричневыми.",
      lessons: [["organizmy/011-rastitelnaya-kletka-i-tkani-rasteniy", "Растительная клетка и ткани"], ["organizmy/003-uvelichitelnye-pribory-lupa-i-mikroskop", "Лупа и микроскоп"]],
      labels: [[41.5, 62, "Клеточная стенка"], [16, 47, "Стык трёх клеток"], [55, 66, "Вакуоль"], [79, 45, "Соседняя клетка"]],
      tasks: [
        { q: "Найди клеточную стенку — границу между двумя клетками", hint: "Это тёмные двойные линии, по которым клетки прилегают друг к другу.", label: "Клеточная стенка",
          spots: [[41.5, 62, 2.5], [43.5, 88, 2.5], [39.5, 42, 2.5], [62.5, 45, 2.5], [64, 70, 2.5], [79, 30, 2.5], [83, 60, 2.5], [18, 70, 2.5], [21, 15, 2.5], [31, 30, 2.5], [9, 42, 2.5]] },
        { q: "Найди место, где сходятся сразу три клетки", hint: "Ищи развилку стенок в форме буквы «Y».", label: "Стык трёх клеток",
          spots: [[16, 47, 3.5], [25, 27, 3.5], [40, 33, 3.5], [7.5, 38, 3.5], [76, 6, 3.5], [86, 74, 3.5], [65, 81, 3.5], [77, 91, 3.5]] }
      ]
    },
    {
      id: "mitoz", name: "Митоз в корешке лука", sub: "Давленый препарат кончика корня", stain: "ядерный краситель", bg: "#c9b1e2", um: 0.0508, start: [55, 45],
      credit: ["Doc. RNDr. Josef Reischig, CSc.", "CC BY-SA 3.0", "Mitosis_(261_13)_Pressed;_root_meristem_of_onion_(cells_in_prophase,_metaphase,_anaphase,_telophase).jpg"],
      about: "Кончик корня — зона деления: здесь клетки постоянно делятся митозом, поэтому на одном препарате видны все фазы. Большинство клеток в интерфазе — ядро круглое, хроматин равномерный. Делящиеся клетки выдают хромосомы: нити, пластинка или две группы.",
      tip: "Профаза — хромосомы клубком нитей. Метафаза — выстроились в пластинку по экватору. Анафаза — хроматиды расходятся к полюсам. Телофаза — два новых ядра рядом. Интерфаза длится дольше всех фаз — поэтому таких клеток больше всего.",
      lessons: [["obshchaya-biologiya/095-mitoz", "Митоз"], ["organizmy/012-koren-stroenie-vidy-kornevyh-sistem-funkcii", "Корень: строение"]],
      labels: [[37, 26, "Интерфаза"], [24, 26, "Профаза"], [13, 82, "Прометафаза"], [84, 32, "Метафаза"], [83, 57, "Анафаза"], [75, 43, "Телофаза"]],
      tasks: [
        { q: "Найди клетку в профазе", hint: "Ядро превратилось в клубок тонких нитей-хромосом, но они ещё не выстроились.", label: "Профаза", min: 1, spots: [[24, 26, 6]] },
        { q: "Найди метафазу", hint: "Хромосомы выстроились в одну пластинку посередине клетки.", label: "Метафаза", min: 1, spots: [[84, 32, 5]] },
        { q: "Найди анафазу", hint: "Две группы хромосом расходятся в разные стороны — к полюсам клетки.", label: "Анафаза", min: 1, spots: [[83, 57, 5.5]] },
        { q: "Найди телофазу", hint: "Два маленьких тёмных дочерних ядра рядом — клетка вот-вот разделится надвое.", label: "Телофаза", min: 1, spots: [[75, 43, 4.5]] }
      ]
    },
    {
      id: "krov", name: "Кровь человека", sub: "Мазок периферической крови", stain: "окраска по Май-Грюнвальду", bg: "#baa289", um: 0.0424, start: [50, 50],
      credit: ["Bondarev.gal", "CC BY 4.0", "Human_peripheral_blood_smear,_May-Grünwald_stain.jpg"],
      about: "Мазок крови: тонкий слой капли на стекле, окрашенный так, чтобы ядра стали фиолетовыми. Почти всё поле занимают эритроциты — двояковогнутые диски без ядра. Среди них редкие крупные лейкоциты с ядрами разной формы и крошечные тромбоциты.",
      tip: "Нейтрофил — ядро из 3–5 долек-сегментов. Эозинофил — двудольное ядро и крупная оранжево-красная зернистость. Лимфоцит — круглое ядро почти на всю клетку и тонкий ободок цитоплазмы. Эритроцитов в капле крови примерно в тысячу раз больше, чем лейкоцитов.",
      lessons: [["chelovek/063-krov-sostav-i-funkcii", "Кровь: состав и функции"], ["chelovek/054-tkani-cheloveka", "Ткани человека"]],
      labels: [[30, 15, "Эритроцит"], [9, 45, "Нейтрофил"], [54, 53, "Нейтрофил"], [74, 67, "Нейтрофил"], [52, 73, "Эозинофил"], [63, 23, "Лимфоцит"], [32, 89, "Тромбоциты"]],
      tasks: [
        { q: "Найди эритроцит", hint: "Их здесь большинство: розово-бежевые диски без ядра, светлее в центре.", label: "Эритроцит",
          spots: [[30, 15, 3], [21, 35, 3], [35, 55, 3], [85, 40, 3], [88, 10, 3], [42, 17, 3], [20, 70, 3], [82, 87, 3], [93, 60, 3], [44, 92, 3], [8, 12, 3], [71, 47, 3]] },
        { q: "Найди нейтрофил", hint: "Ядро разделено на несколько долек, соединённых перемычками.", label: "Нейтрофил", spots: [[9, 45, 6], [54, 53, 5.5], [74, 67, 6]] },
        { q: "Найди эозинофил", hint: "Цитоплазма забита оранжево-красными зёрнами, ядро из двух долей.", label: "Эозинофил", min: 1, spots: [[52, 73, 5.5]] },
        { q: "Найди лимфоцит", hint: "Маленькая клетка: круглое тёмное ядро и тонкий голубоватый ободок цитоплазмы.", label: "Лимфоцит", min: 1, spots: [[63, 23, 4]] },
        { q: "Найди тромбоциты", hint: "Самые мелкие фиолетовые комочки, часто лежат кучкой.", label: "Тромбоциты", min: 2, spots: [[32, 89, 3.5], [60.5, 42, 2], [56, 37, 2]] }
      ]
    },
    {
      id: "elodeya", name: "Лист элодеи", sub: "Верхушка листа водного растения", stain: "живой препарат", bg: "#101208", um: 0.21, start: [45, 45],
      credit: ["KarlGaff", "CC BY 4.0", "Canadian_Pond_Weed_Leaf_Tip.jpg"],
      about: "Элодея — водное растение, лист которого толщиной всего в два слоя клеток, поэтому его можно смотреть целиком, без разрезов. Каждая клетка набита зелёными хлоропластами — в них идёт фотосинтез. По краю листа торчат острые шипики.",
      tip: "В живой клетке элодеи хлоропласты движутся по кругу вместе с цитоплазмой — это называется круговорот цитоплазмы (циклоз). Под ярким светом движение ускоряется.",
      lessons: [["organizmy/014-list-stroenie-i-funkcii", "Лист: строение и функции"], ["organizmy/015-fotosintez-prostymi-slovami", "Фотосинтез"], ["obshchaya-biologiya/088-organoidy-kletki", "Органоиды клетки"]],
      labels: [[40, 60, "Хлоропласты"], [93, 79, "Шипик"], [22, 82, "Зубчик края"], [33, 33, "Средняя жилка"], [72, 43, "Край листа"]],
      tasks: [
        { q: "Найди хлоропласты", hint: "Зелёные зёрнышки внутри клеток — их тут тысячи.", label: "Хлоропласты", min: 1,
          poly: [[0, 3], [50, 0], [68, 35], [90, 74], [80, 78], [60, 75], [30, 80], [0, 84]] },
        { q: "Найди острый шипик на краю листа", hint: "Посмотри на верхушку листа и на его нижний край.", label: "Шипик", spots: [[93, 79, 4], [23, 82, 4]] }
      ]
    },
    {
      id: "ustica", name: "Устьица мяты", sub: "Нижняя кожица листа мяты", stain: "без окраски, ДИК-контраст", bg: "#aa889f", um: 0.108, start: [55, 45],
      credit: ["GrahamInHorsham", "CC BY 4.0", "Garden_mint_(Mentha_sp)_leaf_underside.jpg"],
      about: "Кожица с нижней стороны листа. Клетки кожицы с извилистыми стенками сцеплены, как пазл, а между ними разбросаны устьица — пары бобовидных замыкающих клеток с щелью посередине. Через устьица лист дышит и испаряет воду.",
      tip: "Замыкающие клетки, в отличие от остальных клеток кожицы, содержат хлоропласты. Когда они набирают воду, щель открывается. У большинства растений устьиц больше на нижней стороне листа — там меньше испарение.",
      lessons: [["organizmy/014-list-stroenie-i-funkcii", "Лист: строение и функции"], ["organizmy/011-rastitelnaya-kletka-i-tkani-rasteniy", "Ткани растений"]],
      labels: [[62, 42, "Устьице"], [47, 53, "Устьичная щель"], [75, 27, "Замыкающие клетки"], [27, 28, "Клетка кожицы"]],
      tasks: [
        { q: "Найди все три устьица в центре кожицы", hint: "Пара бобовидных клеток с узкой щелью между ними.", label: "Устьице", count: 3,
          spots: [[62, 42, 3.5], [47, 53, 3.5], [75, 27, 4], [13.5, 8, 4]] }
      ]
    },
    {
      id: "infuzoriya", name: "Инфузория-туфелька", sub: "Живые инфузории в капле воды", stain: "живой препарат", bg: "#fab920", um: 0.084, start: [35, 55],
      credit: ["MTadey", "CC BY 4.0", "Paramécium_caudátum.jpg"],
      about: "Одноклеточное животное размером около 0,2 мм — его едва видно глазом как белую точку. Тело покрыто тысячами ресничек: туфелька гребёт ими, как вёслами, и загоняет пищу в клеточный рот. Внутри видны пищеварительные вакуоли.",
      tip: "У туфельки два ядра: большое управляет жизнью клетки, малое нужно для полового процесса. Сократительные вакуоли у концов тела откачивают лишнюю воду каждые 10–20 секунд.",
      lessons: [["zhivotnye/032-odnokletochnye-zhivotnye-prosteyshie", "Одноклеточные животные"]],
      labels: [[13, 27, "Реснички"], [14, 41, "Пищеварительные вакуоли"], [42, 57, "Клеточный рот"], [56, 89, "Сократительная вакуоль"], [22.5, 70, "Оболочка (пелликула)"]],
      tasks: [
        { q: "Найди пищеварительные вакуоли", hint: "Тёмные комочки переваренной пищи у переднего конца.", label: "Пищеварительные вакуоли", spots: [[14, 41, 7]] },
        { q: "Найди реснички", hint: "Тонкая бахрома вдоль верхнего края туфельки. Нужен объектив ×10.", label: "Реснички", min: 1, spots: [[13, 27, 4], [20, 29.5, 4], [5, 29, 4], [27, 33, 4]] },
        { q: "Найди сократительную вакуоль", hint: "Круглый прозрачный пузырёк у заднего конца тела.", label: "Сократительная вакуоль", min: 1, spots: [[56, 89, 3.5]] }
      ]
    },
    {
      id: "shcheka", name: "Клетки щеки", sub: "Соскоб с внутренней стороны щеки", stain: "метиленовый синий", bg: "#95bce0", um: 0.167, start: [45, 45],
      credit: ["Fritzmann2002", "CC BY-SA 4.0", "Human_Cheek_Cells_(Methylene_Blue_Stain).jpg"],
      about: "Плоские клетки эпителия, выстилающего рот изнутри. Их соскребают чистой ложечкой и подкрашивают метиленовым синим. В отличие от растительных, у клеток человека нет клеточной стенки — только тонкая мембрана, поэтому форма у них неровная.",
      tip: "В середине каждой клетки видно тёмное овальное ядро. Клетки плоские, как чешуйки, и постоянно слущиваются — за сутки их в слюну попадают сотни тысяч.",
      lessons: [["zhivotnye/031-zhivotnaya-kletka-i-tkani-zhivotnyh", "Животная клетка и ткани"], ["obshchaya-biologiya/087-stroenie-kletki-membrana-i-citoplazma", "Мембрана и цитоплазма"]],
      labels: [[13, 21, "Ядро"], [32, 46, "Ядро"], [23, 22, "Цитоплазма"], [20, 30.5, "Клеточная мембрана"]],
      tasks: [
        { q: "Найди ядро клетки", hint: "Небольшое тёмно-синее овальное пятно внутри клетки.", label: "Ядро", min: 1, spots: [[13, 21, 3], [32, 46, 3]] },
        { q: "Найди край клетки — клеточную мембрану", hint: "Тонкая граница между голубой клеткой и светлым фоном.", label: "Мембрана",
          spots: [[20, 30.5, 3], [28, 18, 3], [2, 15, 3], [21, 39, 3], [50, 76, 3], [30, 72, 3], [69, 80, 3], [90, 63, 3]] }
      ]
    }
  ];

  var OBJ = [{ x: 4, mag: 40, z: 1, color: "#ef4444" }, { x: 10, mag: 100, z: 2.5, color: "#facc15" }, { x: 40, mag: 400, z: 5.5, color: "#38bdf8" }];
  var SENS = [0.32, 0.55, 0.95], PARFOCAL = [0, 2.2, -1.6];

  // ---------- DOM ----------
  var view = $(".mk-view"), cv = $(".mk-canvas"), ctx = cv.getContext("2d");
  var lblLayer = $(".mk-labels"), fxLayer = $(".mk-fx"), arrow = $(".mk-arrow");
  var lightBtn = $(".mk-lightup"), loader = $(".mk-loading"), focusHint = $(".mk-focushint");
  var msg = $(".mk-msg"), scaleBar = $(".mk-scale i"), scaleTxt = $(".mk-scale b");

  // ---------- состояние ----------
  var st = {
    i: -1, slide: null, img: null, w: 1, h: 1, D: 400,
    obj: 0, s: 1, sFrom: 1, sTo: 1, tA: 0, tDur: 0,
    cx: 0, cy: 0, vx: 0, vy: 0,
    f: 50, f0: 50, light: 0, labels: true, mode: "study",
    task: 0, found: [], hits: [], hintOn: false, misses: 0
  };
  var done = {};
  try { done = JSON.parse(localStorage.getItem("mk-done") || "{}") || {}; } catch (e) { done = {}; }
  function saveDone() { try { localStorage.setItem("mk-done", JSON.stringify(done)); } catch (e) {} }

  // ---------- звук ----------
  var actx = null;
  function sound(kind) {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, g = actx.createGain(), o = actx.createOscillator();
      o.connect(g); g.connect(actx.destination);
      if (kind === "click") { o.type = "square"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.05); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); o.start(t); o.stop(t + 0.08); }
      else if (kind === "ok") { o.type = "sine"; o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + 0.09); g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.start(t); o.stop(t + 0.36); }
      else { o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.15); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.start(t); o.stop(t + 0.2); }
    } catch (e) {}
  }

  // ---------- геометрия ----------
  function baseScale() { return st.D / Math.min(st.w, st.h); }
  // ×40 — препарат целиком, ×400 — родное разрешение фото, ×100 — между ними
  function scaleFor(o) { var b = baseScale(), top = Math.max(b * 1.6, Math.min(1, b * 2.6)); return o === 0 ? b : o === 1 ? Math.sqrt(b * top) : top; }
  function toScreen(px, py) { return [st.D / 2 + (px - st.cx) * st.s, st.D / 2 + (py - st.cy) * st.s]; }
  function toImage(sx, sy) { return [st.cx + (sx - st.D / 2) / st.s, st.cy + (sy - st.D / 2) / st.s]; }
  function clampC() { st.cx = Math.max(0, Math.min(st.w, st.cx)); st.cy = Math.max(0, Math.min(st.h, st.cy)); }
  function blurPx() { return Math.min(16, Math.abs(st.f - st.f0 - PARFOCAL[st.obj]) * SENS[st.obj]); }

  function resize() {
    var r = view.getBoundingClientRect(), D = Math.max(200, Math.round(r.width));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (D !== st.D || cv.width !== Math.round(D * dpr)) {
      var k = st.D ? D / st.D : 1;
      st.D = D; cv.width = Math.round(D * dpr); cv.height = Math.round(D * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (st.img) { st.s *= k; st.sTo = scaleFor(st.obj); st.s = st.sTo; }
      dirty = true;
    }
  }

  // ---------- рендер ----------
  var dirty = true, raf = 0;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function frame(now) {
    raf = 0;
    var anim = false;
    if (st.tDur) {
      var t = Math.min(1, (now - st.tA) / st.tDur);
      st.s = st.sFrom + (st.sTo - st.sFrom) * ease(t);
      if (t >= 1) st.tDur = 0; else anim = true;
      dirty = true;
    }
    if (!drag && (Math.abs(st.vx) > 0.05 || Math.abs(st.vy) > 0.05)) {
      st.cx -= st.vx / st.s; st.cy -= st.vy / st.s; st.vx *= 0.9; st.vy *= 0.9; clampC(); anim = true; dirty = true;
    }
    if (dirty) { draw(); dirty = false; }
    if (anim) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function draw() {
    var D = st.D, sl = st.slide;
    ctx.fillStyle = sl ? sl.bg : "#000"; ctx.fillRect(0, 0, D, D);
    if (st.img) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      var p = toScreen(0, 0);
      ctx.drawImage(st.img, p[0], p[1], st.w * st.s, st.h * st.s);
    }
    // оптика: размытие, свет
    var b = blurPx() + (st.tDur ? 3 : 0), L = st.light;
    var br = L <= 0 ? 0.03 : L <= 55 ? 0.06 + (L / 55) * 0.94 : 1 + ((L - 55) / 45) * 0.75;
    br *= [1, 0.93, 0.82][st.obj];
    var ct = L > 55 ? 1 - ((L - 55) / 45) * 0.4 : 1;
    cv.style.filter = "blur(" + b.toFixed(2) + "px) brightness(" + br.toFixed(3) + ") contrast(" + ct.toFixed(3) + ")";
    app.style.setProperty("--mk-light", (L / 100).toFixed(2));
    var sharp = Math.max(0, 1 - blurPx() / 8);
    $(".mk-sharp i").style.width = (sharp * 100).toFixed(0) + "%";
    app.classList.toggle("mk-infocus", blurPx() < 0.9);
    placeLabels(); placeArrow(); updateScale();
  }

  function updateScale() {
    if (!st.slide) return;
    var umPx = st.slide.um / st.s, nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], pick = nice[0];
    for (var i = 0; i < nice.length; i++) { if (nice[i] / umPx <= st.D * 0.24) pick = nice[i]; }
    scaleBar.style.width = (pick / umPx).toFixed(1) + "px";
    scaleTxt.textContent = pick >= 1000 ? pick / 1000 + " мм" : pick + " мкм";
    var fov = st.D * umPx;
    $(".mk-fov").textContent = fov >= 1000 ? (fov / 1000).toFixed(1).replace(".", ",") + " мм" : Math.round(fov) + " мкм";
  }

  // ---------- подписи ----------
  var labelEls = [];
  function buildLabels() {
    lblLayer.innerHTML = ""; labelEls = [];
    st.slide.labels.forEach(function (l) {
      var el = document.createElement("div");
      el.className = "mk-label";
      el.innerHTML = '<span class="mk-dot"></span><span class="mk-pill">' + l[2] + "</span>";
      lblLayer.appendChild(el);
      labelEls.push({ el: el, x: l[0], y: l[1], text: l[2] });
    });
  }
  function labelVisible(L) {
    if (st.mode === "study") return st.labels;
    return st.found.some(function (f) { return f === L.text; });
  }
  function placeLabels() {
    var R = st.D / 2;
    labelEls.forEach(function (L) {
      var p = toScreen(L.x / 100 * st.w, L.y / 100 * st.h), dx = p[0] - R, dy = p[1] - R;
      var inside = dx * dx + dy * dy < (R * 0.86) * (R * 0.86);
      var show = inside && labelVisible(L) && st.light > 8;
      L.el.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px)";
      L.el.classList.toggle("on", show);
      L.el.classList.toggle("left", p[0] > R * 1.02);
    });
  }

  // ---------- подсказка-стрелка ----------
  function nearestTarget() {
    var T = curTask(); if (!T) return null;
    var pts = T.spots ? T.spots.filter(function (s, k) { return st.hits.indexOf(k) < 0; }) : [centroid(T.poly)];
    var best = null, bd = 1e18;
    pts.forEach(function (s) {
      var x = s[0] / 100 * st.w, y = s[1] / 100 * st.h, d = (x - st.cx) * (x - st.cx) + (y - st.cy) * (y - st.cy);
      if (d < bd) { bd = d; best = [x, y]; }
    });
    return best;
  }
  function centroid(P) { var x = 0, y = 0; P.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / P.length, y / P.length]; }
  function placeArrow() {
    if (!st.hintOn || st.mode !== "tasks") { arrow.classList.remove("on"); return; }
    var t = nearestTarget(); if (!t) { arrow.classList.remove("on"); return; }
    var p = toScreen(t[0], t[1]), R = st.D / 2, dx = p[0] - R, dy = p[1] - R, d = Math.sqrt(dx * dx + dy * dy);
    if (d < R * 0.7) {
      arrow.classList.add("on", "near");
      arrow.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px)";
    } else {
      var a = Math.atan2(dy, dx), rr = R * 0.8;
      arrow.classList.add("on"); arrow.classList.remove("near");
      arrow.style.transform = "translate(" + (R + Math.cos(a) * rr).toFixed(1) + "px," + (R + Math.sin(a) * rr).toFixed(1) + "px) rotate(" + (a * 180 / Math.PI).toFixed(1) + "deg)";
    }
  }

  // ---------- препараты ----------
  function loadSlide(i) {
    if (i === st.i) return;
    var sl = SLIDES[i];
    st.i = i; st.slide = sl;
    $$(".mk-slide").forEach(function (b, k) { b.classList.toggle("on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    app.style.setProperty("--mk-tint", sl.bg);
    app.classList.add("mk-swap");
    loader.classList.add("on");
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      st.img = img; st.w = img.naturalWidth; st.h = img.naturalHeight;
      var c = sl.start || [50, 50];
      st.cx = c[0] / 100 * st.w; st.cy = c[1] / 100 * st.h; st.vx = st.vy = 0;
      setObj(0, true);
      st.f0 = 35 + Math.random() * 30;
      st.f = st.f0 + (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 8);
      syncFocus();
      buildLabels(); resetTasks(); renderInfo();
      loader.classList.remove("on");
      setTimeout(function () { app.classList.remove("mk-swap"); }, 60);
      focusNag();
      dirty = true; kick();
    };
    img.onerror = function () { loader.textContent = "Не удалось загрузить препарат"; };
    img.src = IMG + sl.id + ".webp";
  }

  function renderInfo() {
    var sl = st.slide;
    $(".mk-title").textContent = sl.name;
    $(".mk-sub").textContent = sl.sub + " · " + sl.stain;
    $(".mk-about").innerHTML = "<p>" + sl.about + "</p><p class=\"mk-tip\">💡 " + sl.tip + "</p>" +
      '<p class="mk-links">Теория: ' + sl.lessons.map(function (l) { return '<a href="' + ROOT + l[0] + '/">' + l[1] + "</a>"; }).join(" · ") + "</p>" +
      '<p class="mk-credit">Фото: ' + sl.credit[0] + ", " + sl.credit[1] + ', <a href="' + C + sl.credit[2] + '" target="_blank" rel="noopener">Wikimedia Commons</a></p>';
  }

  // ---------- объективы ----------
  function setObj(o, instant) {
    var prev = st.obj;
    st.obj = o;
    $$(".mk-obj").forEach(function (b, k) { b.classList.toggle("on", k === o); b.setAttribute("aria-pressed", k === o ? "true" : "false"); });
    $(".mk-mag").textContent = "×" + OBJ[o].mag;
    $(".mk-magobj").textContent = "объектив ×" + OBJ[o].x + " · окуляр ×10";
    var turret = app.querySelector(".mk-turret");
    if (turret) turret.style.transform = "rotate(" + (-(o - 1) * 34) + "deg)";
    var to = scaleFor(o);
    if (instant || !st.img) { st.s = st.sTo = to; st.tDur = 0; }
    else { st.sFrom = st.s; st.sTo = to; st.tA = performance.now(); st.tDur = 520; if (prev !== o) sound("click"); }
    dirty = true; kick(); focusNag();
  }

  // ---------- фокус и свет ----------
  function syncFocus() {
    var deg = (st.f * 7.2) % 360;
    $$(".mk-knob-rot").forEach(function (k) { k.style.transform = "rotate(" + deg + "deg)"; });
    $$(".mk-wheel").forEach(function (w) { w.style.backgroundPositionX = (st.f * (w.getAttribute("data-k") === "1" ? 6 : 60)).toFixed(1) + "px"; });
    dirty = true; kick();
  }
  function nudgeFocus(d) { st.f = Math.max(0, Math.min(100, st.f + d)); syncFocus(); focusNag(); }
  var nagT = 0;
  function focusNag() {
    clearTimeout(nagT); focusHint.classList.remove("on");
    nagT = setTimeout(function () { if (blurPx() > 2.5 && st.light > 8) focusHint.classList.add("on"); }, 2200);
  }
  function setLight(v) {
    st.light = v; $(".mk-light").value = v;
    lightBtn.classList.toggle("on", v <= 0);
    dirty = true; kick(); focusNag();
  }

  // ---------- задания ----------
  function curTask() { return st.mode === "tasks" ? st.slide.tasks[st.task] : null; }
  function resetTasks() { st.task = 0; st.found = []; st.hits = []; st.hintOn = false; st.misses = 0; renderTask(); }
  function renderTask() {
    var sl = st.slide, box = $(".mk-task"), T = sl.tasks[st.task];
    var dots = sl.tasks.map(function (t, k) { return '<i class="' + (k < st.task ? "ok" : k === st.task ? "cur" : "") + '"></i>'; }).join("");
    if (st.task >= sl.tasks.length) {
      box.innerHTML = '<div class="mk-dots">' + dots + '</div><div class="mk-q">Препарат изучен! 🎉</div><p class="mk-h">Всё найдено. Возьми следующий препарат из коробки — или включи подписи и рассмотри ещё раз.</p><button type="button" class="mk-btn mk-again">Пройти заново</button>';
      $(".mk-again").onclick = function () { resetTasks(); dirty = true; kick(); };
      return;
    }
    var need = T.count ? " (" + st.hits.length + " из " + T.count + ")" : "";
    box.innerHTML = '<div class="mk-dots">' + dots + '</div><div class="mk-q">' + T.q + need + "</div>" +
      (T.min ? '<p class="mk-h mk-need">Нужен объектив ×' + OBJ[T.min].x + " (увеличение ×" + OBJ[T.min].mag + ")</p>" : "") +
      '<p class="mk-h mk-hinttxt"' + (st.hintOn ? "" : " hidden") + ">" + T.hint + "</p>" +
      '<div class="mk-row"><button type="button" class="mk-btn mk-hint">Подсказка</button><button type="button" class="mk-btn mk-skip">Пропустить</button></div>';
    $(".mk-hint").onclick = function () { st.hintOn = true; $(".mk-hinttxt").hidden = false; dirty = true; kick(); };
    $(".mk-skip").onclick = function () { nextTask(); };
  }
  function nextTask() {
    st.task++; st.hits = []; st.hintOn = false; st.misses = 0;
    if (st.task >= st.slide.tasks.length) { done[st.slide.id] = 1; saveDone(); markDone(); celebrate(); }
    renderTask(); dirty = true; kick();
  }
  function inPoly(x, y, P) {
    var c = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c;
    }
    return c;
  }
  function say(t, cls) { msg.textContent = t; msg.className = "mk-msg on " + (cls || ""); clearTimeout(say.t); say.t = setTimeout(function () { msg.classList.remove("on"); }, 2600); }
  function ripple(x, y, cls) {
    var r = document.createElement("span"); r.className = "mk-ripple " + cls;
    r.style.left = x + "px"; r.style.top = y + "px"; fxLayer.appendChild(r);
    setTimeout(function () { r.remove(); }, 900);
  }
  function tryFind(sx, sy) {
    var T = curTask(); if (!T) return;
    if (st.light <= 8) { say("Сначала включи подсветку 💡", "bad"); return; }
    var p = toImage(sx, sy), x = p[0] / st.w * 100, y = p[1] / st.h * 100;
    var hit = -1;
    if (T.poly) { if (inPoly(x, y, T.poly)) hit = 0; }
    else {
      var asp = st.h / st.w;
      T.spots.forEach(function (s, k) {
        var dx = x - s[0], dy = (y - s[1]) * asp;
        if (hit < 0 && dx * dx + dy * dy <= s[2] * s[2]) hit = k;
      });
    }
    if (hit < 0) {
      st.misses++; ripple(sx, sy, "bad"); sound("bad");
      say(st.misses >= 3 && !st.hintOn ? "Мимо. Нажми «Подсказка» — покажу направление" : "Мимо, это не то", "bad");
      return;
    }
    if (T.min && st.obj < T.min) { ripple(sx, sy, "warn"); say("Похоже, но так не разглядеть — переключи на ×" + OBJ[T.min].x, "warn"); return; }
    if (blurPx() > 3) { ripple(sx, sy, "warn"); say("Сначала наведи резкость", "warn"); return; }
    if (T.spots && st.hits.indexOf(hit) >= 0) { say("Это уже найдено — ищи другое", "warn"); return; }
    ripple(sx, sy, "ok"); sound("ok");
    if (T.spots) st.hits.push(hit);
    if (st.found.indexOf(T.label) < 0) st.found.push(T.label);
    if (T.count && st.hits.length < T.count) { say("Есть! Осталось " + (T.count - st.hits.length), "ok"); renderTask(); dirty = true; kick(); return; }
    say("Верно: " + T.label.toLowerCase() + "!", "ok");
    nextTask();
  }
  function celebrate() {
    app.classList.add("mk-win"); setTimeout(function () { app.classList.remove("mk-win"); }, 1600);
    for (var k = 0; k < 26; k++) {
      var c = document.createElement("span"); c.className = "mk-spark";
      var a = Math.random() * Math.PI * 2, r = st.D * (0.25 + Math.random() * 0.3);
      c.style.left = st.D / 2 + "px"; c.style.top = st.D / 2 + "px";
      c.style.setProperty("--dx", (Math.cos(a) * r).toFixed(0) + "px"); c.style.setProperty("--dy", (Math.sin(a) * r).toFixed(0) + "px");
      c.style.animationDelay = (Math.random() * 0.15).toFixed(2) + "s";
      fxLayer.appendChild(c); setTimeout(function (el) { return function () { el.remove(); }; }(c), 1400);
    }
  }
  function markDone() {
    var n = 0;
    $$(".mk-slide").forEach(function (b, k) { var d = !!done[SLIDES[k].id]; b.classList.toggle("done", d); if (d) n++; });
    $(".mk-count").textContent = n + " из " + SLIDES.length;
  }

  function setMode(m) {
    st.mode = m;
    $$(".mk-mode button").forEach(function (b) { var on = b.getAttribute("data-m") === m; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    app.classList.toggle("mk-tasks", m === "tasks");
    if (m === "tasks") renderTask();
    dirty = true; kick();
  }

  // ---------- ввод: столик ----------
  var drag = null;
  view.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    view.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false };
    st.vx = st.vy = 0;
  });
  view.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(1, now - drag.t);
    if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 6) drag.moved = true;
    st.cx -= dx / st.s; st.cy -= dy / st.s; clampC();
    st.vx = dx * 16 / dt; st.vy = dy * 16 / dt;
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
    dirty = true; kick();
  });
  function endDrag(e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (performance.now() - d.t > 80) { st.vx = st.vy = 0; }
    if (!d.moved) {
      st.vx = st.vy = 0;
      var r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      if (st.mode === "tasks") tryFind(sx, sy);
    }
    kick();
  }
  view.addEventListener("pointerup", endDrag);
  view.addEventListener("pointercancel", function () { drag = null; });
  view.addEventListener("wheel", function (e) { e.preventDefault(); nudgeFocus(-e.deltaY * 0.018); }, { passive: false });
  view.addEventListener("keydown", function (e) {
    var step = 60 / st.s, k = e.key;
    if (k === "ArrowLeft") st.cx -= step; else if (k === "ArrowRight") st.cx += step;
    else if (k === "ArrowUp") st.cy -= step; else if (k === "ArrowDown") st.cy += step;
    else if (k === "1" || k === "2" || k === "3") { setObj(+k - 1); e.preventDefault(); return; }
    else if (k === "PageUp" || k === "+" || k === "=") nudgeFocus(0.6);
    else if (k === "PageDown" || k === "-") nudgeFocus(-0.6);
    else return;
    e.preventDefault(); clampC(); dirty = true; kick();
  });

  // ---------- ввод: винты фокуса ----------
  $$(".mk-wheel").forEach(function (w) {
    var k = +w.getAttribute("data-k"), last = null;
    w.addEventListener("pointerdown", function (e) { w.setPointerCapture(e.pointerId); last = e.clientX; w.classList.add("grab"); });
    w.addEventListener("pointermove", function (e) { if (last === null) return; nudgeFocus((e.clientX - last) * 0.09 * k); last = e.clientX; });
    w.addEventListener("pointerup", function () { last = null; w.classList.remove("grab"); });
    w.addEventListener("pointercancel", function () { last = null; w.classList.remove("grab"); });
    w.addEventListener("wheel", function (e) { e.preventDefault(); nudgeFocus(-e.deltaY * 0.02 * k); }, { passive: false });
    w.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { nudgeFocus(1.2 * k); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { nudgeFocus(-1.2 * k); e.preventDefault(); }
    });
  });
  // крупный винт на рисунке микроскопа
  var knob = app.querySelector(".mk-knob");
  if (knob) {
    var ky = null;
    knob.addEventListener("pointerdown", function (e) { knob.setPointerCapture(e.pointerId); ky = e.clientY; });
    knob.addEventListener("pointermove", function (e) { if (ky === null) return; nudgeFocus((ky - e.clientY) * 0.12); ky = e.clientY; });
    knob.addEventListener("pointerup", function () { ky = null; });
    knob.addEventListener("wheel", function (e) { e.preventDefault(); nudgeFocus(-e.deltaY * 0.02); }, { passive: false });
  }

  // ---------- кнопки ----------
  $$(".mk-obj").forEach(function (b, k) { b.addEventListener("click", function () { setObj(k); }); });
  $$("[data-objsvg]").forEach(function (g) { g.addEventListener("click", function () { setObj(+g.getAttribute("data-objsvg")); }); });
  $(".mk-light").addEventListener("input", function (e) { setLight(+e.target.value); });
  lightBtn.addEventListener("click", function () {
    var v = 0, t0 = performance.now();
    (function up(now) { v = Math.min(55, (now - t0) / 9); setLight(Math.round(v)); if (v < 55) requestAnimationFrame(up); })(t0);
  });
  var lamp = app.querySelector(".mk-lamp");
  if (lamp) lamp.addEventListener("click", function () { setLight(st.light > 0 ? 0 : 55); });
  $(".mk-lbl").addEventListener("change", function (e) { st.labels = e.target.checked; dirty = true; kick(); });
  $$(".mk-mode button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-m")); }); });

  // коробка препаратов
  var tray = $(".mk-tray");
  SLIDES.forEach(function (sl, k) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "mk-slide"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span class="mk-glass"><span class="mk-tag">' + sl.name + '</span><span class="mk-cover" style="background-image:url(' + IMG + sl.id + '-mini.webp)"></span></span><span class="mk-check" aria-hidden="true">✓</span>';
    b.addEventListener("click", function () { loadSlide(k); view.focus({ preventScroll: true }); });
    tray.appendChild(b);
  });

  window.addEventListener("resize", function () { resize(); kick(); });
  if (window.ResizeObserver) new ResizeObserver(function () { resize(); kick(); }).observe(view);
  resize();
  markDone();
  setLight(0);
  var h = (location.hash || "").slice(1), start = 0;
  SLIDES.forEach(function (sl, k) { if (sl.id === h) start = k; });
  loadSlide(start);
})();
