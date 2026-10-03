/* ДНК → иРНК → тРНК → белок: задача 27 ЕГЭ по шагам. */
(function () {
  "use strict";
  var app = document.getElementById("dna-app");
  if (!app) return;
  var $ = function (id) { return document.getElementById(id); };

  // стандартный генетический код (по иРНК)
  var CODE = {};
  var B = "UCAG", AA = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
  for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) for (var k = 0; k < 4; k++)
    CODE[B[i] + B[j] + B[k]] = AA[16 * i + 4 * j + k];
  var NAME = {
    F: ["Фен", "фенилаланин"], L: ["Лей", "лейцин"], S: ["Сер", "серин"], Y: ["Тир", "тирозин"],
    C: ["Цис", "цистеин"], W: ["Три", "триптофан"], P: ["Про", "пролин"], H: ["Гис", "гистидин"],
    Q: ["Глн", "глутамин"], R: ["Арг", "аргинин"], I: ["Иле", "изолейцин"], M: ["Мет", "метионин"],
    T: ["Тре", "треонин"], N: ["Асн", "аспарагин"], K: ["Лиз", "лизин"], V: ["Вал", "валин"],
    A: ["Ала", "аланин"], D: ["Асп", "аспарагиновая кислота"], E: ["Глу", "глутаминовая кислота"],
    G: ["Гли", "глицин"], "*": ["стоп", "стоп-кодон"]
  };
  var DNA_PAIR = { A: "T", T: "A", G: "C", C: "G" };
  var RNA_FROM_TEMPLATE = { A: "U", T: "A", G: "C", C: "G" };
  var RNA_PAIR = { A: "U", U: "A", G: "C", C: "G" };
  var CYR = { "А": "A", "Т": "T", "Г": "G", "Ц": "C", "У": "U" };

  function norm(raw) {
    var s = (raw || "").toUpperCase().replace(/[АТГЦУ]/g, function (c) { return CYR[c]; });
    return s.replace(/[0-9'′’`"\s\-–—.,;:|]/g, "");
  }
  function triplets(s) { var out = []; for (var i = 0; i + 3 <= s.length; i += 3) out.push(s.slice(i, i + 3)); return out; }
  function map(s, t) { return s.split("").map(function (c) { return t[c]; }).join(""); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  var RU = { A: "А", T: "Т", G: "Г", C: "Ц", U: "У" };
  function ru(s) { return String(s).replace(/[ATGCU]/g, function (c) { return RU[c]; }); }
  function fmt(s) { return ru(triplets(s).join(" ") + (s.length % 3 ? " " + s.slice(s.length - s.length % 3) : "")); }
  function strand(label, s, cls, ends) {
    return '<div class="dna-row ' + (cls || "") + '"><span class="dna-lbl">' + label + "</span><code>" +
      (ends ? ends[0] + " " : "") + fmt(s) + (ends ? " " + ends[1] : "") + "</code></div>";
  }

  function solve() {
    var out = $("dna-result"), mode = $("dna-mode").value, raw = $("dna-input").value, note = "";
    var s = norm(raw);
    // концы 5′/3′ в записи матричной цепи определяют направление
    var lead = (raw.match(/^\s*([35])\s*['′’`]/) || [])[1];
    if (lead && (mode === "template" || mode === "template53")) {
      var want = lead === "5" ? "template53" : "template";
      if (want !== mode) { mode = want; $("dna-mode").value = want; note = "Направление цепи определено по концу " + lead + "′ в записи."; }
    }
    if (!s) { out.innerHTML = '<div class="dna-error">Вставьте последовательность: например ТАЦГГАТЦТ или AUGCCUAGA</div>'; return; }
    var isRna = mode === "rna";
    var alphabet = isRna ? /^[AUGC]+$/ : /^[ATGC]+$/;
    if (!alphabet.test(s)) {
      var bad = s.replace(isRna ? /[AUGC]/g : /[ATGC]/g, "");
      out.innerHTML = '<div class="dna-error">В ' + (isRna ? "иРНК буквы A, U, G, C" : "ДНК буквы A, T, G, C") +
        " (можно русскими А, Т, Г, Ц" + (isRna ? ", У" : "") + "). Лишние символы: <b>" + esc(ru(bad.slice(0, 10))) + "</b>" +
        (!isRna && /U/.test(s) ? " — урацил (U) бывает только в РНК: переключите тип на «иРНК»." : "") +
        (isRna && /T/.test(s) ? " — тимин (T) бывает только в ДНК: переключите тип на ДНК." : "") + "</div>";
      return;
    }
    var template, coding, mrna, steps = [];
    var rev = function (x) { return x.split("").reverse().join(""); };
    if (mode === "template53") {
      // матричная цепь записана 5′→3′: иРНК антипараллельна, читаем её с другого конца
      var given = s;
      template = rev(s); coding = map(template, DNA_PAIR); mrna = map(template, RNA_FROM_TEMPLATE);
      steps.push("Дана <b>матричная цепь ДНК, записанная 5′→3′</b>: " + fmt(given) + ". иРНК синтезируется антипараллельно — от 5′ к 3′ по матрице, которая читается 3′→5′. Поэтому сначала разворачиваем матричную цепь: 3′- " + fmt(template) + " -5′.");
      steps.push("Строим иРНК по принципу комплементарности: А → У, Т → А, Г → Ц, Ц → Г (в РНК вместо тимина — урацил). Получаем 5′- " + fmt(mrna) + " -3′.");
    } else if (mode === "template") {
      template = s; coding = map(s, DNA_PAIR); mrna = map(s, RNA_FROM_TEMPLATE);
      steps.push("Дана <b>матричная (транскрибируемая) цепь ДНК</b>, записанная 3′→5′. По ней по принципу комплементарности строится иРНК 5′→3′: А → У, Т → А, Г → Ц, Ц → Г (в РНК вместо тимина — урацил).");
    } else if (mode === "coding") {
      coding = s; template = map(s, DNA_PAIR); mrna = s.replace(/T/g, "U");
      steps.push("Дана <b>смысловая (кодирующая) цепь ДНК</b>. Матричной будет комплементарная ей цепь: " + fmt(template) + ". иРНК строится по матричной цепи и поэтому совпадает со смысловой, только Т заменяется на У.");
    } else {
      mrna = s; template = map(s, { A: "T", U: "A", G: "C", C: "G" }); coding = s.replace(/U/g, "T");
      steps.push("Дана <b>иРНК</b>. Участок ДНК, с которого она переписана: матричная цепь комплементарна иРНК (" + fmt(template) + "), смысловая совпадает с иРНК с заменой У на Т (" + fmt(coding) + ").");
    }
    var cod = triplets(mrna), rest = mrna.length % 3;
    var trna = cod.map(function (c) { return map(c, RNA_PAIR); });
    var aas = cod.map(function (c) { return CODE[c]; });
    var stopAt = aas.indexOf("*");
    steps.push("Делим иРНК на <b>кодоны</b> — тройки нуклеотидов подряд, без пропусков и перекрытий: " + ru(cod.join(" ")) + (rest ? " (последние " + rest + " нуклеотида не образуют полный кодон)" : "") + ".");
    var rev3 = trna.map(function (a) { return a.split("").reverse().join(""); });
    steps.push("<b>Антикодоны тРНК</b> комплементарны кодонам иРНК и антипараллельны им. Записанные под кодонами (3′→5′): " + ru(trna.join(", ")) +
      ". Если в задаче просят записать антикодоны от 5′ к 3′, читаем каждый в обратном порядке: " + ru(rev3.join(", ")) + ". Каждая тРНК приносит аминокислоту, соответствующую кодону.");
    steps.push("По <b>таблице генетического кода</b> (ищем по кодонам иРНК, а не по ДНК и не по антикодонам) находим аминокислоты: " +
      cod.map(function (c, i) { return ru(c) + " — " + NAME[aas[i]][1]; }).join("; ") + ".");
    if (stopAt >= 0) steps.push("Кодон " + ru(cod[stopAt]) + " — <b>стоп-кодон</b>: на нём синтез белка заканчивается, аминокислоту он не кодирует" + (stopAt < cod.length - 1 ? ", поэтому следующие кодоны в белок не войдут" : "") + ".");
    var protein = (stopAt >= 0 ? aas.slice(0, stopAt) : aas).map(function (a) { return NAME[a][0]; });

    var table = '<div class="dna-tbl"><table><thead><tr><th>№</th><th>ДНК (матр.)</th><th>иРНК (кодон)</th><th>тРНК (антикодон)</th><th>Аминокислота</th></tr></thead><tbody>' +
      cod.map(function (c, i) {
        var stop = aas[i] === "*";
        return "<tr" + (stop ? ' class="dna-stop"' : (stopAt >= 0 && i > stopAt ? ' class="dna-after"' : "")) + "><td>" + (i + 1) + "</td><td>" + ru(template.substr(i * 3, 3)) + "</td><td><b>" + ru(c) + "</b></td><td>" + ru(trna[i]) + "</td><td>" +
          (stop ? "стоп" : "<b>" + NAME[aas[i]][0] + "</b> — " + NAME[aas[i]][1]) + "</td></tr>";
      }).join("") + "</tbody></table></div>";

    out.innerHTML =
      (note ? '<div class="dna-note">' + note + "</div>" : "") + '<div class="dna-strands">' +
      strand("ДНК, смысловая", coding, "", ["5′", "3′"]) +
      strand("ДНК, матричная", template, "dna-tmpl", ["3′", "5′"]) +
      strand("иРНК", mrna, "dna-mrna", ["5′", "3′"]) +
      strand("тРНК, антикодоны", trna.join(""), "", ["3′", "5′"]) +
      "</div>" +
      '<div class="dna-protein"><span>Белок (фрагмент):</span> ' + (protein.length ? protein.join(" – ") : "—") + "</div>" +
      table +
      '<h3>Решение по шагам</h3><ol class="dna-steps">' + steps.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>" +
      '<div class="dna-answer"><b>Ответ:</b> иРНК: ' + fmt(mrna) + "; антикодоны тРНК (3′→5′): " + ru(trna.join(", ")) + " (5′→3′: " + ru(rev3.join(", ")) + ")" + "; последовательность аминокислот: " + (protein.join(" – ") || "—") + ".</div>";
  }

  $("dna-input").addEventListener("input", solve);
  $("dna-mode").addEventListener("change", solve);
  app.querySelectorAll("[data-ex]").forEach(function (b) {
    b.addEventListener("click", function () { var p = b.getAttribute("data-ex").split("|"); $("dna-mode").value = p[0]; $("dna-input").value = p[1]; solve(); });
  });
  solve();
})();
