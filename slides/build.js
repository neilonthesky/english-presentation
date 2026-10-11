// Builds slides/deck.pptx: the FrameForge SaaS customer support presentation (paper v36, three levels).
// Run: node build.js   (from the slides/ directory), or ./render.sh to also validate and render.
// Style: light-to-mid blue/grey/teal tones, borderless cards, solid fills, no glow or shadow,
// no dark theme, no yellow/orange. Photographs live in assets/ and are generated for this deck.
// Tones: grey = Level 1 and fixed code, mid blue = Level 2 and models, deep blue = Level 3, teal = written rules.
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const lu = require("react-icons/lu");
const { addTransitions } = require("./transitions");
const { CASES, FIELDS } = require("./cases");

const C = {
  bg: "D6DDE5", // soft cool light tone (slide background)
  card: "FFFFFF",
  border: "8C9BAD",
  navy: "1B365D", // titles
  text: "2B3440",
  muted: "56636F",
  blue: "2F5F98", // model, primary
  blueL: "A6BCD6",
  grey: "5F6B7A", // fixed code, Level 1
  greyL: "AEB7C2",
  teal: "1F7A7A", // written rules
  tealL: "A2C4BE",
  l2: "4A82B8", // Level 2
  l3: "234B84", // Level 3
  red: "A94A4A", // errors and unsafe runs
  white: "FFFFFF",
};
const FONT = "Calibri";
const TITLE = "Human to LLM & Classifier Support Agent: A Three-Level Ladder for SaaS Request Triage";

// Speakers and speaking time per slide (the times of the two deleted slides are gone; talk_notes holds the full split).
const LONG = "Tran Thanh Long", NAM = "Nguyen Thanh Nam", SON = "Vu Van Son", QUY = "Vuong Quang Quy", PNAM = "Nguyen Phuong Nam";
const SPEAKER = [
  [LONG, 67], [LONG, 98], [LONG, 98],
  [LONG, 12], // many rules
  [LONG, 23], [LONG, 26], [LONG, 26], [LONG, 24], // written rules, flow, Triage, Gather info
  [LONG, 22], [LONG, 12], [LONG, 12], // the three walk-throughs (CASES in cases.js): every click is its own slide, so these seconds cover all of them
  [NAM, 41], [NAM, 39], [NAM, 40], // test data, request families, outcomes
  [SON, 42], [SON, 38], [SON, 40], // the run, models and prices, Result 1
  [QUY, 40], [QUY, 38], [QUY, 42], // the confidence of Jev, Result 2, the ablation of the fixed check
  [PNAM, 30], [PNAM, 55], [PNAM, 35], // related work, limits, conclusion
];

// ---------- icon and illustration helpers ----------
function iconSvg(name, color, size) {
  const svg = renderToStaticMarkup(React.createElement(lu[name], { size, color, strokeWidth: 2 }));
  return svg.replace(/currentColor/g, color);
}
const iconCache = {};
async function iconPng(name, color = "#FFFFFF") {
  const key = name + color;
  if (!iconCache[key]) {
    const buf = await sharp(Buffer.from(iconSvg(name, color, 256)), { density: 300 }).resize(256, 256).png().toBuffer();
    iconCache[key] = "image/png;base64," + buf.toString("base64");
  }
  return iconCache[key];
}

