import type { CoursePack } from "@/lib/coursepack/schema";
import { buildDeck } from "@/lib/deck/buildDeck";
import type { DeckSlide } from "@/lib/deck/types";

/** Escape user content for safe HTML embedding. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** LTR-isolated inline span — same contract as the <Ltr> component (spec §6). */
function ltr(s: string): string {
  return `<bdi dir="ltr" style="unicode-bidi:isolate;direction:ltr">${esc(s)}</bdi>`;
}

function stars(level: number): string {
  return level > 0 ? `<span class="star">${"★".repeat(level)}</span> ` : "";
}

function callout(cls: string, label: string, body: string): string {
  return `<div class="callout ${cls}"><span class="lbl">${esc(label)}</span> ${body}</div>`;
}

function slideBody(s: DeckSlide, isHe: boolean): string {
  const p = s.payload;
  switch (p.kind) {
    case "title":
      return `<div class="center"><h1>${esc(s.title)}</h1><p class="sub">${esc(
        p.subject,
      )}</p><p class="pill">${isHe ? "מבחן" : "Exam"} · ${esc(p.examDate)} · ${
        p.blockCount
      } ${isHe ? "נושאים" : "topics"}</p></div>`;

    case "toc":
      return `<ol class="toc">${p.entries
        .map(
          (e, i) =>
            `<li><a href="#${e.slideId}">${i + 1}. ${stars(e.starLevel)}${esc(
              e.title,
            )}${e.enTitle ? " " + ltr(`(${e.enTitle})`) : ""}</a></li>`,
        )
        .join("")}</ol>`;

    case "concept":
      if (p.concepts.length === 0) return `<p class="sub">${esc(s.subtitle ?? "")}</p>`;
      return p.concepts
        .map(
          (c) =>
            `<div class="concept"><p class="term">${esc(c.term)}${
              c.enTerm ? " " + ltr(`(${c.enTerm})`) : ""
            }</p><p>${esc(c.explanation)}</p></div>`,
        )
        .join("");

    case "formula":
      return p.formulas
        .map(
          (f) =>
            `<div class="formula"><div class="fx">${ltr(f.latexOrText)}</div>${
              f.intuition ? `<div class="intu">${esc(f.intuition)}</div>` : ""
            }${
              f.termKey.length
                ? `<div class="tk">${f.termKey
                    .map((k) => `${ltr(k.symbol)} = ${esc(k.meaning)}`)
                    .join(" · ")}</div>`
                : ""
            }</div>`,
        )
        .join("");

    case "example": {
      const ex = p.examples
        .map((e) =>
          callout(
            "example",
            isHe ? "דוגמה" : "Example",
            esc(e.text) + (e.sourceRef ? " " + ltr(`[${e.sourceRef}]`) : ""),
          ),
        )
        .join("");
      const mi = p.mistakes
        .map((m) => callout("mistake", isHe ? "טעות נפוצה" : "Common mistake", esc(m)))
        .join("");
      const ti = p.tips
        .map((tp) => callout("tip", isHe ? "טיפ למבחן" : "Exam tip", esc(tp)))
        .join("");
      return ex + mi + ti;
    }

    case "summary-comparisons":
      return p.pairs
        .map(
          (pr) =>
            `<div class="cmp"><p class="term">${esc(pr.title)}</p><div class="cmp-grid"><div class="cmp-cell"><div class="fx-sm">${ltr(
              pr.left,
            )}</div><p>${esc(isHe ? "שמאלי" : "left")}: ${esc(pr.whenLeft)}</p></div><div class="cmp-cell"><div class="fx-sm">${ltr(
              pr.right,
            )}</div><p>${esc(isHe ? "ימני" : "right")}: ${esc(pr.whenRight)}</p></div></div></div>`,
        )
        .join("");

    case "summary-concepts-traps":
      return `${
        p.criticalConcepts.length
          ? `<h3 class="kc">${isHe ? "מושגי מפתח" : "Critical concepts"}</h3><ul>${p.criticalConcepts
              .map((c) => `<li>${esc(c)}</li>`)
              .join("")}</ul>`
          : ""
      }${
        p.traps.length
          ? `<h3 class="tr">${isHe ? "מלכודות" : "Traps"}</h3><ul>${p.traps
              .map((c) => `<li>${esc(c)}</li>`)
              .join("")}</ul>`
          : ""
      }`;

    case "summary-sanity":
      return `${
        p.typicalValues.length
          ? `<table class="sanity"><thead><tr><th>${isHe ? "פרמטר" : "Parameter"}</th><th>${
              isHe ? "טווח" : "Range"
            }</th></tr></thead><tbody>${p.typicalValues
              .map(
                (v) =>
                  `<tr><td>${esc(v.param)}</td><td>${ltr(v.range)}${
                    v.note ? `<br><small>${esc(v.note)}</small>` : ""
                  }</td></tr>`,
              )
              .join("")}</tbody></table>`
          : ""
      }${
        p.checklist.length
          ? `<h3 class="tip-h">${isHe ? "צ׳קליסט" : "Checklist"}</h3><ul class="check">${p.checklist
              .map((c) => `<li>${esc(c)}</li>`)
              .join("")}</ul>`
          : ""
      }`;

    case "closing":
      return `<div class="center"><h1>${esc(s.title)}</h1><p class="sub">${esc(
        p.examDate,
      )}</p></div>`;
  }
}

