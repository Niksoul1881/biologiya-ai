/* Решётка Пеннета онлайн: скрещивание по 1–3 генам, гаметы, решётка, расщепление и решение по шагам. */
(function () {
  "use strict";
  var app = document.getElementById("punnett-app");
  if (!app) return;

  var $ = function (id) { return document.getElementById(id); };
  var PALETTE = ["#DCFCE7", "#DBEAFE", "#FEF3C7", "#FCE7F3", "#E0E7FF", "#FFEDD5", "#CCFBF1", "#F3E8FF"];

  function upperFirst(a, b) {
    var A = a === a.toUpperCase(), B = b === b.toUpperCase();
    return A === B ? 0 : (A ? -1 : 1);
  }

  // "AaBb" → [["A","a"],["B","b"]]
  function parse(raw, who) {
    var g = (raw || "").replace(/\s+/g, "");
    if (!g) throw who + ": введите генотип, например AaBb";
    if (!/^[A-Za-z]+$/.test(g)) throw who + ": только латинские буквы, например AaBb (кириллица не подходит)";
    if (g.length % 2) throw who + ": у каждого гена две аллели — генотип записывается парами букв: Aa, AaBb, AaBbCc";
    var genes = [];
    for (var i = 0; i < g.length; i += 2) {
      var a = g[i], b = g[i + 1];
      if (a.toLowerCase() !== b.toLowerCase())
        throw who + ": в паре «" + a + b + "» буквы разных генов. Аллели одного гена — одна буква: Aa, BB, cc";
      genes.push([a, b].sort(upperFirst));
    }
    var seen = {};
    genes.forEach(function (p) {
      var k = p[0].toLowerCase();
      if (seen[k]) throw who + ": ген «" + k.toUpperCase() + "» записан дважды";
      seen[k] = 1;
    });
    if (genes.length > 3) throw who + ": решётка строится максимум для трёх генов (иначе в ней больше 64 клеток)";
    return genes;
  }

  // уникальные гаметы (при независимом наследовании все равновероятны)
  function gametes(genes) {
    var res = [""];
    genes.forEach(function (p) {
      var alle = p[0] === p[1] ? [p[0]] : [p[0], p[1]];
      var next = [];
      res.forEach(function (r) { alle.forEach(function (x) { next.push(r + x); }); });
      res = next;
    });
    return res;
  }

  function combine(g1, g2) {
    var out = "";
    for (var i = 0; i < g1.length; i++) out += [g1[i], g2[i]].sort(upperFirst).join("");
    return out;
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratio(nums) {
    var g = nums.reduce(gcd);
    return nums.map(function (n) { return n / g; }).join(" : ");
  }
  function frac(n, d) { var g = gcd(n, d); return (n / g) + "/" + (d / g); }
  function pct(n, d) { return (Math.round(n / d * 10000) / 100).toString().replace(".", ",") + "%"; }

  function geneSettings(letter) {
    var k = letter.toLowerCase();
    return {
      incomplete: $("pn-inc-" + k) ? $("pn-inc-" + k).checked : false,
      dom: ($("pn-dom-" + k) && $("pn-dom-" + k).value.trim()) || "",
      rec: ($("pn-rec-" + k) && $("pn-rec-" + k).value.trim()) || "",
      mid: ($("pn-mid-" + k) && $("pn-mid-" + k).value.trim()) || ""
    };
  }

  // фенотип по одному гену: {code, name}
  function phenoGene(pair, s) {
    var up = pair[0].toUpperCase(), lo = up.toLowerCase();
    var nDom = (pair[0] === up) + (pair[1] === up);
    if (s.incomplete) {
      if (nDom === 2) return { code: up + up, name: s.dom || ("признак " + up + up) };
      if (nDom === 1) return { code: up + lo, name: s.mid || "промежуточный (" + up + lo + ")" };
      return { code: lo + lo, name: s.rec || ("признак " + lo + lo) };
    }
    if (nDom) return { code: up + "_", name: s.dom || ("доминантный признак " + up) };
    return { code: lo + lo, name: s.rec || ("рецессивный признак " + lo) };
  }

  function phenotype(genotype) {
    var codes = [], names = [];
    for (var i = 0; i < genotype.length; i += 2) {
      var p = phenoGene([genotype[i], genotype[i + 1]], geneSettings(genotype[i]));
      codes.push(p.code); names.push(p.name);
    }
    return { code: codes.join(""), name: names.join(", ") };
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // поля названий признаков под набор генов первого родителя
  function renderGeneFields() {
    var box = $("pn-genes"), letters = [];
    try { letters = parse($("pn-mother").value, "Мать").map(function (p) { return p[0].toLowerCase(); }); }
    catch (e) { letters = []; }
    var keep = {};
    box.querySelectorAll("input").forEach(function (i) { keep[i.id] = i.type === "checkbox" ? i.checked : i.value; });
    box.innerHTML = letters.map(function (k) {
      var K = k.toUpperCase();
      return '<div class="pn-gene"><div class="pn-gene-title">Ген ' + K + "</div>" +
        '<label class="pn-check"><input type="checkbox" id="pn-inc-' + k + '"> неполное доминирование</label>' +
        '<div class="pn-gene-row"><input id="pn-dom-' + k + '" placeholder="' + K + ' — например, жёлтые">' +
        '<input id="pn-mid-' + k + '" placeholder="' + K + k + ' — промежуточный" class="pn-mid">' +
        '<input id="pn-rec-' + k + '" placeholder="' + k + k + ' — например, зелёные"></div></div>';
    }).join("");
    Object.keys(keep).forEach(function (id) {
      var el = $(id); if (!el) return;
      if (el.type === "checkbox") el.checked = keep[id]; else el.value = keep[id];
    });
    box.querySelectorAll("input[type=checkbox]").forEach(function (c) {
      var sync = function () { c.closest(".pn-gene").classList.toggle("is-inc", c.checked); };
      c.addEventListener("change", function () { sync(); solve(); }); sync();
    });
    box.querySelectorAll("input:not([type=checkbox])").forEach(function (i) { i.addEventListener("input", solve); });
  }

  function solve() {
    var out = $("pn-result");
    var m, f;
    try {
      m = parse($("pn-mother").value, "Мать");
      f = parse($("pn-father").value, "Отец");
      var lm = m.map(function (p) { return p[0].toLowerCase(); }).join("");
      var lf = f.map(function (p) { return p[0].toLowerCase(); }).join("");
      if (lm !== lf) throw "У родителей должны быть одни и те же гены в одном порядке: например, AaBb × aaBb (у вас " +
        lm.toUpperCase() + " и " + lf.toUpperCase() + ")";
    } catch (e) {
      out.innerHTML = '<div class="pn-error">' + esc(e) + "</div>";
      return;
    }
    var mStr = m.map(function (p) { return p.join(""); }).join("");
    var fStr = f.map(function (p) { return p.join(""); }).join("");
    var gm = gametes(m), gf = gametes(f), total = gm.length * gf.length;

    var geno = {}, pheno = {}, order = [], porder = [];
    var cells = gm.map(function (a) {
      return gf.map(function (b) {
        var g = combine(a, b), p = phenotype(g);
        if (!(g in geno)) { geno[g] = 0; order.push(g); }
        geno[g]++;
        if (!(p.code in pheno)) { pheno[p.code] = { n: 0, name: p.name }; porder.push(p.code); }
        pheno[p.code].n++;
        return { g: g, p: p.code };
      });
    });
    // порядок как в учебниках: по каждому гену сначала AA, потом Aa, потом aa
    var rank = function (g) {
      var r = "";
      for (var i = 0; i < g.length; i += 2) r += (g[i] === g[i].toUpperCase()) + (g[i + 1] === g[i + 1].toUpperCase()) ? String(2 - ((g[i] === g[i].toUpperCase()) + (g[i + 1] === g[i + 1].toUpperCase()))) : "2";
      return r;
    };
    order.sort(function (x, y) { return rank(x) < rank(y) ? -1 : rank(x) > rank(y) ? 1 : 0; });
    porder.sort(function (x, y) { return pheno[y].n - pheno[x].n; });
    var color = {}; porder.forEach(function (c, i) { color[c] = PALETTE[i % PALETTE.length]; });

    var nGenes = m.length;
    var cross = ["моногибридное", "дигибридное", "тригибридное"][nGenes - 1];
    var mother = "♀ " + mStr, father = "♂ " + fStr;

    // решётка
    var table = '<div class="pn-grid-wrap"><table class="pn-grid"><thead><tr><th class="pn-corner">♀ \\ ♂</th>' +
      gf.map(function (g) { return '<th class="pn-gam">' + g + "</th>"; }).join("") + "</tr></thead><tbody>" +
      cells.map(function (row, i) {
        return '<tr><th class="pn-gam">' + gm[i] + "</th>" + row.map(function (c) {
          return '<td style="background:' + color[c.p] + '"><b>' + c.g + "</b></td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";

    var genoRows = order.map(function (g) {
      return "<tr><td><b>" + g + "</b></td><td>" + phenotype(g).name + "</td><td>" + geno[g] + "/" + total +
        "</td><td>" + frac(geno[g], total) + "</td><td>" + pct(geno[g], total) + "</td></tr>";
    }).join("");
    var phenoRows = porder.map(function (c) {
      return '<tr><td><span class="pn-swatch" style="background:' + color[c] + '"></span><b>' + c + "</b></td><td>" +
        pheno[c].name + "</td><td>" + pheno[c].n + "/" + total + "</td><td>" + frac(pheno[c].n, total) + "</td><td>" + pct(pheno[c].n, total) + "</td></tr>";
    }).join("");

    var genoRatio = ratio(order.map(function (g) { return geno[g]; }));
    var phenoRatio = ratio(porder.map(function (c) { return pheno[c].n; }));

    // решение по шагам
    var legend = m.map(function (p) {
      var s = geneSettings(p[0]), up = p[0].toUpperCase(), lo = up.toLowerCase();
      if (s.incomplete)
        return "<li>" + up + up + " — " + (s.dom || "признак " + up + up) + ", " + up + lo + " — " + (s.mid || "промежуточный") + ", " + lo + lo + " — " + (s.rec || "признак " + lo + lo) + " (неполное доминирование)</li>";
      return "<li>" + up + " — " + (s.dom || "доминантный признак") + ", " + lo + " — " + (s.rec || "рецессивный признак") + " (" + up + " доминирует над " + lo + ")</li>";
    }).join("");
    var gamText = function (who, genes, gl) {
      var het = genes.filter(function (p) { return p[0] !== p[1]; }).length;
      return who + " (" + genes.map(function (p) { return p.join(""); }).join("") + ") образует " + gl.length +
        (gl.length === 1 ? " тип гамет" : (gl.length < 5 ? " типа гамет" : " типов гамет")) + ": <b>" + gl.join(", ") + "</b>" +
        (het ? " (2<sup>" + het + "</sup> = " + gl.length + ", по числу генов в гетерозиготе)" : " (гомозигота — один тип гамет)");
    };
    var steps = '<ol class="pn-steps">' +
      "<li><b>Обозначения.</b><ul>" + legend + "</ul></li>" +
      "<li><b>Схема скрещивания.</b> P: " + mother + " × " + father + " (" + cross + " скрещивание)</li>" +
      "<li><b>Гаметы (G).</b> В гамету попадает по одной аллели каждого гена" + (nGenes > 1 ? "; гены наследуются независимо, поэтому аллели разных генов сочетаются во всех вариантах" : "") + ".<br>" +
      gamText("♀", m, gm) + ".<br>" + gamText("♂", f, gf) + ".</li>" +
      "<li><b>Решётка Пеннета.</b> По строкам — гаметы матери, по столбцам — гаметы отца, в клетках — генотипы потомков: " +
      gm.length + " × " + gf.length + " = " + total + " равновероятных сочетаний.</li>" +
      "<li><b>F₁ по генотипу:</b> " + order.map(function (g) { return geno[g] + " " + g; }).join(" : ") + " → расщепление <b>" + genoRatio + "</b>.</li>" +
      "<li><b>F₁ по фенотипу:</b> " + porder.map(function (c) { return pheno[c].n + " " + pheno[c].name; }).join(" : ") + " → расщепление <b>" + phenoRatio + "</b>.</li>" +
      "</ol>";

    out.innerHTML =
      '<div class="pn-cross">P: <b>' + mother + "</b> × <b>" + father + "</b> <span>" + cross + " скрещивание</span></div>" +
      '<div class="pn-gametes"><div><span>Гаметы ♀</span> ' + gm.map(function (g) { return "<code>" + g + "</code>"; }).join(" ") + "</div>" +
      '<div><span>Гаметы ♂</span> ' + gf.map(function (g) { return "<code>" + g + "</code>"; }).join(" ") + "</div></div>" +
      "<h3>Решётка Пеннета</h3>" + table +
      '<div class="pn-split"><div><h3>Расщепление по генотипу: ' + genoRatio + "</h3>" +
      '<div class="pn-tbl"><table><thead><tr><th>Генотип</th><th>Фенотип</th><th>Клеток</th><th>Доля</th><th>%</th></tr></thead><tbody>' + genoRows + "</tbody></table></div></div>" +
      "<div><h3>Расщепление по фенотипу: " + phenoRatio + "</h3>" +
      '<div class="pn-tbl"><table><thead><tr><th>Фенотип</th><th>Признаки</th><th>Клеток</th><th>Доля</th><th>%</th></tr></thead><tbody>' + phenoRows + "</tbody></table></div></div></div>" +
      "<h3>Решение по шагам</h3>" + steps +
      '<div class="pn-answer"><b>Ответ:</b> расщепление по генотипу ' + genoRatio + ", по фенотипу " + phenoRatio + ".</div>";
    try { history.replaceState(null, "", "#" + encodeURIComponent(mStr + "-" + fStr)); } catch (e) {}
  }

  ["pn-mother", "pn-father"].forEach(function (id) {
    $(id).addEventListener("input", function () { if (id === "pn-mother") renderGeneFields(); solve(); });
  });
  app.querySelectorAll("[data-preset]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-preset").split("-");
      $("pn-mother").value = p[0]; $("pn-father").value = p[1];
      renderGeneFields(); solve();
    });
  });
  $("pn-swap").addEventListener("click", function () {
    var t = $("pn-mother").value; $("pn-mother").value = $("pn-father").value; $("pn-father").value = t;
    renderGeneFields(); solve();
  });

  var h = decodeURIComponent((location.hash || "").slice(1)).split("-");
  if (h.length === 2 && /^[A-Za-z]+$/.test(h[0] + h[1])) { $("pn-mother").value = h[0]; $("pn-father").value = h[1]; }
  renderGeneFields(); solve();
})();
