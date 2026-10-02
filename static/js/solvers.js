/*
 * Решатели с пошаговым решением (/reshit/*). Без сервера: вся математика — в браузере,
 * точная арифметика на дробях (BigInt), формулы — KaTeX (подключён в partials/math.html).
 *
 * Страница: <div class="solver" data-solver="quadratic|fractions|gcd|percent|system2|det"></div>.
 * Ввод сохраняется в адресе (?a=1&b=-5&c=6) — решением можно поделиться, поиск видит примеры.
 * Экспорт для тестов (node): module.exports = { Frac, solve }.
 */
(function (root) {
  "use strict";

  // ------------------------------------------------------------ дроби
  const babs = (x) => (x < 0n ? -x : x);
  function bgcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a; }
  function blcm(a, b) { return a === 0n || b === 0n ? 0n : babs(a * b) / bgcd(a, b); }

  class Frac {
    constructor(n, d = 1n) {
      n = BigInt(n); d = BigInt(d);
      if (d === 0n) throw new Error("деление на ноль");
      if (d < 0n) { n = -n; d = -d; }
      const g = bgcd(n, d) || 1n;
      this.n = n / g; this.d = d / g;
    }
    static of(x) { return x instanceof Frac ? x : new Frac(BigInt(x)); }
    add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { o = Frac.of(o); if (o.n === 0n) throw new Error("деление на ноль"); return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    isInt() { return this.d === 1n; }
    isZero() { return this.n === 0n; }
    sign() { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
    eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
    num() { return Number(this.n) / Number(this.d); }
    tex() {
      if (this.d === 1n) return this.n.toString();
      const s = this.n < 0n ? "-" : "";
      return `${s}\\frac{${babs(this.n)}}{${this.d}}`;
    }
    /** в скобках, если отрицательное — для подстановки: (−3)² */
    ptex() { return this.sign() < 0 ? `\\left(${this.tex()}\\right)` : this.tex(); }
    text() { return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`; }
    /** Конечная десятичная запись или null (знаменатель не только 2 и 5). */
    exactDecimal(maxDigits = 12) {
      let d = this.d, k = 0;
      while (d % 2n === 0n) { d /= 2n; k++; }
      let k5 = 0;
      while (d % 5n === 0n) { d /= 5n; k5++; }
      if (d !== 1n) return null;
      const digits = Math.max(k, k5);
      if (digits > maxDigits) return null;
      const scaled = (babs(this.n) * 10n ** BigInt(digits)) / this.d;
      let s = scaled.toString().padStart(digits + 1, "0");
      if (digits) s = s.slice(0, -digits) + "," + s.slice(-digits);
      return (this.n < 0n ? "−" : "") + s;
    }
  }

  function fmtNum(x, digits = 4) {
    if (!isFinite(x)) return "—";
    const r = Math.round(x * 10 ** digits) / 10 ** digits;
    return (Object.is(r, -0) ? 0 : r).toString().replace(".", ",").replace("-", "−");
  }
  /** Число для LaTeX: «-0{,}366» (запятая без пробела после неё). */
  function texNum(x, digits = 4) { return fmtNum(x, digits).replace("−", "-").replace(",", "{,}"); }
  function approx(f) {
    const e = f.exactDecimal();
    return e !== null ? e : "≈ " + fmtNum(f.num());
  }

  /** «3», «−2,5», «3/4», «1 2/3» (смешанное), «-1 1/2» → Frac. null — пусто, Error — мусор. */
  function parseFrac(raw) {
    let s = String(raw ?? "").trim().replace(/[−–—]/g, "-").replace(/\s+/g, " ");
    if (s === "") return null;
    let m = s.match(/^([+-])?(\d+) (\d+)\/(\d+)$/);
    if (m) {
      const whole = BigInt(m[2]), n = BigInt(m[3]), d = BigInt(m[4]);
      if (d === 0n) throw new Error("знаменатель не может быть нулём");
      const f = new Frac(whole * d + n, d);
      return m[1] === "-" ? f.neg() : f;
    }
    m = s.match(/^([+-])?(\d+)\/(\d+)$/);
    if (m) {
      if (BigInt(m[3]) === 0n) throw new Error("знаменатель не может быть нулём");
      const f = new Frac(BigInt(m[2]), BigInt(m[3]));
      return m[1] === "-" ? f.neg() : f;
    }
    m = s.replace(",", ".").match(/^([+-])?(\d*)(?:\.(\d+))?$/);
    if (m && (m[2] || m[3])) {
      const frac = m[3] || "";
      const f = new Frac(BigInt((m[2] || "0") + frac), 10n ** BigInt(frac.length));
      return m[1] === "-" ? f.neg() : f;
    }
    throw new Error(`не понял число «${raw}»`);
  }

  // ------------------------------------------------------------ корни и множители
  /** n = s²·r, r без квадратов → [s, r] */
  function sqrtSplit(n) {
    n = BigInt(n);
    let s = 1n, r = n;
    for (let p = 2n; p * p <= r; p++) {
      while (r % (p * p) === 0n) { r /= p * p; s *= p; }
    }
    return [s, r];
  }
  function primeFactors(n) {
    n = BigInt(n);
    const out = [];
    for (let p = 2n; p * p <= n; p++) {
      let k = 0;
      while (n % p === 0n) { n /= p; k++; }
      if (k) out.push([p, k]);
    }
    if (n > 1n) out.push([n, 1]);
    return out;
  }
  function factorsTex(fs) {
    if (!fs.length) return "1";
    return fs.map(([p, k]) => (k > 1 ? `${p}^{${k}}` : `${p}`)).join(" \\cdot ");
  }

  // ------------------------------------------------------------ помощники LaTeX
  /** Член многочлена: coef·var с правильным знаком; first — без ведущего «+». */
  function term(coef, v, first) {
    if (coef.isZero()) return "";
    const neg = coef.sign() < 0;
    const abs = neg ? coef.neg() : coef;
    let body;
    if (v && abs.eq(1)) body = v;
    else body = abs.tex() + (v || "");
    if (first) return (neg ? "-" : "") + body;
    return (neg ? " - " : " + ") + body;
  }
  function poly(terms) {
    let out = "", first = true;
    for (const [c, v] of terms) {
      const t = term(c, v, first);
      if (t) { out += t; first = false; }
    }
    return out || "0";
  }
  /** m ± t√r в LaTeX (m, t — Frac, t > 0; r — BigInt > 1). sign: +1 → «+», −1 → «−», 0 → «±».
   *  Общий знаменатель выносится: (1 ± √3)/2, а не 1/2 ± √3/2. */
  function surd(m, t, r, sign) {
    const op = sign > 0 ? "+" : sign < 0 ? "-" : "\\pm";
    const den = blcm(m.d, t.d);
    const mn = m.n * (den / m.d), tn = babs(t.n) * (den / t.d);
    const rad = (tn === 1n ? "" : tn.toString()) + `\\sqrt{${r}}`;
    if (mn === 0n) {
      const pre = sign > 0 ? "" : sign < 0 ? "-" : "\\pm ";
      return pre + (den === 1n ? rad : `\\frac{${rad}}{${den}}`);
    }
    const top = `${mn} ${op} ${rad}`;
    return den === 1n ? top : `\\frac{${top}}{${den}}`;
  }

  // ------------------------------------------------------------ решатели
  // Каждый решатель: (params) → { answer: [tex...], answerText, steps: [{title, tex[], text}] }
  const SOLVERS = {};

  // ---- квадратное уравнение ax² + bx + c = 0
  SOLVERS.quadratic = {
    fields: [["a", "a"], ["b", "b"], ["c", "c"]],
    examples: [["x² − 5x + 6 = 0", { a: "1", b: "-5", c: "6" }], ["2x² + 3x − 2 = 0", { a: "2", b: "3", c: "-2" }],
               ["x² − 6x + 9 = 0", { a: "1", b: "-6", c: "9" }], ["x² − 4x + 1 = 0", { a: "1", b: "-4", c: "1" }],
               ["x² + 2x + 5 = 0", { a: "1", b: "2", c: "5" }]],
    solve(p) {
      let a = req(p.a, "a"), b = req(p.b, "b"), c = req(p.c, "c");
      const steps = [];
      const eqTex = (a, b, c) => `${poly([[a, "x^2"], [b, "x"], [c, ""]])} = 0`;
      steps.push({ title: "Записываем уравнение", tex: [eqTex(a, b, c)] });

      if (a.isZero()) {
        if (b.isZero()) {
          const ok = c.isZero();
          steps.push({ title: "Это не квадратное уравнение", text: ok ? "a = 0 и b = 0, c = 0: равенство 0 = 0 верно при любом x." : `a = 0 и b = 0: получается ${c.text()} = 0 — неверно.` });
          return { answer: [ok ? "x \\in \\mathbb{R}" : "\\text{корней нет}"], answerText: ok ? "любое число" : "корней нет", steps };
        }
        const x = c.neg().div(b);
        steps.push({ title: "a = 0 — уравнение линейное", tex: [`${poly([[b, "x"], [c, ""]])} = 0`, `x = \\frac{${c.neg().tex()}}{${b.tex()}} = ${x.tex()}`] });
        return { answer: [`x = ${x.tex()}`], answerText: `x = ${x.text()}`, steps };
      }

      // дроби → целые
      const L = [a, b, c].reduce((l, f) => blcm(l, f.d), 1n);
      if (L !== 1n) {
        a = a.mul(L); b = b.mul(L); c = c.mul(L);
        steps.push({ title: `Избавляемся от дробей: умножаем обе части на ${L}`, tex: [eqTex(a, b, c)] });
      }
      if (a.sign() < 0) {
        a = a.neg(); b = b.neg(); c = c.neg();
        steps.push({ title: "Для удобства умножаем на −1 (чтобы a > 0)", tex: [eqTex(a, b, c)] });
      }
      const G = bgcd(bgcd(a.n, b.n), c.n);
      if (G > 1n) {
        a = a.div(G); b = b.div(G); c = c.div(G);
        steps.push({ title: `Делим обе части на ${G}`, tex: [eqTex(a, b, c)] });
      }
      steps.push({ title: "Коэффициенты", tex: [`a = ${a.tex()},\\quad b = ${b.tex()},\\quad c = ${c.tex()}`] });

      // неполные уравнения — короткий путь
      if (c.isZero()) {
        const x2 = b.neg().div(a);
        steps.push({
          title: "c = 0 — выносим x за скобки",
          tex: [`x\\left(${poly([[a, "x"], [b, ""]])}\\right) = 0`, `x_1 = 0 \\quad\\text{или}\\quad ${poly([[a, "x"], [b, ""]])} = 0 \\;\\Rightarrow\\; x_2 = ${x2.tex()}`],
          text: "Произведение равно нулю, когда хотя бы один множитель равен нулю.",
        });
        const roots = x2.isZero() ? [new Frac(0)] : [new Frac(0), x2].sort((u, v) => u.num() - v.num());
        return finishRational(roots, a, b, c, steps);
      }
      if (b.isZero()) {
        const q = c.neg().div(a);
        steps.push({ title: "b = 0 — выражаем x²", tex: [`x^2 = -\\frac{c}{a} = ${q.tex()}`] });
        if (q.sign() < 0) {
          steps.push({ title: "Квадрат не бывает отрицательным", text: "Действительных корней нет." });
          return { answer: ["\\text{действительных корней нет}"], answerText: "корней нет", steps };
        }
        // дальше — общий путь через дискриминант даст те же корни
      }

      const D = b.mul(b).sub(new Frac(4).mul(a).mul(c));
      steps.push({
        title: "Находим дискриминант",
        tex: [`D = b^2 - 4ac = ${b.ptex()}^2 - 4 \\cdot ${a.ptex()} \\cdot ${c.ptex()} = ${D.tex()}`],
      });
      const twoA = a.mul(2);
      const vx = b.neg().div(twoA), vy = D.neg().div(a.mul(4));

      if (D.sign() < 0) {
        const [s, r] = sqrtSplit(babs(D.n));
        const t = new Frac(s, 1n).div(twoA);
        const im = r === 1n ? (t.eq(1) ? "i" : `${t.tex()}i`) : `${t.eq(1) ? "" : t.isInt() ? t.tex() : t.tex()}\\sqrt{${r}}\\,i`;
        steps.push({
          title: "D < 0 — действительных корней нет",
          text: "Парабола не пересекает ось x. В комплексных числах (10–11 класс, вуз) корни есть:",
          tex: [`x_{1,2} = \\frac{-b \\pm i\\sqrt{|D|}}{2a} = ${vx.tex()} \\pm ${im}`],
        });
        steps.push(vertexStep(vx, vy, a));
        return { answer: ["\\text{действительных корней нет}"], answerText: "действительных корней нет", steps };
      }
      if (D.isZero()) {
        steps.push({ title: "D = 0 — один корень (два совпадающих)", tex: [`x = -\\frac{b}{2a} = -\\frac{${b.tex()}}{2 \\cdot ${a.ptex()}} = ${vx.tex()}`] });
        return finishRational([vx], a, b, c, steps);
      }
      const [s, r] = sqrtSplit(D.n);
      const formula = `x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${b.neg().tex()} \\pm \\sqrt{${D.tex()}}}{${twoA.tex()}}`;
      if (r === 1n) {
        const sq = new Frac(s);
        const x1 = b.neg().add(sq).div(twoA), x2 = b.neg().sub(sq).div(twoA);
        steps.push({
          title: "D > 0 — два корня",
          tex: [formula, `\\sqrt{${D.tex()}} = ${sq.tex()}`,
                `x_1 = \\frac{${b.neg().tex()} + ${sq.tex()}}{${twoA.tex()}} = ${x1.tex()},\\qquad x_2 = \\frac{${b.neg().tex()} - ${sq.tex()}}{${twoA.tex()}} = ${x2.tex()}`],
        });
        return finishRational([x2, x1].sort((u, v) => u.num() - v.num()), a, b, c, steps);
      }
      const t = new Frac(s).div(twoA);
      const lines = [formula];
      if (s > 1n) lines.push(`\\sqrt{${D.tex()}} = \\sqrt{${s * s} \\cdot ${r}} = ${s}\\sqrt{${r}}`);
      lines.push(`x_{1,2} = ${surd(vx, t, r, 0)}`);
      steps.push({ title: "D > 0 — два корня (иррациональные)", tex: lines });
      const x1 = surd(vx, t, r, 1), x2 = surd(vx, t, r, -1);
      const d = Math.sqrt(Number(r)) * t.num();
      steps.push({ title: "Приближённые значения", tex: [`x_1 \\approx ${texNum(vx.num() - d)},\\qquad x_2 \\approx ${texNum(vx.num() + d)}`] });
      steps.push({ title: "Проверка по теореме Виета", tex: [`x_1 + x_2 = -\\frac{b}{a} = ${b.neg().div(a).tex()},\\qquad x_1 \\cdot x_2 = \\frac{c}{a} = ${c.div(a).tex()}`] });
      steps.push(vertexStep(vx, vy, a));
      return { answer: [`x_1 = ${x2}`, `x_2 = ${x1}`], answerText: `x₁ ≈ ${fmtNum(vx.num() - d)}, x₂ ≈ ${fmtNum(vx.num() + d)}`, steps };
    },
  };

  function vertexStep(vx, vy, a) {
    return {
      title: "Вершина параболы y = ax² + bx + c",
      tex: [`x_0 = -\\frac{b}{2a} = ${vx.tex()},\\qquad y_0 = -\\frac{D}{4a} = ${vy.tex()}`],
      text: a.sign() > 0 ? "Ветви параболы направлены вверх (a > 0)." : "Ветви параболы направлены вниз (a < 0).",
    };
  }

  function finishRational(roots, a, b, c, steps) {
    if (roots.length === 2) {
      const [x1, x2] = roots;
      steps.push({
        title: "Проверка по теореме Виета",
        tex: [`x_1 + x_2 = ${x1.tex()} + ${x2.ptex()} = ${x1.add(x2).tex()} = -\\frac{b}{a}`,
              `x_1 \\cdot x_2 = ${x1.ptex()} \\cdot ${x2.ptex()} = ${x1.mul(x2).tex()} = \\frac{c}{a}`],
      });
      const f = (x) => x.isZero() ? "x" : `\\left(x ${x.sign() > 0 ? "-" : "+"} ${(x.sign() > 0 ? x : x.neg()).tex()}\\right)`;
      steps.push({ title: "Разложение на множители", tex: [`${poly([[a, "x^2"], [b, "x"], [c, ""]])} = ${a.eq(1) ? "" : a.tex()}${f(x1)}${f(x2)}`] });
      return { answer: [`x_1 = ${x1.tex()},\\quad x_2 = ${x2.tex()}`], answerText: `x₁ = ${x1.text()}, x₂ = ${x2.text()}`, steps };
    }
    const [x] = roots;
    return { answer: [`x = ${x.tex()}`], answerText: `x = ${x.text()}`, steps };
  }

  // ---- действия с дробями
  SOLVERS.fractions = {
    fields: [["x", "первая дробь"], ["op", "действие"], ["y", "вторая дробь"]],
    ops: { "+": "+", "-": "−", "*": "×", "/": ":" },
    examples: [["2/3 + 3/4", { x: "2/3", op: "+", y: "3/4" }], ["5/6 − 1/4", { x: "5/6", op: "-", y: "1/4" }],
               ["3/8 × 4/9", { x: "3/8", op: "*", y: "4/9" }], ["1 1/2 : 3/4", { x: "1 1/2", op: "/", y: "3/4" }]],
    solve(p) {
      const x = req(p.x, "первая дробь"), y = req(p.y, "вторая дробь");
      const op = p.op in this.ops ? p.op : "+";
      const steps = [];
      const sym = { "+": "+", "-": "-", "*": "\\cdot", "/": ":" }[op];
      steps.push({ title: "Пример", tex: [`${x.tex()} ${sym} ${y.ptex()}`] });
      let res;
      if (op === "+" || op === "-") {
        if (x.d === y.d) {
          res = op === "+" ? x.add(y) : x.sub(y);
          steps.push({ title: `Знаменатели одинаковые — ${op === "+" ? "складываем" : "вычитаем"} числители`, tex: [`\\frac{${x.n} ${op === "+" ? "+" : "-"} ${y.n < 0n ? `(${y.n})` : y.n}}{${x.d}} = ${res.tex()}`] });
        } else {
          const L = blcm(x.d, y.d);
          const kx = L / x.d, ky = L / y.d;
          steps.push({ title: `Общий знаменатель — НОК(${x.d}, ${y.d}) = ${L}`, tex: [`${L} : ${x.d} = ${kx},\\qquad ${L} : ${y.d} = ${ky}`], text: "Это дополнительные множители для каждой дроби." });
          const nx = x.n * kx, ny = y.n * ky;
          steps.push({ title: "Приводим к общему знаменателю", tex: [`\\frac{${x.n} \\cdot ${kx}}{${x.d} \\cdot ${kx}} ${op === "+" ? "+" : "-"} \\frac{${y.n} \\cdot ${ky}}{${y.d} \\cdot ${ky}} = \\frac{${nx}}{${L}} ${op === "+" ? "+" : "-"} \\frac{${ny}}{${L}}`] });
          const raw = op === "+" ? nx + ny : nx - ny;
          res = new Frac(raw, L);
          steps.push({ title: op === "+" ? "Складываем числители" : "Вычитаем числители", tex: [`\\frac{${nx} ${op === "+" ? "+" : "-"} ${ny < 0n ? `(${ny})` : ny}}{${L}} = \\frac{${raw}}{${L}}`] });
          pushReduce(steps, raw, L, res);
        }
      } else if (op === "*") {
        const rn = x.n * y.n, rd = x.d * y.d;
        res = new Frac(rn, rd);
        steps.push({ title: "Умножаем числитель на числитель, знаменатель на знаменатель", tex: [`\\frac{${x.n} \\cdot ${y.n < 0n ? `(${y.n})` : y.n}}{${x.d} \\cdot ${y.d}} = \\frac{${rn}}{${rd}}`] });
        pushReduce(steps, rn, rd, res);
      } else {
        if (y.isZero()) throw new Error("на ноль делить нельзя");
        const inv = new Frac(y.d, y.n);
        steps.push({ title: "Деление = умножение на перевёрнутую дробь", tex: [`${x.tex()} : ${y.ptex()} = ${x.tex()} \\cdot ${inv.ptex()}`] });
        const rn = x.n * inv.n, rd = x.d * inv.d;
        res = new Frac(rn, rd);
        steps.push({ title: "Умножаем", tex: [`\\frac{${x.n} \\cdot ${inv.n < 0n ? `(${inv.n})` : inv.n}}{${x.d} \\cdot ${inv.d}} = \\frac{${rn}}{${rd}}`] });
        pushReduce(steps, rn, rd, res);
      }
      const mixed = mixedTex(res);
      if (mixed) steps.push({ title: "Выделяем целую часть", tex: [`${res.tex()} = ${mixed}`] });
      const dec = res.exactDecimal();
      return {
        answer: [`${res.tex()}${mixed ? ` = ${mixed}` : ""}${dec !== null && !res.isInt() ? ` = ${dec.replace("−", "-")}` : ""}`],
        answerText: res.text() + (dec !== null && !res.isInt() ? ` = ${dec}` : ""),
        steps,
      };
    },
  };
  function pushReduce(steps, n, d, res) {
    const g = bgcd(n, d);
    if (g > 1n) steps.push({ title: `Сокращаем на ${g}`, tex: [`\\frac{${n}}{${d}} = \\frac{${n} : ${g}}{${d} : ${g}} = ${res.tex()}`] });
  }
  function mixedTex(f) {
    if (f.isInt() || babs(f.n) < f.d) return null;
    const w = babs(f.n) / f.d, r = babs(f.n) % f.d;
    return `${f.sign() < 0 ? "-" : ""}${w}\\frac{${r}}{${f.d}}`;
  }

  // ---- НОД и НОК
  SOLVERS.gcd = {
    fields: [["nums", "числа через пробел или запятую"]],
    examples: [["24 и 36", { nums: "24 36" }], ["84 и 126", { nums: "84 126" }], ["12, 18 и 30", { nums: "12 18 30" }]],
    solve(p) {
      const parts = String(p.nums || "").split(/[\s,;]+/).filter(Boolean);
      if (parts.length < 2) throw new Error("введите хотя бы два натуральных числа");
      if (parts.length > 6) throw new Error("не больше 6 чисел");
      const ns = parts.map((s) => {
        if (!/^\d+$/.test(s) || BigInt(s) === 0n) throw new Error(`«${s}» — не натуральное число`);
        if (BigInt(s) > 10n ** 12n) throw new Error("числа до 10¹² — иначе разложение займёт слишком долго");
        return BigInt(s);
      });
      const steps = [];
      const fs = ns.map(primeFactors);
      steps.push({ title: "Раскладываем числа на простые множители", tex: ns.map((n, i) => `${n} = ${factorsTex(fs[i])}`) });
      const primes = [...new Set(fs.flat().map(([q]) => q.toString()))].map(BigInt).sort((u, v) => (u < v ? -1 : 1));
      const exp = (f, q) => (f.find(([r]) => r === q) || [q, 0])[1];
      const gcdF = primes.map((q) => [q, Math.min(...fs.map((f) => exp(f, q)))]).filter(([, k]) => k > 0);
      const lcmF = primes.map((q) => [q, Math.max(...fs.map((f) => exp(f, q)))]).filter(([, k]) => k > 0);
      const G = ns.reduce(bgcd), L = ns.reduce(blcm);
      const list = ns.join("; ");
      steps.push({ title: "НОД — общие множители в наименьших степенях", tex: [`\\text{НОД}(${list}) = ${factorsTex(gcdF)} = ${G}`], text: gcdF.length ? null : "Общих простых множителей нет — числа взаимно простые." });
      steps.push({ title: "НОК — все множители в наибольших степенях", tex: [`\\text{НОК}(${list}) = ${factorsTex(lcmF)} = ${L}`] });
      if (ns.length === 2) {
        let [u, v] = ns[0] >= ns[1] ? ns : [ns[1], ns[0]];
        const lines = [];
        while (v) { lines.push(`${u} = ${v} \\cdot ${u / v} + ${u % v}`); [u, v] = [v, u % v]; }
        steps.push({ title: "Проверка алгоритмом Евклида", tex: lines, text: `Последний ненулевой остаток — ${G}.` });
        steps.push({ title: "Проверка: НОД · НОК = произведение чисел", tex: [`${G} \\cdot ${L} = ${G * L} = ${ns[0]} \\cdot ${ns[1]}`] });
      }
      return { answer: [`\\text{НОД} = ${G},\\quad \\text{НОК} = ${L}`], answerText: `НОД = ${G}, НОК = ${L}`, steps };
    },
  };

  // ---- проценты
  SOLVERS.percent = {
    fields: [["mode", "что найти"], ["x", "x"], ["y", "y"]],
    modes: {
      of: ["Найти p% от числа", "p, %", "число"],
      what: ["Сколько процентов составляет A от B", "A", "B"],
      whole: ["Найти число по его проценту (p% — это A)", "p, %", "A"],
      up: ["Увеличить число на p%", "число", "p, %"],
      down: ["Уменьшить число на p%", "число", "p, %"],
      change: ["На сколько процентов изменилось число (было → стало)", "было", "стало"],
    },
    examples: [["15% от 240", { mode: "of", x: "15", y: "240" }], ["18 от 72 — сколько %", { mode: "what", x: "18", y: "72" }],
               ["30% — это 45", { mode: "whole", x: "30", y: "45" }], ["1200 + 15%", { mode: "up", x: "1200", y: "15" }],
               ["было 80, стало 100", { mode: "change", x: "80", y: "100" }]],
    solve(p) {
      const mode = p.mode in this.modes ? p.mode : "of";
      const [, lx, ly] = this.modes[mode];
      const x = req(p.x, lx), y = req(p.y, ly);
      const H = new Frac(100);
      const steps = [];
      let res, unit = "";
      if (mode === "of") {
        res = y.mul(x).div(H);
        steps.push({ title: "1% — это сотая часть числа, p% — в p раз больше", tex: [`${x.tex()}\\% \\text{ от } ${y.tex()} = ${y.ptex()} \\cdot \\frac{${x.tex()}}{100} = ${res.tex()}`] });
      } else if (mode === "what") {
        if (y.isZero()) throw new Error("B не может быть нулём");
        res = x.div(y).mul(H); unit = "\\%";
        steps.push({ title: "Делим часть на целое и умножаем на 100%", tex: [`\\frac{${x.tex()}}{${y.tex()}} \\cdot 100\\% = ${res.tex()}\\%`] });
      } else if (mode === "whole") {
        if (x.isZero()) throw new Error("процент не может быть нулём");
        res = y.mul(H).div(x);
        steps.push({ title: "Если p% — это A, то 1% — это A/p, а 100% — в 100 раз больше", tex: [`${y.tex()} : ${x.tex()} \\cdot 100 = ${res.tex()}`] });
      } else if (mode === "up" || mode === "down") {
        const k = mode === "up" ? H.add(y).div(H) : H.sub(y).div(H);
        res = x.mul(k);
        steps.push({ title: `Новое число — это ${mode === "up" ? `100% + ${y.text()}%` : `100% − ${y.text()}%`} = ${k.mul(H).text()}% от исходного`, tex: [`${x.tex()} \\cdot ${k.tex()} = ${res.tex()}`] });
      } else {
        if (x.isZero()) throw new Error("начальное значение не может быть нулём");
        res = y.sub(x).div(x).mul(H); unit = "\\%";
        steps.push({ title: "Изменение делим на начальное значение", tex: [`\\frac{${y.tex()} - ${x.ptex()}}{${x.tex()}} \\cdot 100\\% = ${res.tex()}\\%`], text: res.sign() >= 0 ? "Число увеличилось." : "Число уменьшилось." });
      }
      const dec = res.exactDecimal();
      const show = res.isInt() ? res.tex() : dec !== null ? dec.replace("−", "-").replace(",", "{,}") : `${res.tex()} \\approx ${fmtNum(res.num(), 2).replace("−", "-").replace(",", "{,}")}`;
      if (!res.isInt()) steps.push({ title: "В десятичном виде", tex: [`${res.tex()} ${dec !== null ? "=" : "\\approx"} ${dec !== null ? dec.replace("−", "-").replace(",", "{,}") : fmtNum(res.num(), 2).replace("−", "-").replace(",", "{,}")}`] });
      return { answer: [`${show}${unit}`], answerText: (dec !== null ? dec : res.isInt() ? res.text() : "≈ " + fmtNum(res.num(), 2)) + (unit ? "%" : ""), steps };
    },
  };

  // ---- система двух линейных уравнений
  SOLVERS.system2 = {
    fields: [["a1", "a₁"], ["b1", "b₁"], ["c1", "c₁"], ["a2", "a₂"], ["b2", "b₂"], ["c2", "c₂"]],
    examples: [["x + y = 5, x − y = 1", { a1: "1", b1: "1", c1: "5", a2: "1", b2: "-1", c2: "1" }],
               ["2x + 3y = 13, 3x − y = 3", { a1: "2", b1: "3", c1: "13", a2: "3", b2: "-1", c2: "3" }],
               ["x + 2y = 3, 2x + 4y = 6", { a1: "1", b1: "2", c1: "3", a2: "2", b2: "4", c2: "6" }]],
    solve(p) {
      const [a1, b1, c1, a2, b2, c2] = ["a1", "b1", "c1", "a2", "b2", "c2"].map((k) => req(p[k], k));
      const steps = [];
      const eq = (a, b, c) => `${poly([[a, "x"], [b, "y"]])} = ${c.tex()}`;
      steps.push({ title: "Система", tex: [`\\begin{cases} ${eq(a1, b1, c1)} \\\\ ${eq(a2, b2, c2)} \\end{cases}`] });
      const det = (a, b, c, d) => a.mul(d).sub(b.mul(c));
      const D = det(a1, b1, a2, b2), Dx = det(c1, b1, c2, b2), Dy = det(a1, c1, a2, c2);
      steps.push({ title: "Главный определитель (метод Крамера)", tex: [`\\Delta = \\begin{vmatrix} ${a1.tex()} & ${b1.tex()} \\\\ ${a2.tex()} & ${b2.tex()} \\end{vmatrix} = ${a1.ptex()} \\cdot ${b2.ptex()} - ${b1.ptex()} \\cdot ${a2.ptex()} = ${D.tex()}`] });
      if (D.isZero()) {
        const inf = Dx.isZero() && Dy.isZero();
        steps.push({ title: "Δ = 0 — единственного решения нет", tex: [`\\Delta_x = ${Dx.tex()},\\quad \\Delta_y = ${Dy.tex()}`],
                     text: inf ? "Уравнения задают одну и ту же прямую — решений бесконечно много." : "Прямые параллельны и не пересекаются — решений нет." });
        return { answer: [inf ? "\\text{бесконечно много решений}" : "\\text{решений нет}"], answerText: inf ? "бесконечно много решений" : "решений нет", steps };
      }
      const x = Dx.div(D), y = Dy.div(D);
      steps.push({ title: "Определители для x и y", tex: [
        `\\Delta_x = \\begin{vmatrix} ${c1.tex()} & ${b1.tex()} \\\\ ${c2.tex()} & ${b2.tex()} \\end{vmatrix} = ${Dx.tex()}`,
        `\\Delta_y = \\begin{vmatrix} ${a1.tex()} & ${c1.tex()} \\\\ ${a2.tex()} & ${c2.tex()} \\end{vmatrix} = ${Dy.tex()}`] });
      steps.push({ title: "Находим x и y", tex: [`x = \\frac{\\Delta_x}{\\Delta} = \\frac{${Dx.tex()}}{${D.tex()}} = ${x.tex()},\\qquad y = \\frac{\\Delta_y}{\\Delta} = \\frac{${Dy.tex()}}{${D.tex()}} = ${y.tex()}`] });
      steps.push({ title: "Проверка — подставляем в оба уравнения", tex: [
        `${a1.ptex()} \\cdot ${x.ptex()} + ${b1.ptex()} \\cdot ${y.ptex()} = ${a1.mul(x).add(b1.mul(y)).tex()}`,
        `${a2.ptex()} \\cdot ${x.ptex()} + ${b2.ptex()} \\cdot ${y.ptex()} = ${a2.mul(x).add(b2.mul(y)).tex()}`] });
      return { answer: [`x = ${x.tex()},\\quad y = ${y.tex()}`], answerText: `x = ${x.text()}, y = ${y.text()}`, steps };
    },
  };

  // ---- определитель 2×2 / 3×3
  SOLVERS.det = {
    fields: [["n", "размер"]],
    examples: [["2×2", { n: "2", m11: "3", m12: "1", m21: "4", m22: "2" }],
               ["3×3", { n: "3", m11: "2", m12: "0", m13: "1", m21: "1", m22: "3", m23: "2", m31: "1", m32: "1", m33: "1" }]],
    solve(p) {
      const n = p.n === "3" ? 3 : 2;
      const M = [];
      for (let i = 1; i <= n; i++) { const row = []; for (let j = 1; j <= n; j++) row.push(req(p[`m${i}${j}`], `элемент (${i}, ${j})`)); M.push(row); }
      const steps = [];
      const mat = `\\begin{vmatrix} ${M.map((r) => r.map((v) => v.tex()).join(" & ")).join(" \\\\ ")} \\end{vmatrix}`;
      steps.push({ title: `Определитель матрицы ${n}×${n}`, tex: [`\\Delta = ${mat}`] });
      let D;
      if (n === 2) {
        const [[a, b], [c, d]] = M;
        D = a.mul(d).sub(b.mul(c));
        steps.push({ title: "Произведение главной диагонали минус произведение побочной", tex: [`\\Delta = ${a.ptex()} \\cdot ${d.ptex()} - ${b.ptex()} \\cdot ${c.ptex()} = ${a.mul(d).tex()} - ${b.mul(c).ptex()} = ${D.tex()}`] });
      } else {
        const [[a, b, c], [d, e, f], [g, h, i]] = M;
        const plus = [[a, e, i], [b, f, g], [c, d, h]], minus = [[c, e, g], [a, f, h], [b, d, i]];
        const prod = (t) => t[0].mul(t[1]).mul(t[2]);
        const tt = (t) => t.map((v) => v.ptex()).join(" \\cdot ");
        steps.push({ title: "Правило Саррюса: три произведения «+» (главная диагональ и параллельные ей)", tex: plus.map((t) => `${tt(t)} = ${prod(t).tex()}`) });
        steps.push({ title: "Три произведения «−» (побочная диагональ и параллельные ей)", tex: minus.map((t) => `${tt(t)} = ${prod(t).tex()}`) });
        const sp = plus.map(prod).reduce((u, v) => u.add(v)), sm = minus.map(prod).reduce((u, v) => u.add(v));
        D = sp.sub(sm);
        steps.push({ title: "Сумма «+» минус сумма «−»", tex: [`\\Delta = (${plus.map((t) => prod(t).tex()).join(" + ")}) - (${minus.map((t) => prod(t).tex()).join(" + ")}) = ${sp.tex()} - ${sm.ptex()} = ${D.tex()}`] });
      }
      steps.push({ title: "Что это значит", text: D.isZero() ? "Δ = 0: матрица вырожденная, обратной нет, строки линейно зависимы." : "Δ ≠ 0: матрица невырожденная, у неё есть обратная; система с такой матрицей имеет единственное решение." });
      return { answer: [`\\Delta = ${D.tex()}`], answerText: `Δ = ${D.text()}`, steps };
    },
  };

  function req(v, name) {
    const f = parseFrac(v);
    if (f === null) throw new Error(`заполните поле ${name}`);
    return f;
  }

  function solve(kind, params) { return SOLVERS[kind].solve(params); }

  // ------------------------------------------------------------ интерфейс
  function tex(s, display) {
    const el = document.createElement(display ? "div" : "span");
    try { root.katex.render(s, el, { displayMode: !!display, throwOnError: false }); }
    catch (e) { el.textContent = s; }
    return el;
  }

  function renderResult(box, res) {
    box.innerHTML = "";
    const ans = document.createElement("div");
    ans.className = "solver-answer";
    const h = document.createElement("div");
    h.className = "solver-answer__label";
    h.textContent = "Ответ";
    ans.appendChild(h);
    res.answer.forEach((a) => ans.appendChild(tex(a, true)));
    box.appendChild(ans);
    const ol = document.createElement("ol");
    ol.className = "solver-steps";
    res.steps.forEach((s) => {
      const li = document.createElement("li");
      const t = document.createElement("div");
      t.className = "solver-steps__title";
      t.textContent = s.title;
      li.appendChild(t);
      if (s.text) { const pEl = document.createElement("p"); pEl.textContent = s.text; li.appendChild(pEl); }
      (s.tex || []).forEach((line) => li.appendChild(tex(line, true)));
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  function readParams(form) {
    const p = {};
    form.querySelectorAll("[name]").forEach((el) => { p[el.name] = el.value; });
    return p;
  }
  function fillParams(form, p) {
    form.querySelectorAll("[name]").forEach((el) => { if (p[el.name] !== undefined) el.value = p[el.name]; });
  }

  function mount(el) {
    const kind = el.dataset.solver;
    const S = SOLVERS[kind];
    if (!S) return;
    const form = el.querySelector("form");
    const out = el.querySelector(".solver-result");
    const err = el.querySelector(".solver-error");
    const exBox = el.querySelector(".solver-examples");
    const detGrid = el.querySelector(".det-grid");

    function syncDet() {
      if (!detGrid) return;
      const n = form.querySelector("[name=n]").value === "3" ? 3 : 2;
      detGrid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
      detGrid.querySelectorAll("input").forEach((inp) => {
        const [i, j] = [Number(inp.name[1]), Number(inp.name[2])];
        const on = i <= n && j <= n;
        inp.hidden = !on; inp.disabled = !on;
      });
    }
    if (detGrid) form.querySelector("[name=n]").addEventListener("change", syncDet);
    const modeSel = S.modes && form.querySelector("[name=mode]");
    function syncLabels() {
      if (!modeSel) return;
      const [, lx, ly] = S.modes[modeSel.value] || S.modes.of;
      form.querySelector("[data-label=x]").textContent = lx;
      form.querySelector("[data-label=y]").textContent = ly;
    }
    if (modeSel) { modeSel.addEventListener("change", syncLabels); syncLabels(); }

    function run(pushUrl) {
      err.textContent = "";
      syncDet();
      const p = readParams(form);
      try {
        const res = S.solve(p);
        renderResult(out, res);
        if (pushUrl) {
          const q = new URLSearchParams();
          Object.entries(p).forEach(([k, v]) => { if (String(v).trim() !== "") q.set(k, v); });
          history.replaceState(null, "", "?" + q.toString());
        }
        if (root.ym) try { root.ym(104554801, "reachGoal", "solver_solve", { solver: kind }); } catch (e) { /* метрика не критична */ }
      } catch (e) {
        out.innerHTML = "";
        err.textContent = "⚠ " + (e.message || "не получилось решить");
      }
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); run(true); });

    (S.examples || []).forEach(([label, params]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "solver-example"; b.textContent = label;
      b.addEventListener("click", () => { fillParams(form, params); syncDet(); syncLabels(); run(true); });
      exBox && exBox.appendChild(b);
    });

    const q = Object.fromEntries(new URLSearchParams(location.search));
    if (Object.keys(q).length) fillParams(form, q);
    else if (S.examples && S.examples[0]) fillParams(form, S.examples[0][1]);
    syncLabels();
    run(false);
  }

  root.KvasichSolvers = { Frac, parseFrac, solve, sqrtSplit, primeFactors };
  if (typeof module !== "undefined" && module.exports) module.exports = root.KvasichSolvers;
  if (typeof document !== "undefined") {
    const start = () => document.querySelectorAll(".solver[data-solver]").forEach(mount);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(typeof window !== "undefined" ? window : globalThis);