function slideMarkup(s: DeckSlide, isHe: boolean): string {
  const centered = s.kind === "title" || s.kind === "closing";
  const head = centered
    ? ""
    : `<header><h2>${stars(s.starLevel)}${esc(s.title)}${
        s.enTitle ? " " + ltr(`(${s.enTitle})`) : ""
      }</h2>${
        s.subtitle && s.kind !== "concept"
          ? `<p class="frame">${esc(s.subtitle)}</p>`
          : ""
      }</header>`;
  return `<section class="slide${centered ? " centered" : ""}" id="${s.id}">${head}<div class="body">${slideBody(
    s,
    isHe,
  )}</div></section>`;
}

/**
 * Self-contained, offline-capable deck HTML (spec §4.3, §8, §11 #7):
 * inline CSS + inline vanilla JS, zero external/runtime deps. Formulas stay
 * LTR-isolated so RTL decks export uncorrupted.
 */
export function exportDeckHtml(pack: CoursePack): string {
  const slides = buildDeck(pack);
  const { course } = pack;
  const isHe = course.outputLanguage === "he";
  const dir = course.direction;

  const sections = slides.map((s) => slideMarkup(s, isHe)).join("\n");
  const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  return `<!DOCTYPE html>
<html lang="${esc(course.language)}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(course.title)} — ${isHe ? "מצגת" : "Deck"}</title>
<style>
  :root{--navy:#1f3a5f;--orange:#e07a2b;--ink:#16202c;--muted:#5b6b7b;--lines:#d8dee6;--paper:#fff;--fxbg:#16202c;--fxink:#f2f6fb}
  *{box-sizing:border-box}
  html,body{height:100%;margin:0;font-family:"Heebo","Assistant",system-ui,-apple-system,Arial,sans-serif;background:#eef1f5;color:var(--ink)}
  #bar{height:5px;background:var(--lines)}
  #fill{height:100%;width:0;background:var(--orange);transition:width .15s}
  #stage{display:flex;align-items:center;justify-content:center;height:calc(100% - 5px - 44px);padding:clamp(.5rem,2vw,2rem)}
  .deck{aspect-ratio:16/9;width:100%;max-width:1100px;max-height:100%;background:var(--paper);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden}
  .slide{display:none;flex-direction:column;height:100%;padding:clamp(1rem,3vw,2.5rem)}
  .slide.active{display:flex}
  .slide.centered{align-items:center;justify-content:center;text-align:center}
  header{flex:0 0 auto;border-bottom:1px solid var(--lines);padding-bottom:.5rem;margin-bottom:.75rem}
  header h2{margin:0;color:var(--navy);font-size:1.7rem;display:flex;gap:.5rem;flex-wrap:wrap;align-items:baseline}
  .frame{margin:.25rem 0 0;color:var(--muted);font-style:italic;font-size:.95rem}
  .body{flex:1 1 auto;min-height:0;overflow-y:auto}
  .center h1{color:var(--navy);font-size:2.6rem;margin:0}
  .sub{color:var(--muted);font-size:1.2rem}
  .pill{display:inline-block;background:rgba(224,122,43,.15);color:var(--orange);font-weight:600;border-radius:999px;padding:.4rem 1rem}
  .star{color:var(--orange)}
  bdi{font-family:ui-monospace,"SFMono-Regular",Menlo,monospace}
  .toc{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
  .toc a{display:block;border:1px solid var(--lines);border-radius:10px;padding:.7rem;text-decoration:none;color:var(--navy);font-weight:600}
  .concept{border-inline-start:4px solid #2563eb;background:#eff4ff80;border-radius:8px;padding:.7rem;margin-bottom:.6rem}
  .term{font-weight:700;margin:0 0 .25rem}
  .concept p:last-child{margin:0;color:#16202cd9}
  .formula{background:var(--fxbg);border-inline-start:4px solid var(--orange);border-radius:8px;padding:.7rem 1rem;margin:.5rem 0;color:var(--fxink)}
  .formula .fx{font-size:1.3rem}
  .formula .fx bdi{color:var(--fxink)}
  .intu{color:#cdd6e0;font-size:.95rem;margin-top:.3rem}
  .tk{color:#9fb0c2;font-size:.85rem;margin-top:.3rem;border-top:1px solid #ffffff22;padding-top:.3rem}
  .callout{border-inline-start:3px solid;border-radius:8px;padding:.5rem .8rem;margin:.5rem 0}
  .callout .lbl{font-weight:700;text-transform:uppercase;font-size:.78rem;margin-inline-end:.4rem}
  .callout.example{border-color:#b45309;background:#fdf4e3}.callout.example .lbl{color:#b45309}
  .callout.mistake{border-color:#c0322b;background:#fdecec}.callout.mistake .lbl{color:#c0322b}
  .callout.tip{border-color:#15803d;background:#ecfaf0}.callout.tip .lbl{color:#15803d}
  .cmp{margin-bottom:1rem}.cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
  .cmp-cell{border:1px solid var(--lines);border-radius:8px;padding:.6rem}
  .fx-sm bdi,.fx bdi{font-weight:600}
  .kc{color:#2563eb}.tr{color:#c0322b}.tip-h{color:#15803d}
  .sanity{width:100%;border-collapse:collapse}.sanity th,.sanity td{text-align:start;border-bottom:1px solid var(--lines);padding:.3rem}
  .check{list-style:none;padding-inline-start:0}.check li{padding-inline-start:1.2rem;position:relative}
  .check li::before{content:"";position:absolute;inset-inline-start:0;top:.35em;width:.7em;height:.7em;border:1px solid #15803d;border-radius:3px}
  #nav{height:44px;display:flex;align-items:center;justify-content:center;gap:1.5rem;border-top:1px solid var(--lines);background:var(--paper)}
  #nav button{border:1px solid var(--lines);background:var(--paper);border-radius:8px;padding:.25rem .8rem;font-size:1rem;cursor:pointer}
  #nav button:disabled{opacity:.4;cursor:default}
  #count{font-family:ui-monospace,monospace;color:var(--muted);direction:ltr;unicode-bidi:isolate}
  header h2 bdi{font-size:.6em;font-weight:500;color:var(--muted)}
  @media (prefers-reduced-motion:reduce){#fill{transition:none}}
</style>
</head>
<body>
<div id="bar"><div id="fill"></div></div>
<div id="stage"><div class="deck" id="deck">
${sections}
</div></div>
<div id="nav">
  <button id="prev" aria-label="prev">${dir === "rtl" ? "→" : "←"}</button>
  <span id="count"></span>
  <button id="next" aria-label="next">${dir === "rtl" ? "←" : "→"}</button>
</div>
<script>
(function(){
  var slides=Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var i=0, n=slides.length;
  var fill=document.getElementById('fill'), count=document.getElementById('count');
  var prev=document.getElementById('prev'), next=document.getElementById('next');
  function show(k){
    i=Math.max(0,Math.min(n-1,k));
    slides.forEach(function(s,j){s.classList.toggle('active',j===i);});
    fill.style.width=(n>1?(i/(n-1)*100):100)+'%';
    count.textContent=(i+1)+' / '+n;
    prev.disabled=i===0; next.disabled=i===n-1;
  }
  prev.onclick=function(){show(i-1)};
  next.onclick=function(){show(i+1)};
  document.addEventListener('keydown',function(e){
    if(e.key==='${fwd}'||e.key===' '||e.key==='PageDown'){e.preventDefault();show(i+1);}
    else if(e.key==='${back}'||e.key==='PageUp'){e.preventDefault();show(i-1);}
    else if(e.key==='Home'){e.preventDefault();show(0);}
    else if(e.key==='End'){e.preventDefault();show(n-1);}
  });
  document.querySelectorAll('.toc a').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      var id=a.getAttribute('href').slice(1);
      var idx=slides.findIndex(function(s){return s.id===id;});
      if(idx>=0)show(idx);
    });
  });
  show(0);
})();
</script>
</body>
</html>`;
}
