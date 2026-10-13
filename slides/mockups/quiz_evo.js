// Child of evo-3 (percentage spectrum) and evo-5 (big stat callouts): one axis where each
// option is a marker with a huge number above it. Run from slides/:
//   NODE_PATH=$PWD/node_modules node mockups/quiz_evo.js
const sharp = require("sharp");
const path = require("path");

const W = 2000, H = 1125;
const C = {
  bg: "D6DDE5", navy: "1B365D", blue: "2F5F98", red: "A94A4A",
  white: "FFFFFF", muted: "56636F", text: "2B3440", border: "8C9BAD",
};

const QLINE1 = "AA-Omniscience is a test of very hard questions.";
const QLINE2 = 'A good AI should say "I don\'t know". How often does the best model still answer wrongly?';
const OPTS = [
  { letter: "A", label: "Almost never", sub: "0 to 5% of questions", big: "0-5%" },
  { letter: "B", label: "About one in five", sub: "around 20%", big: "~20%" },
  { letter: "C", label: "About half", sub: "around 50%", big: "~50%" },
  { letter: "D", label: "Nearly always", sub: "over 90%", big: "90%+" },
];

const T = (x, y, size, color, o = {}) =>
  `<text x="${x}" y="${y}" font-family="Calibri, Arial, sans-serif" font-size="${size}" fill="#${color}"` +
  ` font-weight="${o.bold ? "bold" : "normal"}" text-anchor="${o.anchor || "start"}">${o.t}</text>`;
const R = (x, y, w, h, fill, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 0}" fill="#${fill}"/>`;
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${fill}"/>`;
const line = (x1, y1, x2, y2, col, w) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#${col}" stroke-width="${w}"/>`;

function child() {
  const ax = 150, aw = 1700, ay = 800;
  const marks = [0.05, 0.20, 0.50, 0.90];
  // deco: mini dot plot like the AA chart, top right of the question band
  const dots = [[0.62, 0.30, C.red], [0.70, 0.42, C.blue], [0.78, 0.52, "1F7A7A"], [0.86, 0.36, C.navy], [0.55, 0.60, C.blue], [0.68, 0.70, C.red]]
    .map(([px, py, col]) => circle(1300 + px * 560, 300 + py * 140, 13, col)).join("\n");
  const ticks = OPTS.map((o, i) => {
    const x = ax + marks[i] * aw;
    const row = i % 2 === 0 ? 150 : 214; // stagger labels so close ticks never collide
    return [
      T(x, ay - 124, 96, C.navy, { t: o.big, bold: true, anchor: "middle" }),
      circle(x, ay, 24, C.navy),
      circle(x, ay + 70, 34, C.navy),
      T(x, ay + 82, 30, C.white, { t: o.letter, bold: true, anchor: "middle" }),
      T(x, ay + row, 36, C.navy, { t: o.label, bold: true, anchor: "middle" }),
      T(x, ay + row + 46, 26, C.muted, { t: o.sub, anchor: "middle" }),
    ];
  }).flat().join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${R(0, 0, W, 560, C.white)}
  ${R(0, 560, W, H - 560, C.bg)}
  ${T(70, 150, 26, C.red, { t: "QUICK QUIZ", bold: true })}
  ${T(70, 280, 36, C.navy, { t: QLINE1, bold: true })}
  ${T(70, 340, 36, C.navy, { t: QLINE2, bold: true })}
  ${T(70, 420, 28, C.muted, { t: "One test, 369 models. Pick the spot on the scale that matches the best model's wrong-answer rate." })}
  ${dots}
  ${line(ax, ay, ax + aw, ay, C.border, 3)}
  ${ticks}
</svg>`;
}

(async () => {
  const out = path.join(__dirname, "quiz-evo-child.png");
  await sharp(Buffer.from(child())).png().toFile(out);
  console.log(`wrote ${out}`);
})();