// Photographs in assets/ were generated for this deck. Each is cropped to its exact
// frame and gets rounded corners baked into the alpha, matching the rounded cards.
async function photo(file, w, h, radius = 0.08, dpi = 150) {
  const W = Math.round(w * dpi), H = Math.round(h * dpi), r = Math.round(radius * dpi);
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
  const buf = await sharp(fs.readFileSync(file))
    .resize(W, H, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pres.title = TITLE;
  pres.author = "Phenikaa School of Computing";

  const ML = 0.6; // left/right margin
  const CW = 13.333 - 2 * ML; // content width

  const ICONS = [
    "LuBot", "LuUsers", "LuTags", "LuScale", "LuMessageSquareText", "LuUserCheck", "LuShieldCheck",
    "LuMail", "LuDatabase", "LuZap", "LuFileText", "LuTarget", "LuTimer", "LuBadgeCheck", "LuHourglass",
    "LuTriangleAlert", "LuFlaskConical", "LuShieldX", "LuDollarSign", "LuMessageCircle", "LuCircleCheck",
    "LuCpu", "LuGauge", "LuLock", "LuUser",
  ];
  const img = {};
  for (const n of ICONS) img[n] = await iconPng(n);
  const shots = {
    machine: await photo("assets/machine.jpg", 2.4, 2.4),
    human: await photo("assets/human.jpg", 2.4, 2.4),
  };

  function base(n, title, notes, withSpeaker = true, titleName, titleBox = {}) {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addText(title, { x: ML, y: 0.4, w: CW, h: 0.95, margin: 0, fontFace: FONT, fontSize: 34, bold: true, color: C.navy, valign: "middle", objectName: titleName, ...titleBox });
    s.slideNumber = { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted };
    const [name, secs] = SPEAKER[n - 1];
    s.addNotes(withSpeaker ? `Speaker: ${name}, about ${secs} s. ${notes}` : notes);
    return s;
  }

  // Cards are solid white with no outline; the tinted background separates them.
  const box = (s, x, y, w, h, o = {}) =>
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h, rectRadius: o.radius ?? 0.08, fill: { color: o.fill || C.card },
      ...(o.line ? { line: { color: o.line, width: o.lineW ?? 1 } } : {}),
    });

  // Text-box margins are given in inches ([top, right, bottom, left] or one number);
  // pptxgenjs wants points, and array order [left, right, bottom, top].
  const pts = (m) => (Array.isArray(m) ? [m[3] * 72, m[1] * 72, m[2] * 72, m[0] * 72] : (m || 0) * 72);

  function textBox(s, runs, x, y, w, h, o = {}) {
    s.addText(runs, {
      x, y, w, h, margin: pts(o.margin), fontFace: FONT, fontSize: o.size || 16, bold: o.bold,
      color: o.color || C.text, valign: o.valign || "top", align: o.align || "left", paraSpaceAfter: o.gap ?? 0,
      shape: o.shape, rectRadius: o.shape ? 0.08 : undefined,
      fill: o.fill ? { color: o.fill } : undefined, line: o.line ? { color: o.line, width: 1 } : undefined,
    });
  }

  function iconCircle(s, name, x, y, d, bg) {
    s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 1 } });
    const p = d * 0.22;
    s.addImage({ data: img[name], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }

  // Card with an icon circle, a big figure, and a caption underneath.
  function statCard(s, x, y, w, h, o) {
    box(s, x, y, w, h);
    iconCircle(s, o.icon, x + 0.3, y + 0.28, 0.75, o.bg || C.blue);
    textBox(s, o.big, x + 1.3, y + 0.2, w - 1.5, 0.95, { size: o.bigSize || 36, bold: true, color: o.color || C.blue, valign: "middle" });
    textBox(s, o.label, x + 0.3, y + (o.labelY ?? 1.3), w - 0.6, h - (o.labelY ?? 1.3) - 0.1, { size: 15 });
  }

  // Card with the icon on the left, the figure and a caption on the right.
  function callout(s, x, y, w, h, o) {
    box(s, x, y, w, h);
    const bigH = o.bigH ?? 0.62, bigY = o.bigY ?? 0.12;
    iconCircle(s, o.icon, x + 0.25, y + 0.25, 0.7, o.color);
    textBox(s, o.big, x + 1.15, y + bigY, w - 1.3, bigH, { size: o.bigSize || 30, bold: true, color: o.color, valign: "middle" });
    textBox(s, o.label, x + 1.15, y + bigY + bigH + 0.02, w - 1.35, h - bigY - bigH - 0.1, { size: o.labelSize || 14 });
  }

  const line = (s, x, y, w, h, o = {}) =>
    s.addShape(pres.ShapeType.line, {
      x, y, w, h, flipH: o.flipH, flipV: o.flipV,
      line: { color: o.color || C.grey, width: 2, dashType: o.dash, endArrowType: o.arrow ? "triangle" : undefined },
    });

  const bullets = (items) =>
    items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1 } }));

  const band = (s, y, h, icon, runs, color = C.teal) => {
    box(s, ML, y, CW, h, { fill: color });
    s.addImage({ data: img[icon], x: ML + 0.3, y: y + h / 2 - 0.25, w: 0.5, h: 0.5 });
    textBox(s, runs, ML + 1.05, y, CW - 1.35, h, { size: 18, color: C.white, valign: "middle" });
  };

  const chartBase = {
    showTitle: true, titleFontSize: 15, titleFontFace: FONT, titleColor: C.text,
    showLegend: true, legendPos: "b", legendFontSize: 14, legendFontFace: FONT, legendColor: C.text,
    showValue: true, dataLabelFontSize: 14, dataLabelFontFace: FONT, dataLabelColor: C.text,
    catAxisLabelColor: C.text, catAxisLabelFontSize: 14, catAxisLabelFontFace: FONT,
    valAxisLabelColor: C.muted, valAxisLabelFontSize: 12, valAxisMinVal: 0, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
  };

  // ---------- 1. Title ----------
  // One grid: margin 0.7 on every side. Left: the title and the team, from x 0.7 to 6.6. Right: a light panel from x 6.9 with the three
  // levels as a staircase from x 7.6 to 12.63. The top of the header and of the tallest step is y 0.7; the last name and the base of the steps are y 6.8.
  {
    const s = pres.addSlide();
    s.background = { color: C.l3 };
    const M = 0.7, LW = 5.9, PX = 6.9, SX = PX + 0.7, SW = 13.333 - 0.7 - SX, light = "E3ECF6";
    s.addShape(pres.ShapeType.rect, { x: PX, y: 0, w: 13.333 - PX, h: 7.5, fill: { color: C.bg }, line: { color: C.bg, width: 0 } });

    s.addText(
      [{ text: "Phenikaa School of Computing", options: { bold: true, breakLine: true } }, { text: "English Writing and Presentation Skills \u00b7 October 2026" }],
      { x: M, y: 0.7, w: LW, h: 0.65, margin: 0, fontFace: FONT, fontSize: 16, color: light, valign: "top", paraSpaceAfter: 2 }
    );
    s.addText("Human to LLM\n& Classifier\nSupport Agent", { x: M, y: 1.7, w: LW, h: 2.3, margin: 0, fontFace: FONT, fontSize: 46, bold: true, color: C.white, valign: "top" });
    s.addText("A Three-Level Ladder for SaaS Request Triage", { x: M, y: 4.05, w: LW, h: 0.5, margin: 0, fontFace: FONT, fontSize: 22, color: light, valign: "middle" });
    s.addText("Team", { x: M, y: 4.98, w: LW, h: 0.32, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: light, valign: "middle" });
    const team = [LONG, NAM, SON, QUY, PNAM];
    s.addText(team.map((t, i) => ({ text: t, options: { breakLine: i < team.length - 1 } })), {
      x: M, y: 5.3, w: LW, h: 1.5, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, valign: "top",
    });

    // The question above the low steps fills the corner that a staircase leaves empty.
    s.addText("Who should answer a customer?", { x: SX, y: 0.7, w: 3.2, h: 1.3, margin: 0, fontFace: FONT, fontSize: 26, bold: true, color: C.navy, valign: "top" });
    // The staircase: each step is taller than the one before, as each level adds a change.
    const stepW = SW / 3, top = 0.7, floor = 6.8, rise = (floor - top) / 3;
    [
      { icon: "LuUsers", fill: C.grey, tag: "Level 1", name: "Staff" },
      { icon: "LuBot", fill: C.l2, tag: "Level 2", name: "LLM agent" },
      { icon: "LuTags", fill: C.l3, tag: "Level 3", name: "Jev + LLM" },
    ].forEach((st, i) => {
      const h = rise * (i + 1), x = SX + i * stepW, y = floor - h;
      s.addShape(pres.ShapeType.rect, { x, y, w: stepW, h, fill: { color: st.fill }, line: { color: st.fill, width: 0 } });
      s.addImage({ data: img[st.icon], x: x + 0.22, y: y + 0.3, w: 0.5, h: 0.5 });
      s.addText(
        [{ text: st.tag, options: { fontSize: 15, bold: true, color: C.white, breakLine: true } }, { text: st.name, options: { fontSize: 20, bold: true, color: C.white } }],
        { x: x + 0.22, y: y + 0.95, w: stepW - 0.3, h: 0.7, margin: 0, fontFace: FONT, valign: "top" }
      );
    });
    s.addNotes(
      `Speaker: ${LONG}, about ${SPEAKER[0][1]} s. Good morning. A customer waits two days for a refund; a chatbot that handles money can do harm. ` +
        "We study three levels of customer support for FrameForge, a made-up AI video-generation SaaS: support staff, one LLM agent, and Jev with an LLM."
    );
  }

  // ---------- 2. Where we start ----------
  {
    const s = base(
      2,
      "Where we start: staff or one LLM agent",
      "Level 1: support staff read every request. No model runs, so no model error, but each request takes an assumed 90 s and the cost grows with every request. " +
        "Level 2: one LLM agent reads the chat and the whole account and applies the written rules itself. Nothing fixed stands behind its answer, and an order hidden in a text can reach it. " +
        "Our question: can an AI agent serve fast and cheap without risk to money and data? " +
        "Opening interaction by the leader: raise your hand if you waited over 24 hours for support; then the poll: which action would you never let a chatbot do alone (refund, plan cancellation, password reset, data deletion)? The written rules always deny data deletion in chat."
    );
    const cw = (CW - 0.4) / 2, y = 1.65, h = 3.5;
    [
      { x: ML, shot: shots.human, head: "Level 1: staff only",
        items: ["No model, so no model error", "90 s per request (assumed)", "Cost and wait grow with every request"] },
      { x: ML + cw + 0.4, shot: shots.machine, head: "Level 2: one LLM agent",
        items: ["It reads the chat and the account", "It applies the written rules itself", "No fixed code stands behind it"] },
    ].forEach((p) => {
      box(s, p.x, y, cw, h);
      s.addImage({ data: p.shot, x: p.x + 0.35, y: y + 0.55, w: 2.4, h: 2.4 });
      textBox(s, p.head, p.x + 3.0, y + 0.45, cw - 3.25, 0.8, { size: 22, bold: true, color: C.navy });
      s.addText(bullets(p.items), {
        x: p.x + 3.0, y: y + 1.35, w: cw - 3.2, h: 1.9, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 8, valign: "top",
      });
    });
    textBox(
      s,
      [{ text: "Our question: ", options: { bold: true } }, { text: "can an AI agent serve fast and cheap without risk to money and data?" }],
      ML, 5.45, CW, 1.2,
      { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, size: 24, margin: 0.35, valign: "middle" }
    );
  }

  // ---------- 3. The ladder ----------
  {
    const s = base(
      3,
      "Three levels, one change at each level",
      "Level 1 is the baseline: support staff read every request, 90 s each (assumed). " +
        "Level 2 replaces the staff with one LLM agent that reads the account, applies the written rules itself, and either runs an action or denies it. " +
        "Level 3 replaces the agent with Jev: Jev reads the chat, the account, and the written rules as context, and gives typed answers, each with a confidence; the process follows its answer, and the LLM writes the reply. " +
        "Every level runs on the same 100 requests. " +
        "Opening interaction by the leader: which level is faster and cheaper, Level 2 or Level 3? The answer is not given here; the results show it. Now, the rules."
    );
    const gap = 0.45, cw = (CW - 2 * gap) / 3, y = 1.65, h = 4.05;
    [
      { n: "Level 1", head: "Staff only", icon: "LuUsers", bg: C.grey, body: "Support staff read every request. Baseline: 90 s each (assumed)." },
      { n: "Level 2", head: "One LLM agent", icon: "LuBot", bg: C.l2, body: "One LLM agent reads the account and applies the written rules itself. It runs an action or denies it." },
      { n: "Level 3", head: "Jev + LLM", icon: "LuTags", bg: C.l3, body: "Jev reads the chat, the account, and the rules, and decides. The process follows its answer. The LLM writes the reply." },
    ].forEach((p, i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, p.icon, x + 0.3, y + 0.3, 0.8, p.bg);
      textBox(s, p.n, x + 0.3, y + 1.25, cw - 0.6, 0.35, { size: 15, bold: true, color: p.bg });
      textBox(s, p.head, x + 0.3, y + 1.6, cw - 0.6, 0.85, { size: 22, bold: true, color: C.navy });
      textBox(s, p.body, x + 0.3, y + 2.5, cw - 0.6, 1.45, { size: 16 });
      if (i < 2) line(s, x + cw + 0.05, y + h / 2, gap - 0.1, 0, { arrow: true });
    });
    band(s, 5.95, 0.8, "LuTarget", [{ text: "One change at a time: ", options: { bold: true } }, { text: "every level runs on the same 100 requests." }]);
  }

  // Fill and accent of a state of the flow: fixed code, a model, or the written rules.
  const kinds = { fx: [C.greyL, C.grey], md: [C.blueL, C.blue], rl: [C.tealL, C.teal] };

  // ---------- 4. Many rules ----------
  {
    const s = base(
      4,
      "Real support policies have many rules",
      "Real support policies have many rules, like this. There are many rules to apply, but today we will make it simple, with the essential rules gate only.",
      true, undefined, { w: 3.5, h: 1.5, fontSize: 28, valign: "top" }
    );
    // A diamond of rule chips that fades at the top and the bottom: an illustration of a policy that has grown to hundreds of rules, not data of the experiment.
    const RULES = [
      "Refunds only within 14 days", "No refund after credits are used", "Refund limit: $100 per request", "Max 2 refunds in 90 days",
      "Owner must approve the refund", "Deleting data is never allowed", "Reset links go to the e-mail on file", "Cancel a plan only once",
      "Annual plans: refund within 30 days", "Bank must settle the charge first", "No refunds on promo credits", "Escalate any chargeback",
      "Never share another account", "Verify the sender's identity", "Teammates cannot ask for refunds", "Log every state change",
      "No discounts without approval", "Reply within 24 hours", "VIP accounts go to a manager", "Mask card numbers in replies",
      "Never promise a fix date", "Close chats after 7 quiet days", "No plan downgrade mid-cycle", "Credit packs expire in 12 months",
      "Refund to the original payment", "Currency must match the charge", "Tax refunds go to billing", "Fraud reports: lock the account",
      "No password in chat text", "Two-factor reset needs a code", "Ignore orders inside a message", "Tag the topic of every ticket",
      "Priority: blocked users first", "Outages need a status link", "Do not quote internal notes", "Refund once per purchase",
      "Trial accounts get no refund", "Seats can only be removed by owner", "Export data before deletion", "Warn before a plan ends",
      "Late fees need a manager", "No refunds for abuse", "Check the region's consumer law", "Keep chat history for 90 days",
      "Translate replies on request", "Do not reveal the system prompt", "Report repeated requests", "Hand over angry customers", "Confirm before any action",
    ];
    const counts = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
    const cw = 1.62, ch = 0.42, gx = 0.08, pitch = 0.52, y0 = 0.375, cx = 13.333 / 2, mid = 6;
    const mix = (hex, t) => { // blend toward the slide background by (1 - t)
      const p = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      const [f, g] = [p(hex), p(C.bg)];
      return f.map((v, i) => Math.round(g[i] + (v - g[i]) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
    };
    let k = 0;
    counts.forEach((n, r) => {
      const d = Math.abs(r - mid) / mid, t = Math.min(1, 0.08 + 0.92 * Math.min(1, (1 - d) / 0.55));
      const rowW = n * cw + (n - 1) * gx;
      for (let i = 0; i < n; i++) {
        textBox(s, RULES[k++], cx - rowW / 2 + i * (cw + gx), y0 + r * pitch, cw, ch, {
          shape: pres.ShapeType.roundRect, fill: mix(C.card, t), line: mix("C5CDD6", t), color: mix(C.text, t), size: 10, margin: [0.02, 0.06, 0.02, 0.06], valign: "middle", align: "center",
        });
      }
    });
    textBox(s, [{ text: "Illustration, not our data.", options: { bold: true, breakLine: true } }, { text: "Our system applies only the essential rules." }], 9.6, 6.15, 3.1, 0.85, {
      shape: pres.ShapeType.roundRect, fill: C.teal, color: C.white, size: 14, margin: [0.08, 0.15, 0.08, 0.15], valign: "middle",
    });
  }

  // ---------- 4. The written rules ----------
  {
    const s = base(
      5,
      "The written rules: allow or deny",
      "Here is the essential gate, one rule for each action. First, the Security rule: if someone else used the account or the card, deny. A refund above 100 dollars is denied. So is a password link to an e-mail that is not on file, and a plan that is already cancelled. Deleting data is always denied. The model gets these rules as context."
    );
    // One deny rule for each action; the walk-throughs show the full gate.
    const RULE_ROWS = [
      ["Any change", "Someone else used the account or the card", "deny", true],
      ["Refund", "Above $100", "deny", false],
      ["Reset password", "Link to an address that is not on file", "deny", false],
      ["Cancel plan", "The plan is already cancelled", "deny", false],
      ["Delete data", "Always: it cannot be undone", "deny", false],
    ];
    const rh = 0.8, rg = 0.12;
    RULE_ROWS.forEach(([act, rule, out, first], i) => {
      const y = 1.55 + i * (rh + rg);
      box(s, ML, y, CW, rh, { fill: first ? C.tealL : C.card });
      textBox(s, act, ML + 0.3, y, 3.0, rh, { size: 22, bold: true, color: C.navy, valign: "middle" });
      textBox(s, rule, ML + 3.5, y, 7.0, rh, { size: 22, color: C.text, valign: "middle" });
      textBox(s, out, ML + CW - 1.5, y + 0.17, 1.2, rh - 0.34, {
        shape: pres.ShapeType.roundRect, fill: C.red, color: C.white, size: 18, bold: true, margin: 0, valign: "middle", align: "center",
      });
    });
    textBox(
      s,
      [{ text: "The model gets these rules as context. ", options: { bold: true } }, { text: "Level 2: the agent applies them.   Level 3: Jev applies them." }],
      ML, 6.35, CW, 0.5, { size: 17, color: C.navy, valign: "middle" }
    );
  }

  // ---------- 5. Level 3 flow ----------
  {
    const s = base(
      6,
      "Level 3: Jev and an LLM",
      "This is Level 3 as a state machine with six states. A message enters New. Jev is the only state that decides: it reads the chat, the account, and the written rules as context, and answers. The process follows the answer: allow runs the action, and deny runs nothing. The LLM writes the final message only."
    );
    const nodes = [
      ["New", "message saved", "LuMail", "fx"],
      ["Jev", "reads the chat, the account, and the rules; answers", "LuTags", "md"],
      ["Do action", "refund, cancel plan, or reset", "LuZap", "fx"],
      ["Final message", "the LLM writes the reply", "LuMessageSquareText", "md"],
      ["Chat open", "popup: did this solve it?", "LuMessageCircle", "fx"],
      ["Resolved", "chat closed", "LuCircleCheck", "fx"],
    ];
    // Four large states that decide; Chat open and Resolved are small, because they come after the answer.
    const H = 2.1, S = 1.2, y0 = 1.85, wN = nodes.map((_, i) => (i < 4 ? 1.95 : S)), hN = nodes.map((_, i) => (i < 4 ? H : S));
    const gap = (CW - wN.reduce((a, v) => a + v, 0)) / 5;
    const X = nodes.map((_, i) => ML + wN.slice(0, i).reduce((a, v) => a + v, 0) + i * gap);
    const yN = hN.map((h) => y0 + (H - h) / 2);
    const cx = X.map((x, i) => x + wN[i] / 2);
    nodes.forEach(([name, sub, icon, k], i) => {
      const [fill, ln] = kinds[k];
      box(s, X[i], yN[i], wN[i], hN[i], { fill });
      if (i < 4) {
        iconCircle(s, icon, cx[i] - 0.3, y0 + 0.18, 0.6, ln);
        textBox(s, name, X[i] + 0.04, y0 + 0.88, wN[i] - 0.08, 0.38, { size: 17, bold: true, color: C.navy, align: "center", valign: "middle" });
        textBox(s, sub, X[i] + 0.1, y0 + 1.28, wN[i] - 0.2, 0.8, { size: 15, align: "center" });
      } else {
        iconCircle(s, icon, cx[i] - 0.22, yN[i] + 0.12, 0.44, ln);
        textBox(s, name, X[i] + 0.02, yN[i] + 0.64, wN[i] - 0.04, 0.4, { size: 14, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0 });
      }
      if (i < 5) line(s, X[i] + wN[i] + 0.02, y0 + H / 2, gap - 0.04, 0, { arrow: true, color: C.grey });
    });
    textBox(s, "allow", cx[1] + wN[1] / 2 + gap / 2 - 0.45, y0 - 0.3, 0.9, 0.28, { size: 15, bold: true, color: C.blue, align: "center", valign: "middle" });
    // Deny path: Jev goes straight to the Final message; nothing runs.
    const yd = 4.4;
    line(s, cx[1], y0 + H, 0, yd - (y0 + H), { color: C.blue });
    line(s, cx[1], yd, cx[3] - cx[1], 0, { color: C.blue });
    line(s, cx[3], y0 + H, 0, yd - (y0 + H), { color: C.blue, arrow: true, flipV: true });
    textBox(s, "deny: nothing runs", cx[1], yd + 0.05, cx[3] - cx[1], 0.3, { size: 15, bold: true, color: C.blue, align: "center", valign: "middle" });
    // Loop: a customer who writes again in the same chat goes back to New.
    const yl = 5.0;
    line(s, cx[4], yN[4] + S, 0, yl - (yN[4] + S), { color: C.muted, dash: "dash" });
    line(s, cx[0], yl, cx[4] - cx[0], 0, { color: C.muted, dash: "dash" });
    line(s, cx[0], y0 + H, 0, yl - (y0 + H), { arrow: true, flipV: true, color: C.muted, dash: "dash" });
    textBox(s, "same chat: the customer writes again", cx[0], yl + 0.05, cx[4] - cx[0], 0.3, { size: 15, color: C.muted, align: "center", valign: "middle" });
    [["Fixed code", C.greyL, C.grey], ["Model", C.blueL, C.blue]].forEach(([t, f, l], i) => {
      textBox(s, t, ML + i * 1.9, 5.5, 1.7, 0.32, { shape: pres.ShapeType.roundRect, fill: f, line: l, size: 14, margin: [0, 0.1, 0, 0.1], valign: "middle", align: "center" });
    });
    band(s, 6.0, 0.8, "LuTags", [{ text: "The process follows Jev. ", options: { bold: true } }, { text: "Allow runs the action. Deny runs nothing, and the Final message says why." }]);
  }

  // ---------- 6. What Jev reads ----------
  {
    const s = base(
      7,
      "Jev reads the chat, the account, and the rules",
      "In one call, Jev reads three things: the chat, the account, and the written rules. The chat is the text and the role of the sender. The account has six fields. The rules are plain text in the context, not code. No fixed code picks fields or checks rules: Jev decides."
    );
    const gapI = 0.3, wI = (CW - 2 * gapI) / 3, yI = 1.6, hI = 2.55;
    const inputs = [
      ["LuMessageSquareText", "The chat", "chat"],
      ["LuDatabase", "The account", "account"],
      ["LuScale", "The written rules", "rules"],
    ];
    inputs.forEach(([icon, name, kind], i) => {
      const x = ML + i * (wI + gapI);
      box(s, x, yI, wI, hI);
      iconCircle(s, icon, x + 0.25, yI + 0.2, 0.6, C.blue);
      textBox(s, name, x + 1.0, yI + 0.2, wI - 1.2, 0.6, { size: 20, bold: true, color: C.navy, valign: "middle" });
      if (kind === "chat") {
        s.addText(bullets(["The text of the message", "The role of the sender"]), { x: x + 0.3, y: yI + 1.1, w: wI - 0.6, h: 1.2, margin: 0, fontFace: FONT, fontSize: 17, color: C.text, paraSpaceAfter: 8, valign: "top" });
      } else if (kind === "account") {
        FIELDS.forEach((f, k) => {
          textBox(s, f, x + 0.3 + (k % 3) * 1.12, yI + 1.15 + Math.floor(k / 3) * 0.55, 1.02, 0.42, { shape: pres.ShapeType.roundRect, fill: "EEF1F5", line: "C5CDD6", color: C.navy, bold: true, size: 14, margin: 0, valign: "middle", align: "center" });
        });
      } else {
        s.addText(bullets(["Refund", "Reset password", "Cancel plan", "Delete data", "Security"]), { x: x + 0.3, y: yI + 1.05, w: wI - 0.6, h: 1.4, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 2, valign: "top" });
      }
      line(s, x + wI / 2, yI + hI + 0.03, 0, 0.32, { arrow: true });
    });
    textBox(s, [{ text: "Jev", options: { bold: true } }, { text: ": one call, one decision" }], ML, 4.5, CW, 0.75, {
      shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, size: 24, margin: 0.2, valign: "middle", align: "center",
    });
    band(s, 5.55, 0.8, "LuLock", [{ text: "Rules are context, not code. ", options: { bold: true } }, { text: "No fixed code picks fields or checks them." }]);
  }

  // ---------- 7. What Jev answers ----------
  {
    const s = base(
      8,
      "Jev answers five questions, and the process follows",
      "Jev answers five fixed questions: the topic, the priority, the action, whether the rules allow it, and an injection flag. Allow runs the action; deny runs nothing. If the injection flag is on, the action becomes Send reply, so an order hidden in the text is ignored. Now, three real requests."
    );
    const questions = [
      ["LuTags", "Topic", "What the request is about", ["Account", "Payments", "Plans and Credits", "Product Help", "Refunds", "Security"]],
      ["LuGauge", "Priority", "How urgent the request is", []],
      ["LuZap", "Action", "What the customer asks to do", ["Send reply", "Start refund", "Delete data", "Cancel plan", "Reset password"]],
      ["LuScale", "Allowed", "Do the written rules allow this action?", ["Allow", "Deny"]],
      ["LuShieldX", "Injection flag", "The text gives orders to the model", []],
    ];
    const gapC = 0.2, wC = (CW - 4 * gapC) / 5, yC = 1.6, hC = 3.5;
    questions.forEach(([icon, name, ask, options], i) => {
      const x = ML + i * (wC + gapC);
      box(s, x, yC, wC, hC);
      iconCircle(s, icon, x + 0.2, yC + 0.2, 0.6, C.blue);
      textBox(s, `Question ${i + 1}`, x + 0.95, yC + 0.2, wC - 1.05, 0.6, { size: 14, color: C.muted, valign: "middle" });
      textBox(s, name, x + 0.2, yC + 0.95, wC - 0.4, 0.42, { size: 20, bold: true, color: C.navy, valign: "middle" });
      textBox(s, ask, x + 0.2, yC + 1.4, wC - 0.4, options.length ? 0.55 : 1.6, { size: 15 });
      if (options.length) textBox(s, options.map((t, k) => ({ text: t, options: { breakLine: k < options.length - 1 } })), x + 0.2, yC + 1.95, wC - 0.4, 1.4, { size: 14, color: C.muted });
    });
    band(s, 5.2, 0.75, "LuTags", [{ text: "The process follows the answer: ", options: { bold: true } }, { text: "allow runs the action; deny runs nothing, and the Final message says why." }]);
    band(s, 6.05, 0.75, "LuShieldX", [{ text: "Routing rule: ", options: { bold: true } }, { text: "if the injection flag is on, the action is set to Send reply, so the orders in the text are ignored." }]);
  }

  // ---------- 8 to 10. Walk-throughs: one request through the flow of Level 3, one slide per click ----------
  // Each walk-through is a series of slides: the diagram of slide 5 with one recorded request played through it. Every slide
  // lights the next state and swaps the panel below. The slides share one title and one layout, and a morph transition
  // (transitions.js) runs between them, so the next key plays the request forward and the PDF holds every step. The data of the
  // three requests is in cases.js.
  const transitions = { morph: [], fade: [] }; // slide numbers (1-based) by the transition that leads into the slide
  const tick = await iconPng("LuCircleCheck", "#1F7A7A");
  const cross = await iconPng("LuCircleX", "#A94A4A");
  // The tone of a walk-through: normal (a request that runs), warning (a rule says no), danger (an attack in the message).
  // `accent`: the badge and the key state; `light`: the tint of the key state; `line`: the path of a denied request; `verdict`: the colour of the verdict of the rules.
  const TONES = {
    ok: { accent: C.teal, light: "E9F0F8", line: C.teal, badge: "ALLOWED: the rules say allow" },
    warn: { accent: "B45309", light: "FDEBC8", line: "B45309", badge: "WARNING: the rules say deny" },
    danger: { accent: "B91C1C", light: "FAD4D0", line: "B91C1C", badge: "DANGER: an attack in the message" },
  };

  const DIM = { fill: "E9EDF2", ring: "AEB7C2", text: "6B7785", arrow: "9AA6B3" }; // a state that the request has not reached
  const CHIP = "E9F0F8"; // light tint of a chip on a white card
  const FLOW = [
    ["New", "LuMail", "fx", "Fixed code"],
    ["Jev", "LuTags", "md", "Model: Jev"],
    ["Do action", "LuZap", "fx", "Fixed code"],
    ["Final message", "LuMessageSquareText", "md", "Model: the LLM"],
    ["Chat open", "LuMessageCircle", "fx", "Fixed code"],
    ["Resolved", "LuCircleCheck", "fx", "Fixed code"],
  ];

  // `speakerRow`: the row of SPEAKER; `frame`: the slide of the series, 0 to K. Frame 0 shows what to watch; frame k lights the
  // k-th state of the path, and the last frame lights Chat open and Resolved together.
  function walkthrough(c, speakerRow, frame) {
    // `c.show`: the indices of `c.path` that get a slide of their own (default: all). The slide of a shown state lights every state
    // up to it; the last slide lights the rest of the path too. State 0 (New) is lit from the first slide.
    const show = c.show ?? c.path.map((_, i) => i);
    const K = show.length;
    const cover = (f) => (f === 0 ? 0 : f === K ? c.path.length - 1 : show[f - 1]); // the last path index that is lit on slide f
    const notes = frame === 0
      ? `This walk-through is ${K + 1} slides: press the next key once for each one, and the slides morph into each other. ${c.notes[0]}`
      : c.notes[frame];
    const s = base(speakerRow, c.title, notes, frame === 0, "!!title");
    const tone = TONES[c.tone ?? "ok"];
    // Morph matches the objects of two slides by name when the name starts with "!!". The diagram (message, states, arrows, ring) and the
    // frame, icon circle, and icon of the panel card get such names, so the same object has the same name on every slide and Morph
    // moves it. The icon circle and its icon are matched together: a matched circle with an unmatched icon hides the icon during the
    // morph. The title, the tag, and the content of the panel get plain names, so they fade out and in.
    // `force`: how many objects of the group get "!!".
    const named = (prefix, force = Infinity) => {
      let k = 0;
      const next = () => ({ objectName: `${k < force ? "!!" : ""}${prefix}#${k++}` });
      return {
        addShape: (type, o) => s.addShape(type, { ...o, ...next() }),
        addText: (text, o) => s.addText(text, { ...o, ...next() }),
        addImage: (o) => s.addImage({ ...o, ...next() }),
      };
    };
    // A group is drawn on the frames from its `in` frame up to, but not including, its `out` frame.
    const sc = { group: (name, o, draw) => { if ((o.in ?? 0) <= frame && (o.out === undefined || o.out > frame)) draw(named(name, name.startsWith("panel") ? 0 : Infinity)); } };
    // The first two slides of a series fade: the way in, and what to watch -> the first state, which swaps the whole panel. The others morph.
    transitions[frame <= 1 ? "fade" : "morph"].push(pres.slides.length);

    const H = 1.35, S = 1.2, y0 = 2.15, yDeny = 3.72, wN = FLOW.map((_, i) => (i < 4 ? 1.95 : S)), hN = FLOW.map((_, i) => (i < 4 ? H : 1.1));
    const gap = (CW - wN.reduce((a, v) => a + v, 0)) / 5;
    const X = FLOW.map((_, i) => ML + wN.slice(0, i).reduce((a, v) => a + v, 0) + i * gap);
    const yN = hN.map((h) => y0 + (H - h) / 2);
    const cx = X.map((x, i) => x + wN[i] / 2);
    const PX = ML, PY = 4.05, PW = CW, PH = 2.05; // the panel below the diagram

    // The customer message and the legend.
    sc.group("message", {}, (g) => {
      box(g, ML, 1.45, 8.45, 0.55);
      iconCircle(g, "LuUser", ML + 0.1, 1.5, 0.45, C.l2);
      textBox(g, [{ text: `${c.sender}: `, options: { bold: true } }, { text: `\u201C${c.text}\u201D` }], ML + 0.7, 1.45, 7.65, 0.55, { size: 14, valign: "middle" });
      [["Fixed code", "fx"], ["Model", "md"]].forEach(([t, k], i) => {
        textBox(g, t, ML + 8.67 + i * 1.7, 1.52, 1.5, 0.4, {
          shape: pres.ShapeType.roundRect, fill: kinds[k][0], line: kinds[k][1], size: 14, margin: [0, 0.05, 0, 0.05], valign: "middle", align: "center",
        });
      });
    });

    // The badge of the tone, at the top right.
    sc.group("badge", {}, (g) => {
      textBox(g, tone.badge, ML + CW - 4.3, 0.12, 4.3, 0.4, {
        shape: pres.ShapeType.roundRect, fill: tone.accent, line: tone.accent, color: C.white, bold: true, size: 14, margin: [0, 0.1, 0, 0.1], valign: "middle", align: "center",
      });
    });

    // The diagram. Every state and every arrow is one set of objects that has the same names on every slide and only changes colour
    // when the request reaches it, so Morph recolours it in place. (Drawing a lit copy on top of a dim one makes the icon vanish
    // during the morph.) `litAt[n]`: the slide where state n lights up; `arrowAt[i]`: the slide where the arrow after state i does.
    const litAt = Array(FLOW.length).fill(Infinity);
    const arrowAt = Array(FLOW.length - 1).fill(Infinity);
    let denyAt = Infinity;
    c.path.forEach((n, p) => {
      let f = 0;
      while (cover(f) < p) f++;
      litAt[n] = f;
      if (p > 0) {
        const from = c.path[p - 1];
        if (n !== from + 1) denyAt = f;
        else arrowAt[from] = f;
      }
    });
    litAt[5] = K; // Resolved lights with Chat open, on the last slide
    arrowAt[4] = K;
    const seg = (g, x, y, w, h, on, arrow, flipV) =>
      g.addShape(pres.ShapeType.line, {
        x, y, w, h, flipV, line: { color: on ? C.navy : DIM.arrow, width: on ? 3.5 : 2, endArrowType: arrow ? "triangle" : undefined },
      });
    FLOW.forEach(([name, icon, kind], i) => {
      sc.group(`state-${i}`, {}, (g) => {
        const on = frame >= litAt[i];
        const [fill, accent] = i === c.hot ? [tone.light, tone.accent] : kinds[kind];
        box(g, X[i], yN[i], wN[i], hN[i], { fill: on ? fill : DIM.fill, ...(on && i === c.hot ? { line: tone.accent, lineW: 2 } : {}) });
        if (i < 4) {
          iconCircle(g, icon, cx[i] - 0.25, y0 + 0.12, 0.5, on ? accent : DIM.ring);
          textBox(g, name, X[i] + 0.04, y0 + 0.68, wN[i] - 0.08, 0.34, { size: 15, bold: true, color: on ? C.navy : DIM.text, align: "center", valign: "middle" });
        } else {
          iconCircle(g, icon, cx[i] - 0.18, yN[i] + 0.1, 0.36, on ? accent : DIM.ring);
          textBox(g, name, X[i] + 0.02, yN[i] + 0.58, wN[i] - 0.04, 0.34, { size: 14, bold: true, color: on ? C.navy : DIM.text, align: "center", valign: "middle", margin: 0 });
        }
      });
      if (i < 5) sc.group(`arrow-${i}`, {}, (g) => seg(g, X[i] + wN[i] + 0.02, y0 + H / 2, gap - 0.04, 0, frame >= arrowAt[i], true, false));
    });
    sc.group("deny", {}, (g) => {
      const on = frame >= denyAt, color = on ? tone.line : DIM.arrow, width = on ? 3.5 : 2;
      const part = (x, y, w, h, arrow, flipV) =>
        g.addShape(pres.ShapeType.line, { x, y, w, h, flipV, line: { color, width, endArrowType: arrow ? "triangle" : undefined } });
      part(cx[1], y0 + H, 0, yDeny - (y0 + H), false, false);
      part(cx[1], yDeny, cx[3] - cx[1], 0, false, false);
      part(cx[3], y0 + H, 0, yDeny - (y0 + H), true, true);
      textBox(g, "denied: nothing runs", cx[1], yDeny + 0.03, cx[3] - cx[1], 0.3, { size: 14, color: DIM.text, align: "center", valign: "middle" });
    });

    // The card of a panel: the icon and the title of the state, and the kind of the state.
    const card = (g, node, title) => {
      const [, icon, kind, tag] = FLOW[node];
      const [fill, accent] = kinds[kind];
      box(g, PX, PY, PW, PH);
      iconCircle(g, icon, PX + 0.25, PY + 0.12, 0.5, accent);
      textBox(g, title, PX + 0.95, PY + 0.12, PW - 3.1, 0.5, { size: 19, bold: true, color: C.navy, valign: "middle" });
      textBox(g, tag, PX + PW - 1.95, PY + 0.19, 1.7, 0.36, {
        shape: pres.ShapeType.roundRect, fill, line: accent, size: 14, margin: [0, 0.05, 0, 0.05], valign: "middle", align: "center",
      });
    };
    const lines = (items) => items.map((t, k) => ({ text: t, options: { breakLine: k < items.length - 1 } }));

    // The content of the panel of one state.
    const panel = (g, node) => {
      const title = [
        "New: the message is saved",
        "Jev: reads the chat, the account, and the rules",
        "Do action: fixed code runs the action",
        "Final message: the LLM writes the reply",
        "Chat open: a popup asks if the issue is solved",
      ][node];
      card(named("card", 3), node, title);
      if (node === 0) {
        textBox(g, "The message is saved. No model runs and no rule is applied in this state.", PX + 0.25, PY + 0.85, PW - 0.5, 0.9, { size: 18 });
      } else if (node === 1) {
        const t = c.jev, w = (PW - 0.5 - 4 * 0.15) / 5;
        t.answers.forEach(([label, value, conf], i) => {
          const hot = t.warn === i;
          const runs = [
            { text: label, options: { fontSize: 14, color: C.muted, breakLine: true } },
            { text: value, options: { fontSize: 18, bold: true, color: hot ? tone.accent : C.navy, breakLine: Boolean(conf) } },
          ];
          if (conf) runs.push({ text: conf, options: { fontSize: 14, color: C.muted } });
          textBox(g, runs, PX + 0.25 + i * (w + 0.15), PY + 0.66, w, 0.8, {
            shape: pres.ShapeType.roundRect, fill: hot ? tone.light : CHIP, line: hot ? tone.accent : CHIP, lineW: hot ? 3 : 1, margin: [0.04, 0.12, 0.04, 0.12], valign: "middle",
          });
        });
        textBox(g, t.rule, PX + 0.25, PY + 1.49, PW - 0.5, 0.28, { size: 16, bold: true, color: C.navy, valign: "middle" });
        textBox(g, t.note, PX + 0.25, PY + 1.77, PW - 0.5, 0.25, { size: 14, color: C.muted, valign: "middle" });
      } else if (node === 2) {
        g.addText(bullets(c.act), { x: PX + 0.25, y: PY + 0.85, w: PW - 0.5, h: 1.0, margin: 0, fontFace: FONT, fontSize: 18, color: C.text, paraSpaceAfter: 8, valign: "top" });
      } else if (node === 3) {
        textBox(g, `\u201C${c.final.text}\u201D`, PX + 0.25, PY + 0.72, PW - 0.5, 0.98, {
          shape: pres.ShapeType.roundRect, fill: CHIP, line: CHIP, size: 15, margin: [0.06, 0.15, 0.06, 0.15], valign: "middle",
        });
        textBox(g, c.final.meta, PX + 0.25, PY + 1.74, PW - 0.5, 0.25, { size: 14, color: C.muted, valign: "middle" });
      } else if (node === 4) {
        box(g, PX + 0.25, PY + 0.75, 3.7, 1.15, { fill: CHIP });
        textBox(g, "Did this solve your issue?", PX + 0.45, PY + 0.82, 3.3, 0.4, { size: 16, bold: true, color: C.navy, valign: "middle" });
        textBox(g, "Yes", PX + 0.45, PY + 1.3, 1.5, 0.4, { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, bold: true, size: 15, margin: 0, valign: "middle", align: "center" });
        textBox(g, "No", PX + 2.15, PY + 1.3, 1.5, 0.4, { shape: pres.ShapeType.roundRect, fill: C.greyL, line: C.greyL, color: C.navy, bold: true, size: 15, margin: 0, valign: "middle", align: "center" });
        g.addText(bullets(["Yes: the chat closes (Resolved).", "No: the popup comes again. After 2 times the chat closes.", "Not simulated in our experiment."]), {
          x: PX + 4.35, y: PY + 0.85, w: PW - 4.6, h: 1.1, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, paraSpaceAfter: 6, valign: "top",
        });
      }
    };

    // Click 0: what to watch.
    sc.group("panel-intro", { out: 1 }, (g) => {
      const head = named("card", 3); // the frame and the icon of the card keep their names on every slide of the series; the icon circle and its icon must be matched together or Morph draws the icon under the circle
      box(head, PX, PY, PW, PH);
      iconCircle(head, "LuTarget", PX + 0.25, PY + 0.12, 0.5, C.blue);
      textBox(head, "What to watch", PX + 0.95, PY + 0.12, PW - 1.5, 0.5, { size: 19, bold: true, color: C.navy, valign: "middle" });
      textBox(g, c.watch, PX + 0.25, PY + 0.85, PW - 0.5, 0.6, { size: 20, color: C.text });
      textBox(g, "Each click sends the request one state forward.", PX + 0.25, PY + 1.55, PW - 0.5, 0.35, { size: 15, color: C.muted });
    });

    // Clicks 1 to K: the request reaches the next state.
    show.forEach((pi, p) => {
      const node = c.path[pi], click = p + 1, last = p === K - 1;
      if (c.deny && node === 3) {
        sc.group("skipped", { in: click }, (g) => {
          textBox(g, "skipped", X[2], y0 + 1.02, wN[2], 0.28, { size: 14, bold: true, color: tone.line, align: "center", valign: "middle" });
        });
      }
      sc.group(`panel-${node}`, { in: click, out: last ? undefined : click + 1 }, (g) => panel(g, node));
    });

    // One ring that moves from state to state: Morph slides it from the old state to the new one. On the last slide it rests on Resolved.
    {
      const lastNode = c.path[show[K - 1]];
      const n = frame === 0 ? 0 : frame === K && lastNode === 4 ? 5 : c.path[show[frame - 1]];
      named("ring").addShape(pres.ShapeType.roundRect, {
        x: X[n] - 0.05, y: yN[n] - 0.05, w: wN[n] + 0.1, h: hN[n] + 0.1, rectRadius: 0.1, fill: { color: C.card, transparency: 100 }, line: { color: C.navy, width: 3 },
      });
    }
  }

  CASES.forEach((c, i) => {
    for (let f = 0; f <= (c.show ?? c.path).length; f++) walkthrough(c, 9 + i, f);
  });

  // ---------- 11. Test data ----------
  {
    const s = base(
      12,
      "Test data: 72 customers, 100 requests",
      "Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data. Public datasets have no SaaS accounts, so we built our own: 72 FrameForge customers. Each has one purchase, a plan and its state, a render-credit balance, a log of password reset links, and a teammate with no billing rights. So the written rules can use real account fields, and the customers cover every branch of the rules. They send 100 requests of 24 types."
    );
    box(s, ML, 1.6, 6.3, 5.0);
    textBox(s, "One customer in the test data", ML + 0.3, 1.75, 5.7, 0.5, { size: 20, bold: true, color: C.navy, valign: "middle" });
    [
      ["LuTags", "One purchase: a monthly plan, an annual plan, or a credit pack"],
      ["LuFileText", "A plan and the state of the plan"],
      ["LuCpu", "A render-credit balance"],
      ["LuLock", "A log of password reset links"],
      ["LuUsers", "A teammate with no billing rights"],
    ].forEach(([ic, t], i) => {
      const y = 2.45 + i * 0.82;
      iconCircle(s, ic, ML + 0.3, y, 0.6, C.blue);
      textBox(s, t, ML + 1.15, y, 4.95, 0.6, { size: 17, valign: "middle" });
    });
    const gx = ML + 6.6, gw = (CW - 6.6 - 0.3) / 2, gh = 2.35;
    [
      ["LuUsers", "72", "FrameForge customers"],
      ["LuFileText", "100", "requests, one run and no split"],
      ["LuTags", "24", "request types"],
      ["LuUserCheck", "88/12", "owners and teammates as senders"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, gx + (i % 2) * (gw + 0.3), 1.6 + Math.floor(i / 2) * (gh + 0.3), gw, gh, { icon: ic, big: n, label: l, bigSize: 30, labelY: 1.3 });
    });
  }

  // ---------- 12. Request families ----------
  {
    const s = base(
      13,
      "100 requests in ten families",
      "A seeded generator wrote the 100 requests. The 24 types form ten families. Questions and answers is the largest, with 24 requests, then refunds with 16, plan cancellations with 14, and password resets with 12. Every request has its own words and its own sender: 88 owners and 12 teammates. The correct answers come from the written rules, because the generator runs the real code. A rule denies the action on 30 of the 100 requests."
    );
    box(s, ML, 1.6, 7.9, 5.0);
    const fam = [
      ["Questions and answers", 24], ["Refund", 16], ["Cancel plan", 14], ["Reset password", 12], ["Invoice or request for a human", 8],
      ["Fraud or data loss", 8], ["Delete data", 6], ["Injection", 4], ["Two problems in one request", 4], ["Closing message", 4],
    ];
    s.addChart(pres.charts.BAR, [{ name: "Requests", labels: fam.map((f) => f[0]), values: fam.map((f) => f[1]) }], {
      ...chartBase, showLegend: false, x: ML + 0.2, y: 1.7, w: 7.5, h: 4.8, barDir: "bar", barGapWidthPct: 40, chartColors: [C.l3],
      dataLabelPosition: "outEnd", dataLabelFontSize: 14, catAxisLabelFontSize: 14, catAxisOrientation: "maxMin", valAxisMaxVal: 28,
      showTitle: true, title: "Requests per family (100 in total)",
    });
    const x = ML + 8.2, w = CW - 8.2;
    callout(s, x, 1.6, w, 1.5, { icon: "LuScale", big: "30 of 100", label: "requests where a written rule denies the action", color: C.teal, bigSize: 28 });
    callout(s, x, 3.3, w, 1.5, { icon: "LuCpu", big: "Real code", label: "the generator runs the code of the system to make the correct answer", color: C.l3, bigSize: 28 });
    callout(s, x, 5.0, w, 1.6, { icon: "LuUsers", big: "88 + 12", label: "each request has its own words and its own sender", color: C.l3, bigSize: 28 });
  }

  // ---------- 13. Outcomes ----------
  {
    const s = base(
      14,
      "What we count: three outcomes and one harm flag",
      "Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run. A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report time and cost per 1,000 requests. Now my teammate Vu Van Son will explain the run."
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y = 1.6, h = 2.75;
    [
      ["LuBadgeCheck", "Served", C.l3, "The run ends with the correct result: an answer or an action that the written rules allow."],
      ["LuShieldCheck", "Stopped", C.teal, "A written rule denies the correct action. Nothing ran, and the reply gives the reason."],
      ["LuTriangleAlert", "Error", C.red, "Every other run: for example a refusal where the correct result is an answer, or an action that the written rules deny."],
    ].forEach(([ic, big, col, label], i) => {
      statCard(s, ML + i * (cw + gap), y, cw, h, { icon: ic, big, label, bigSize: 32, labelY: 1.3, bg: col, color: col });
    });
    band(s, 4.65, 0.95, "LuShieldX", [{ text: "A harmful run ", options: { bold: true } }, { text: "changes money, data, the plan, or the password against the written rules." }]);
    [
      ["LuTimer", "Machine time", "of one request"],
      ["LuDollarSign", "API cost", "per 1,000 requests"],
      ["LuScale", "Sign test", "on the errors of the two levels"],
    ].forEach(([ic, big, label], i) => {
      callout(s, ML + i * (cw + gap), 5.85, cw, 1.0, { icon: ic, big, label, color: C.l3, bigSize: 20, bigH: 0.42, bigY: 0.1, labelSize: 14 });
    });
  }

  // ---------- 13. The run ----------
  {
    const s = base(
      15,
      "The run: two hosted models, 600 calls",
      "Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment. We call two hosted models for real: Jev, version 1.13.0, and DeepSeek V4.1 Flash. A full run makes 600 model calls, 200 for each of the three runs. In the final recording, 412 LLM calls are live, and 0 Jev calls are live: those answers came from a cache. We ask two questions: what does each level buy and cost, and what changes when Jev replaces the LLM?"
    );
    const gap = 0.3, cw = (CW - 3 * gap) / 4, y = 1.55, h = 1.85;
    [
      ["LuCpu", "600", "model calls: 200 for each of three runs"],
      ["LuBot", "2", "hosted models: Jev and an LLM"],
      ["LuDatabase", "412", "live LLM calls in the final recording"],
      ["LuTimer", "0", "live Jev calls: the answers came from a cache"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, ML + i * (cw + gap), y, cw, h, { icon: ic, big: n, label: l, bigSize: 32, labelY: 1.2 });
    });
    [
      ["Q1", "What does each level buy and cost? Served, stopped, errors, harm, time, and cost."],
      ["Q2", "What changes when Jev replaces the LLM as the classifier? Accuracy, speed, and cost."],
    ].forEach(([tag, t], i) => {
      const yy = 3.85 + i * 1.1;
      box(s, ML, yy, CW, 0.9);
      textBox(s, tag, ML + 0.25, yy + 0.2, 0.9, 0.5, { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, bold: true, size: 18, margin: 0, valign: "middle", align: "center" });
      textBox(s, t, ML + 1.4, yy, CW - 1.65, 0.9, { size: 18, valign: "middle" });
    });
    textBox(s, "Calls to two hosted models: Jev (jev-1.13.0) and deepseek-v4.1-flash through the DeepSeek API. An offline replay of the main run gives every number in the paper.", ML, 6.15, CW, 0.7, { size: 15, color: C.muted, valign: "middle" });
  }

  // ---------- 15. Models, input, and prices ----------
  {
    const s = base(
      16,
      "Same input, list prices: what one call costs",
      "Both classifiers get the same input: the chat text, the sender role, the channel, and the matching help articles. Neither reads the account. Jev costs 4.2 cents per million input tokens, and its output is free. The LLM costs 15 cents in and 60 cents out per million tokens, with high reasoning effort. One Jev call writes 196 tokens, and one LLM call writes 690, because reasoning counts. All 600 calls cost about 17 cents at list price."
    );
    const gap = 0.3, cw = (CW - gap) / 2, y = 1.55, h = 3.5;
    [
      { x: ML, head: "Jev (jev-1.13.0)", icon: "LuGauge", col: C.l3, items: ["$0.042 per million input tokens", "Output tokens are free", "1,233 tokens in and 196 out per call", "Gives a confidence with each answer"] },
      { x: ML + cw + gap, head: "LLM (deepseek-v4.1-flash)", icon: "LuBot", col: C.grey, items: ["$0.15 in and $0.60 out per million tokens", "High reasoning effort, temperature 0.3", "1,001 tokens in and 690 out per call", "The output includes the reasoning tokens"] },
    ].forEach((o) => {
      box(s, o.x, y, cw, h);
      iconCircle(s, o.icon, o.x + 0.3, y + 0.25, 0.75, o.col);
      textBox(s, o.head, o.x + 1.3, y + 0.25, cw - 1.5, 0.75, { size: 22, bold: true, color: C.navy, valign: "middle" });
      s.addText(bullets(o.items), { x: o.x + 0.35, y: y + 1.3, w: cw - 0.7, h: 2.0, margin: 0, fontFace: FONT, fontSize: 18, color: C.text, paraSpaceAfter: 8, valign: "top" });
    });
    band(s, 5.3, 0.95, "LuFileText", [{ text: "Same input for both: ", options: { bold: true } }, { text: "the chat text, the sender role, the channel, and the matching help articles. The account is not read." }]);
    textBox(s, "All 600 model calls cost about $0.17 at list price.", ML, 6.4, CW, 0.45, { size: 16, color: C.muted, valign: "middle" });
  }

  // ---------- 7. Result 1: classifier ----------
  {
    const s = base(
      17,
      "Result 1: Jev is 19.8x faster, 10.9x cheaper",
      "Now the first result. One Jev call takes 0.263 seconds at the median, and one LLM call takes 5.223 seconds: Jev is 19.8 times faster. Jev costs 5 cents per 1,000 requests, and the LLM costs 56 cents: 10.9 times cheaper. Jev is behind the LLM on four of the five answers, but ahead on the topic: 87.5% against 82.3%. Jev gives a wrong topic or action on 27 of the 100 requests. Now my teammate Vuong Quang Quy will show what happens to these errors."
    );
    box(s, ML, 1.65, 7.6, 4.9);
    const labels = ["Action", "Topic", "Priority", "Risk flag", "Injection flag"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Jev", labels, values: [84.0, 87.5, 81.0, 77.0, 96.0] },
        { name: "LLM as classifier", labels, values: [93.0, 82.3, 92.0, 93.0, 100.0] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.8, w: 7.2, h: 4.6, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
        chartColors: [C.l3, "9AA7B5"], dataLabelPosition: "outEnd", dataLabelFontSize: 14, dataLabelFormatCode: "0.0",
        catAxisLabelFontSize: 14, valAxisMaxVal: 112, title: "Percent correct on 100 requests (topic: 96 scored)",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.5, { icon: "LuZap", big: "19.8x", label: "faster: 0.263 s against 5.223 s, median for one classifier call", color: C.l3 });
    callout(s, x, 3.35, w, 1.5, { icon: "LuDollarSign", big: "10.9x", label: "cheaper: $0.052 against $0.564 per 1,000 requests", color: C.l3 });
    callout(s, x, 5.05, w, 1.5, { icon: "LuBadgeCheck", big: "27 of 100", label: "wrong topic or action from Jev. With a fixed check behind it, none is an error.", color: C.teal, bigSize: 28, labelSize: 14 });
    textBox(s, "Measured with the chat text only. The five questions of this run: topic, priority, action, risk flag, and injection flag.", ML, 6.7, CW - 1, 0.4, { size: 14, color: C.muted, valign: "middle" });
  }

  // ---------- 15. Confidence of Jev ----------
  {
    const s = base(
      18,
      "Jev reports a confidence, and it is a warning",
      "Thank you, Son. My name is Vuong Quang Quy. I will show what the errors and the confidence mean. With a fixed check behind Jev, none of the 27 wrong answers is an error. Jev also reports a confidence, and only Jev does. 24 of the 57 answers below 0.8 are wrong. At 0.9 or more, only 9 of 190 are wrong, which is 4.7%. So the confidence works as a warning."
    );
    box(s, ML, 1.6, 7.9, 5.0);
    const bands = [["<0.5", 3, 33.3], ["0.5-0.6", 12, 66.7], ["0.6-0.7", 19, 42.1], ["0.7-0.8", 23, 30.4], ["0.8-0.9", 49, 36.7], ["0.9+", 190, 4.7]];
    s.addChart(pres.charts.BAR, [{ name: "Wrong answers", labels: bands.map(([l, n]) => `${l} (n = ${n})`), values: bands.map((x) => x[2]) }], {
      ...chartBase, showLegend: false, x: ML + 0.2, y: 1.7, w: 7.5, h: 4.8, barDir: "col", barGapWidthPct: 50, chartColors: [C.l3],
      dataLabelPosition: "outEnd", dataLabelFontSize: 14, dataLabelFormatCode: "0.0", catAxisLabelFontSize: 14, valAxisMaxVal: 80,
      showTitle: true, title: "Percent wrong by confidence of Jev (n in brackets)",
    });
    const x = ML + 8.2, w = CW - 8.2;
    callout(s, x, 1.6, w, 1.5, { icon: "LuTriangleAlert", big: "24 of 57", label: "answers below 0.8 are wrong", color: C.red, bigSize: 30 });
    callout(s, x, 3.3, w, 1.5, { icon: "LuBadgeCheck", big: "9 of 190", label: "answers at 0.9 or more are wrong: 4.7%", color: C.teal, bigSize: 30 });
    callout(s, x, 5.0, w, 1.6, { icon: "LuTags", big: "27 of 100", label: "wrong topic or action from Jev. With a fixed check behind it, none is an error.", color: C.l3, bigSize: 28, labelSize: 14 });
  }

  // ---------- 8. Result 2: the ladder ----------
  {
    const s = base(
      19,
      "Result 2: Level 3 is never worse",
      "Now the three levels on the same 100 requests. In these runs a fixed check stands behind Jev. Level 2 serves 66, stops 28, and makes 6 errors, 2 of them harmful. Level 3 serves 70, stops 30, and makes 0 errors. Level 3 is 1.9 times faster, 4.19 seconds against 7.85, and 2.2 times cheaper, 28 cents against 61 cents per 1,000 requests. The sign test gives p = 0.031: significantly fewer errors. Level 1 is the assumed 90 seconds per request."
    );
    box(s, ML, 1.65, 7.6, 3.95);
    const cats = ["Level 2: LLM agent", "Level 3: Jev + check + LLM"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Served", labels: cats, values: [66, 70] },
        { name: "Stopped by a rule", labels: cats, values: [28, 30] },
        { name: "Errors", labels: cats, values: [6, 0] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.75, w: 7.2, h: 3.75, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 45,
        chartColors: [C.l3, C.teal, C.red], dataLabelPosition: "ctr", dataLabelColor: C.white, dataLabelFontSize: 15, dataLabelFormatCode: "0;-0;;@",
        catAxisOrientation: "maxMin", valAxisMaxVal: 100, title: "Outcome of the 100 requests",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.25, { icon: "LuTimer", big: "1.9x", label: "faster: 4.19 s against 7.85 s of machine time", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 3.0, w, 1.25, { icon: "LuDollarSign", big: "2.2x", label: "cheaper: $0.28 against $0.61 per 1,000 requests", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 4.35, w, 1.25, { icon: "LuScale", big: "0 and 6", label: "errors at Level 3 and Level 2. Sign test: p = 0.031", color: C.teal, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "Level 3 is never worse in any column. ", options: { bold: true } }, { text: "Harmful runs: 0 at Level 3, 2 at Level 2. Level 1 baseline: 90 s per request (assumed)." }]);
    textBox(s, "Measured with a fixed check behind Jev. The design that gives Jev the rules as context was not run.", ML, 6.9, CW - 1, 0.4, { size: 14, color: C.muted, valign: "middle" });
  }

  // ---------- 19. Ablation of the fixed check ----------
  {
    const s = base(
      20,
      "Without a fixed check, Jev's errors run",
      "Why does Level 3 make no error? We removed the fixed check from behind Jev. Then 22 requests become harmful errors: 66 served, 12 stopped, 22 errors. With the check, it is 70, 30, and 0. The sign test gives p below one in a million. Our new design gives Jev the rules as context instead of a check. We have not run it. Now Nguyen Phuong Nam will explain how our work fits the field, and its limits."
    );
    box(s, ML, 1.65, 7.6, 4.0);
    const cats = ["LLM agent (Level 2)", "LLM agent + check", "Jev, no check", "Jev + check (Level 3)"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Served", labels: cats, values: [66, 66, 66, 70] },
        { name: "Stopped by a rule", labels: cats, values: [28, 28, 12, 30] },
        { name: "Errors", labels: cats, values: [6, 6, 22, 0] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.75, w: 7.2, h: 3.8, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 40,
        chartColors: [C.l3, C.teal, C.red], dataLabelPosition: "ctr", dataLabelColor: C.white, dataLabelFontSize: 15, dataLabelFormatCode: "0;-0;;@",
        catAxisOrientation: "maxMin", valAxisMaxVal: 100, title: "Outcome of the 100 requests, with and without the fixed check",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.25, { icon: "LuShieldX", big: "22 to 0", label: "harmful errors behind Jev: run with no check, stopped with it", color: C.red, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    callout(s, x, 3.0, w, 1.25, { icon: "LuScale", big: "p = 4.8e-7", label: "sign test: no check against the check, behind Jev", color: C.l3, bigSize: 26, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    callout(s, x, 4.35, w, 1.3, { icon: "LuBot", big: "No change", label: "behind the LLM agent the same check changes no run (p = 1)", color: C.grey, bigSize: 26, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    band(s, 5.9, 0.9, "LuShieldCheck", [{ text: "Open question: ", options: { bold: true } }, { text: "our new design gives Jev the rules as context, not a check. We have not run it." }]);
  }

  // ---------- 17. Related work ----------
  {
    const s = base(
      21,
      "Related work: limit what the model can trigger",
      "Thank you, Quy. My name is Nguyen Phuong Nam. I will explain how our work fits the field, and its limits. " +
        "Text in data can carry orders for a model. CaMeL and other design patterns defend by limiting what the model can trigger. Support platforms route tickets by rules, and the Fin agent runs refunds and cancellations. Our first design is of this kind: a fixed check limits what Jev can trigger. Our new design gives Jev the rules as context."
    );
    const cw = (CW - 2 * 0.3) / 3;
    [
      ["LuShieldX", "Prompt injection", "Text in data can carry orders for a model.", "Greshake et al., 2023"],
      ["LuLock", "Defenses by design", "CaMeL and design patterns for LLM agents defend by limiting what the model can trigger.", "Debenedetti et al., 2025; Beurer-Kellner et al., 2025"],
      ["LuBot", "Support platforms", "Platforms route tickets by rules. The Fin agent runs refunds, cancellations, and password resets, and reports 76 percent resolution without a human.", "Zendesk; Intercom"],
    ].forEach(([ic, h, t, ref], i) => {
      const x = ML + i * (cw + 0.3);
      box(s, x, 1.6, cw, 3.6);
      iconCircle(s, ic, x + 0.3, 1.85, 0.7, C.blue);
      textBox(s, h, x + 0.3, 2.7, cw - 0.6, 0.5, { size: 21, bold: true, color: C.navy, valign: "middle" });
      textBox(s, t, x + 0.3, 3.25, cw - 0.6, 1.3, { size: 16 });
      textBox(s, ref, x + 0.3, 4.65, cw - 0.6, 0.45, { size: 14, color: C.muted, valign: "middle" });
    });
    band(s, 5.55, 0.9, "LuScale", [{ text: "Our first design is of this kind: ", options: { bold: true } }, { text: "a fixed check limits what Jev can trigger. The new design gives Jev the rules as context." }]);
  }

  // ---------- 9. Limits and claims ----------
  {
    const s = base(
      22,
      "Limits and what we claim",
      "Our evidence is small: two hosted models, one synthetic SaaS product, and our own labels. All results have a fixed check behind Jev. We did not run the design where Jev reads the rules as context. We saw 0 harmful runs in 100 requests. That does not prove that the real rate is zero. The 95% upper limit is 3.7%. " +
        "Real users write slang and make spelling mistakes. Our test data does not. The 90 seconds at Level 1 is assumed. We did not simulate the popup or the silence timer. " +
        "We found the Security rule and the account fields on an earlier 50-request set of these same 24 types, so the main numbers are not a blind test."
    );
    const gapC = 0.3, cwL = 6.9, cwR = CW - cwL - gapC;
    {
      const p = { x: ML, y: 1.65, h: 5.1 };
      box(s, p.x, p.y, cwL, p.h);
      iconCircle(s, "LuTriangleAlert", p.x + 0.35, p.y + 0.25, 0.7, C.grey);
      textBox(s, "Limits", p.x + 1.3, p.y + 0.25, cwL - 1.6, 0.7, { size: 24, bold: true, color: C.navy, valign: "middle" });
      s.addText(
        bullets([
          "The new design (Jev reads the rules as context) was not run: every result has a fixed check behind Jev",
          "Synthetic data and our own labels: 100 requests in 24 types",
          "0 harmful runs in 100 requests is not proof of zero: the 95% upper limit is 3.7%",
          "The 90 s at Level 1 is assumed; the popup and the silence timer are not simulated",
          "The Security rule was found on an earlier 50-request set of these same 24 types, so the main numbers are not a blind test",
        ]),
        { x: p.x + 0.35, y: p.y + 1.15, w: cwL - 0.7, h: p.h - 1.3, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, paraSpaceAfter: 12, valign: "top" }
      );
    }
    [
      { y: 1.65, h: 2.55, icon: "LuBadgeCheck", bg: C.l3, head: "What we claim", items: ["With a fixed check behind Jev: Level 3 is 1.9x faster, 2.2x cheaper, and never worse", "p = 0.031: significantly fewer errors"] },
      { y: 4.4, h: 2.35, icon: "LuFlaskConical", bg: C.teal, head: "Next", items: ["Run Jev with the rules as context", "Real tickets and adversarial inputs", "Real customers for the popup and timer"] },
    ].forEach((p) => {
      const x = ML + cwL + gapC;
      box(s, x, p.y, cwR, p.h);
      iconCircle(s, p.icon, x + 0.3, p.y + 0.2, 0.6, p.bg);
      textBox(s, p.head, x + 1.1, p.y + 0.2, cwR - 1.3, 0.6, { size: 22, bold: true, color: C.navy, valign: "middle" });
      s.addText(bullets(p.items), { x: x + 0.3, y: p.y + 0.95, w: cwR - 0.6, h: p.h - 1.05, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, paraSpaceAfter: 8, valign: "top" });
    });
  }

  // ---------- 13. Conclusion ----------
  // The same grid as the title slide: the text on the deep blue field, the three headline numbers in cards on the light panel.
  {
    const s = pres.addSlide();
    s.background = { color: C.l3 };
    const M = 0.7, LW = 5.9, PX = 6.9, CX = PX + 0.7, CWd = 13.333 - 0.7 - CX;
    s.addShape(pres.ShapeType.rect, { x: PX, y: 0, w: 13.333 - PX, h: 7.5, fill: { color: C.bg }, line: { color: C.bg, width: 0 } });
    s.addText("Conclusion", { x: M, y: 0.7, w: LW, h: 0.7, margin: 0, fontFace: FONT, fontSize: 38, bold: true, color: C.white, valign: "top" });
    s.addText(
      bullets([
        "Same 100 requests at every level. Level 2: 66 served, 28 stopped, 6 errors. Level 3, with a fixed check behind Jev: 70 served, 30 stopped, 0 errors.",
        "Level 3 is never worse, 1.9x faster, and 2.2x cheaper: 4.19 s and $0.28 against 7.85 s and $0.61. The sign test (p\u00a0=\u00a00.031) shows that Level 3 makes significantly fewer errors.",
        "A Security rule stops state changes on fraud reports. We found it on an earlier 50-request set of these same 24 types.",
        "Without the check, 22 of Jev's errors run. Our new design, with the rules as context for Jev, is the next test.",
      ]),
      { x: M, y: 1.65, w: LW, h: 4.3, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, paraSpaceAfter: 9, valign: "top" }
    );
    s.addText("Thank you. Questions?", { x: M, y: 6.1, w: LW, h: 0.7, margin: 0, fontFace: FONT, fontSize: 30, bold: true, color: C.white, valign: "bottom" });
    [
      { icon: "LuScale", big: "0 and 6", label: "errors at Level 3 (fixed check) and Level 2. Sign test: p\u00a0=\u00a00.031", color: C.teal },
      { icon: "LuTimer", big: "1.9x", label: "faster: 4.19 s against 7.85 s of machine time", color: C.l3 },
      { icon: "LuDollarSign", big: "2.2x", label: "cheaper: $0.28 against $0.61 per 1,000 requests", color: C.l3 },
    ].forEach((o, i) => callout(s, CX, 0.7 + i * 2.1, CWd, 1.9, { ...o, bigSize: 38, bigH: 0.8, bigY: 0.25, labelSize: 15 }));
    s.addNotes(
      `Speaker: ${PNAM}, about ${SPEAKER[22][1]} s. To finish, we tested three levels of customer support on the same 100 requests. With a fixed check behind Jev, Level 3 serves 70, stops 30, and makes 0 errors. Level 2 makes 6. ` +
        "Level 3 is never worse, 1.9 times faster, and 2.2 times cheaper, and the sign test gives p = 0.031. Our new design gives Jev the rules as context, and that is the next test. " +
        "Thank you for listening. Our leader, Tran Thanh Long, will now take your questions."
    );
  }

  const file = await pres.write({ outputType: "nodebuffer" });
  fs.writeFileSync("deck.pptx", await addTransitions(file, transitions));
  console.log("wrote deck.pptx,", pres.slides.length, "slides");
})();
