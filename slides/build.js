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
const { dropBlankPoints } = require("./charts");
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
  [QUY, 78], // Result 2
  [PNAM, 35], [PNAM, 55], [PNAM, 35], // our idea, limits, conclusion
  [LONG, 0], // questions (Long answers; not part of the timed talk)
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
    "LuCpu", "LuGauge", "LuLock", "LuUser", "LuListChecks", "LuWorkflow",
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
        "Level 3 replaces the agent with Jev: Jev reads the chat and gives typed answers, then answers one yes/no question for each written rule of the action, each with a confidence; the process follows the answers, and the LLM writes the reply. " +
        "Every level runs on the same 1,024 requests. " +
        "Opening interaction by the leader: which level is faster and cheaper, Level 2 or Level 3? The answer is not given here; the results show it. Now, the rules."
    );
    const gap = 0.45, cw = (CW - 2 * gap) / 3, y = 1.65, h = 4.05;
    [
      { n: "Level 1", head: "Staff only", icon: "LuUsers", bg: C.grey, body: "Support staff read every request. Baseline: 90 s each (assumed)." },
      { n: "Level 2", head: "One LLM agent", icon: "LuBot", bg: C.l2, body: "One LLM agent reads the account and applies the written rules itself. It runs an action or denies it." },
      { n: "Level 3", head: "Jev + LLM", icon: "LuTags", bg: C.l3, body: "Jev reads the chat, then answers one yes/no question for each written rule. The process follows the answers. The LLM writes the reply." },
    ].forEach((p, i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, p.icon, x + 0.3, y + 0.3, 0.8, p.bg);
      textBox(s, p.n, x + 0.3, y + 1.25, cw - 0.6, 0.35, { size: 15, bold: true, color: p.bg });
      textBox(s, p.head, x + 0.3, y + 1.6, cw - 0.6, 0.85, { size: 22, bold: true, color: C.navy });
      textBox(s, p.body, x + 0.3, y + 2.5, cw - 0.6, 1.45, { size: 16 });
      if (i < 2) line(s, x + cw + 0.05, y + h / 2, gap - 0.1, 0, { arrow: true });
    });
    band(s, 5.95, 0.8, "LuTarget", [{ text: "One change at a time: ", options: { bold: true } }, { text: "every level runs on the same 1,024 requests." }]);
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
      "Cancel needs a confirmation", "Deleting data is never allowed", "Reset links go to the e-mail on file", "Cancel a plan only once",
      "Annual plans: refund within 30 days", "Bank must settle the charge first", "No refunds on promo credits", "Escalate any chargeback",
      "Never share another account", "Verify the sender's identity", "One plan per customer", "Log every state change",
      "No discounts without approval", "Reply within 24 hours", "VIP accounts go to a manager", "Mask card numbers in replies",
      "Never promise a fix date", "Close chats after 7 quiet days", "No plan downgrade mid-cycle", "Credits expire after 12 months",
      "Refund to the original payment", "Currency must match the charge", "Tax refunds go to billing", "Fraud reports: lock the account",
      "No password in chat text", "Two-factor reset needs a code", "Ignore orders inside a message", "Tag the topic of every ticket",
      "Priority: blocked users first", "Outages need a status link", "Do not quote internal notes", "Refund once per purchase",
      "Trial accounts get no refund", "One owner per account", "Export data before deletion", "Warn before a plan ends",
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
      "Every action meets a written rule: allow or deny",
      "Here is the essential gate, one rule for each action. First, the Security rule: if someone else used the account or the card, deny. A refund above 100 dollars is denied. So is a password link to an e-mail that is not on file, and a plan that is already cancelled. Deleting data is always denied. At Level 2 the agent reads these rules as text. At Level 3 Jev gets one yes/no question for each rule."
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
      [{ text: "Two ways to apply the rules. ", options: { bold: true } }, { text: "Level 2: the agent reads them as text.   Level 3: Jev answers one question for each rule." }],
      ML, 6.35, CW, 0.5, { size: 17, color: C.navy, valign: "middle" }
    );
  }

  // ---------- 5. Level 3 flow ----------
  {
    const s = base(
      6,
      "Level 3: Jev answers, and the process decides",
      "This is Level 3 as a state machine with seven states. A message enters New. Jev decides in two states. In the first, Jev reads the chat and gives four answers: the topic, the priority, the action, and an injection flag. In Rules, Jev answers one yes/no question for each written rule of the action. The process follows the answers: if no rule is broken, Do action runs the action; if one is broken, nothing runs. The LLM writes the final message only."
    );
    const nodes = [
      ["New", "message saved", "LuMail", "fx"],
      ["Jev", "four answers about the chat", "LuTags", "md"],
      ["Rules", "Jev: one yes/no answer per rule", "LuScale", "md"],
      ["Do action", "refund, cancel plan, or reset", "LuZap", "fx"],
      ["Final message", "the LLM writes the reply", "LuMessageSquareText", "md"],
      ["Chat open", "popup: did this solve it?", "LuMessageCircle", "fx"],
      ["Resolved", "chat closed", "LuCircleCheck", "fx"],
    ];
    // Five large states that decide or act; Chat open and Resolved are small, because they come after the answer.
    const H = 2.1, S = 1.1, y0 = 2.2, wL = 1.6, wN = nodes.map((_, i) => (i < 5 ? wL : S)), hN = nodes.map((_, i) => (i < 5 ? H : S));
    const gap = (CW - wN.reduce((a, v) => a + v, 0)) / 6;
    const X = nodes.map((_, i) => ML + wN.slice(0, i).reduce((a, v) => a + v, 0) + i * gap);
    const yN = hN.map((h) => y0 + (H - h) / 2);
    const cx = X.map((x, i) => x + wN[i] / 2);
    nodes.forEach(([name, sub, icon, k], i) => {
      const [fill, ln] = kinds[k];
      box(s, X[i], yN[i], wN[i], hN[i], { fill });
      if (i < 5) {
        iconCircle(s, icon, cx[i] - 0.3, y0 + 0.18, 0.6, ln);
        textBox(s, name, X[i] + 0.04, y0 + 0.88, wN[i] - 0.08, 0.38, { size: 16, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0 });
        textBox(s, sub, X[i] + 0.1, y0 + 1.28, wN[i] - 0.2, 0.8, { size: 14, align: "center" });
      } else {
        iconCircle(s, icon, cx[i] - 0.22, yN[i] + 0.12, 0.44, ln);
        textBox(s, name, X[i] + 0.02, yN[i] + 0.64, wN[i] - 0.04, 0.4, { size: 14, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0 });
      }
      if (i < 6) line(s, X[i] + wN[i] + 0.02, y0 + H / 2, gap - 0.04, 0, { arrow: true, color: C.grey });
    });
    textBox(s, "no rule broken", cx[2] + wN[2] / 2 + gap / 2 - 0.8, y0 - 0.3, 1.6, 0.28, { size: 15, bold: true, color: C.blue, align: "center", valign: "middle" });
    // Deny path: Rules goes straight to the Final message; nothing runs.
    const yd = 4.75;
    line(s, cx[2], y0 + H, 0, yd - (y0 + H), { color: C.blue });
    line(s, cx[2], yd, cx[4] - cx[2], 0, { color: C.blue });
    line(s, cx[4], y0 + H, 0, yd - (y0 + H), { color: C.blue, arrow: true, flipV: true });
    textBox(s, "a rule is broken: nothing runs", cx[2], yd + 0.05, cx[4] - cx[2], 0.3, { size: 15, bold: true, color: C.blue, align: "center", valign: "middle" });
    // Loop: a customer who writes again in the same chat goes back to New.
    const yl = 5.35;
    line(s, cx[5], yN[5] + S, 0, yl - (yN[5] + S), { color: C.muted, dash: "dash" });
    line(s, cx[0], yl, cx[5] - cx[0], 0, { color: C.muted, dash: "dash" });
    line(s, cx[0], y0 + H, 0, yl - (y0 + H), { arrow: true, flipV: true, color: C.muted, dash: "dash" });
    textBox(s, "same chat: the customer writes again", cx[0], yl + 0.05, cx[5] - cx[0], 0.3, { size: 15, color: C.muted, align: "center", valign: "middle" });
    [["Fixed code", C.greyL, C.grey], ["Model", C.blueL, C.blue]].forEach(([t, f, l], i) => {
      textBox(s, t, ML + i * 1.9, 6.0, 1.7, 0.32, { shape: pres.ShapeType.roundRect, fill: f, line: l, size: 14, margin: [0, 0.1, 0, 0.1], valign: "middle", align: "center" });
    });
  }

  // ---------- 6. What Jev reads ----------
  {
    const s = base(
      7,
      "Jev reads the chat first, then one rule at a time",
      "Jev is called twice. The first call reads the chat only: the text and the name of the sender. The second call runs when the action changes the state. It reads the chat, the account lines that this action needs, the actions already done, and one question for each written rule of the action, for example: is the amount above 100 dollars? The questions are written text, not code; a fixed table picks the account lines. We found that each rule needs a question that we write: questions made from the text of the rule alone made more errors."
    );
    const gapI = 0.3, wI = (CW - 2 * gapI) / 3, yI = 1.6, hI = 2.55;
    const inputs = [
      ["LuMessageSquareText", "The chat", "chat"],
      ["LuDatabase", "The account", "account"],
      ["LuScale", "One question per rule", "rules"],
    ];
    inputs.forEach(([icon, name, kind], i) => {
      const x = ML + i * (wI + gapI);
      box(s, x, yI, wI, hI);
      iconCircle(s, icon, x + 0.25, yI + 0.2, 0.6, C.blue);
      textBox(s, name, x + 1.0, yI + 0.2, wI - 1.2, 0.6, { size: 20, bold: true, color: C.navy, valign: "middle" });
      if (kind === "chat") {
        s.addText(bullets(["The text of the message", "The name of the sender", "Both calls read it"]), { x: x + 0.3, y: yI + 1.1, w: wI - 0.6, h: 1.3, margin: 0, fontFace: FONT, fontSize: 17, color: C.text, paraSpaceAfter: 8, valign: "top" });
      } else if (kind === "account") {
        FIELDS.forEach((f, k) => {
          textBox(s, f, x + 0.3 + (k % 3) * 1.12, yI + 1.0 + Math.floor(k / 3) * 0.5, 1.02, 0.4, { shape: pres.ShapeType.roundRect, fill: "EEF1F5", line: "C5CDD6", color: C.navy, bold: true, size: 14, margin: 0, valign: "middle", align: "center" });
        });
        textBox(s, "Second call only: the fields of the action", x + 0.3, yI + 2.05, wI - 0.6, 0.4, { size: 14, color: C.muted });
      } else {
        s.addText(bullets(["Is the amount above $100?", "Is the charge older than 14 days?", "Is the auto-renewal already off?"]), { x: x + 0.3, y: yI + 1.05, w: wI - 0.6, h: 1.4, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 6, valign: "top" });
      }
      line(s, x + wI / 2, yI + hI + 0.03, 0, 0.32, { arrow: true });
    });
    textBox(s, [{ text: "Jev", options: { bold: true } }, { text: ": call 1 reads the chat; call 2 adds the account and the questions" }], ML, 4.5, CW, 0.75, {
      shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, size: 24, margin: 0.2, valign: "middle", align: "center",
    });
    band(s, 5.55, 0.8, "LuLock", [{ text: "Rules are questions, not code. ", options: { bold: true } }, { text: "A fixed table picks the account lines of the action; Jev answers each rule." }]);
  }

  // ---------- 7. What Jev answers ----------
  {
    const s = base(
      8,
      "Jev answers four questions, then one per rule",
      "The first call answers four fixed questions: the topic, the priority, the action, and an injection flag. If the injection flag is on, the action becomes Send reply, so an order hidden in the text is ignored. If the action changes the state, the second call answers one yes/no question for each written rule of that action: is this rule broken? If no answer says broken, the action runs; if one does, nothing runs. Now, three real requests."
    );
    // Call 1 answers the first four questions; Call 2 answers one question per rule. A bar over the cards names each call.
    const questions = [
      ["LuTags", "Topic", "What the request is about", ["Account", "Payments", "Plans and Credits", "Product Help", "Refunds", "Security"]],
      ["LuGauge", "Priority", "How urgent the request is", ["Low", "Medium", "High", "Critical"]],
      ["LuZap", "Action", "What the customer asks to do", ["Send reply", "Start refund", "Delete data", "Cancel plan", "Reset password"]],
      ["LuShieldX", "Injection flag", "The text gives orders to the model", ["on", "off"]],
      ["LuScale", "Rules", "One yes/no question for each rule", ["Broken", "Not broken"]],
    ];
    const gapC = 0.2, gapX = 0.55, wC = (CW - 3 * gapC - gapX) / 5, yB = 1.5, yC = 1.95, hC = 3.9;
    const xOf = (i) => ML + i * (wC + gapC) + (i === 4 ? gapX - gapC : 0);
    const pill = (txt, x, y, w, fill, color, size = 13, h = 0.3) =>
      s.addText(txt, { shape: pres.ShapeType.roundRect, rectRadius: 0.14, x, y, w, h, fill: { color: fill }, margin: 0, fontFace: FONT, fontSize: size, color, align: "center", valign: "middle", wrap: false });
    pill("Call 1: Jev answers four questions", ML, yB, xOf(3) + wC - ML, C.blue, C.white, 14, 0.36);
    pill("Call 2: one per rule", xOf(4), yB, wC, C.teal, C.white, 14, 0.36);
    s.addShape(pres.ShapeType.rightArrow, { x: xOf(3) + wC + 0.1, y: yC + hC / 2 - 0.2, w: gapX - 0.2 + gapC - 0.1, h: 0.4, fill: { color: C.grey }, line: { color: C.grey, width: 0 } });
    questions.forEach(([icon, name, ask, options], i) => {
      const last = i === 4, x = xOf(i), inner = wC - 0.4;
      box(s, x, yC, wC, hC, last ? { fill: C.tealL } : {});
      iconCircle(s, icon, x + 0.2, yC + 0.2, 0.6, last ? C.teal : C.blue);
      textBox(s, name, x + 0.2, yC + 0.95, inner, 0.42, { size: 20, bold: true, color: C.navy, valign: "middle" });
      textBox(s, ask, x + 0.2, yC + 1.4, inner, 0.55, { size: 15 });
      // The values as chips, packed left to right and wrapped to the width of the card.
      let cx = 0, cy = yC + 1.95;
      options.forEach((o) => {
        const w = o.length * 0.078 + 0.22;
        if (cx > 0 && cx + w > inner) { cx = 0; cy += 0.36; }
        const bad = o === "on" || o === "Broken"; // the value that changes what the process does
        pill(o, x + 0.2 + cx, cy, w, bad ? "FAD4D0" : last ? C.white : "E9F0F8", bad ? "B91C1C" : C.navy);
        cx += w + 0.08;
      });
      cy += 0.45;
      if (i === 3) textBox(s, [{ text: "If on: ", options: { bold: true, color: "B91C1C" } }, { text: "the action is Send reply, so the orders in the text are ignored." }], x + 0.2, cy, inner, 1.1, { size: 14 });
      if (last) textBox(s, "Only if the action changes the state", x + 0.2, cy, inner, 0.7, { size: 14, color: C.navy });
    });
    band(s, 6.05, 0.8, "LuShieldCheck", [{ text: "The process follows the answers: ", options: { bold: true } }, { text: "no broken rule runs the action; a broken rule runs nothing, and the Final message says why." }]);
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
    ok: { accent: C.teal, light: "E9F0F8", line: C.teal, badge: "ALLOWED: no rule is broken" },
    warn: { accent: "B45309", light: "FDEBC8", line: "B45309", badge: "WARNING: a rule is broken" },
    danger: { accent: "B91C1C", light: "FAD4D0", line: "B91C1C", badge: "DANGER: an attack in the message" },
  };

  const DIM = { fill: "E9EDF2", ring: "AEB7C2", text: "6B7785", arrow: "9AA6B3" }; // a state that the request has not reached
  const CHIP = "E9F0F8"; // light tint of a chip on a white card
  const FLOW = [
    ["New", "LuMail", "fx", "Fixed code"],
    ["Jev", "LuTags", "md", "Model: Jev"],
    ["Rules", "LuScale", "md", "Model: Jev"],
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

    const H = 1.35, S = 1.1, y0 = 2.15, yDeny = 3.72, wN = FLOW.map((_, i) => (i < 5 ? 1.6 : S)), hN = FLOW.map((_, i) => (i < 5 ? H : 1.0));
    const gap = (CW - wN.reduce((a, v) => a + v, 0)) / 6;
    const X = FLOW.map((_, i) => ML + wN.slice(0, i).reduce((a, v) => a + v, 0) + i * gap);
    const yN = hN.map((h) => y0 + (H - h) / 2);
    const cx = X.map((x, i) => x + wN[i] / 2);
    const PX = ML, PY = 4.1, PW = CW, PH = 2.65; // the panel below the diagram

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
    litAt[6] = K; // Resolved lights with Chat open, on the last slide
    arrowAt[5] = K;
    const seg = (g, x, y, w, h, on, arrow, flipV) =>
      g.addShape(pres.ShapeType.line, {
        x, y, w, h, flipV, line: { color: on ? C.navy : DIM.arrow, width: on ? 3.5 : 2, endArrowType: arrow ? "triangle" : undefined },
      });
    FLOW.forEach(([name, icon, kind], i) => {
      sc.group(`state-${i}`, {}, (g) => {
        const on = frame >= litAt[i];
        const [fill, accent] = i === c.hot ? [tone.light, tone.accent] : kinds[kind];
        box(g, X[i], yN[i], wN[i], hN[i], { fill: on ? fill : DIM.fill, ...(on && i === c.hot ? { line: tone.accent, lineW: 2 } : {}) });
        if (i < 5) {
          iconCircle(g, icon, cx[i] - 0.25, y0 + 0.12, 0.5, on ? accent : DIM.ring);
          textBox(g, name, X[i] + 0.04, y0 + 0.68, wN[i] - 0.08, 0.34, { size: 15, bold: true, color: on ? C.navy : DIM.text, align: "center", valign: "middle", margin: 0 });
        } else {
          iconCircle(g, icon, cx[i] - 0.18, yN[i] + 0.1, 0.36, on ? accent : DIM.ring);
          textBox(g, name, X[i] + 0.02, yN[i] + 0.58, wN[i] - 0.04, 0.34, { size: 14, bold: true, color: on ? C.navy : DIM.text, align: "center", valign: "middle", margin: 0 });
        }
      });
      if (i < 6) sc.group(`arrow-${i}`, {}, (g) => seg(g, X[i] + wN[i] + 0.02, y0 + H / 2, gap - 0.04, 0, frame >= arrowAt[i], true, false));
    });
    sc.group("deny", {}, (g) => {
      const on = frame >= denyAt, color = on ? tone.line : DIM.arrow, width = on ? 3.5 : 2;
      const part = (x, y, w, h, arrow, flipV) =>
        g.addShape(pres.ShapeType.line, { x, y, w, h, flipV, line: { color, width, endArrowType: arrow ? "triangle" : undefined } });
      part(cx[2], y0 + H, 0, yDeny - (y0 + H), false, false);
      part(cx[2], yDeny, cx[4] - cx[2], 0, false, false);
      part(cx[4], y0 + H, 0, yDeny - (y0 + H), true, true);
      textBox(g, "a rule is broken: nothing runs", cx[2], yDeny + 0.03, cx[4] - cx[2], 0.3, { size: 14, color: DIM.text, align: "center", valign: "middle" });
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
        "Jev: reads the chat and gives four answers",
        "Rules: Jev answers one question for each rule",
        "Do action: fixed code runs the action",
        "Final message: the LLM writes the reply",
        "Chat open: a popup asks if the issue is solved",
      ][node];
      card(named("card", 3), node, title);
      if (node === 0) {
        textBox(g, "The message is saved. No model runs and no rule is applied in this state.", PX + 0.25, PY + 0.85, PW - 0.5, 0.9, { size: 18 });
      } else if (node === 1) {
        const t = c.jev, n = t.answers.length, w = (PW - 0.5 - (n - 1) * 0.15) / n;
        t.answers.forEach(([label, value, conf], i) => {
          const hot = t.warn === i;
          const runs = [
            { text: label, options: { fontSize: 14, color: C.muted, breakLine: true } },
            { text: value, options: { fontSize: 18, bold: true, color: hot ? tone.accent : C.navy, breakLine: Boolean(conf) } },
          ];
          if (conf) runs.push({ text: conf, options: { fontSize: 14, color: C.muted } });
          textBox(g, runs, PX + 0.25 + i * (w + 0.15), PY + 0.7, w, 0.9, {
            shape: pres.ShapeType.roundRect, fill: hot ? tone.light : CHIP, line: hot ? tone.accent : CHIP, lineW: hot ? 3 : 1, margin: [0.04, 0.12, 0.04, 0.12], valign: "middle",
          });
        });
        textBox(g, t.rule, PX + 0.25, PY + 1.8, PW - 0.5, 0.3, { size: 16, bold: true, color: C.navy, valign: "middle" });
        textBox(g, t.note, PX + 0.25, PY + 2.15, PW - 0.5, 0.3, { size: 14, color: C.muted, valign: "middle" });
      } else if (node === 2) {
        const r = c.rules;
        if (r) {
          // One chip for each rule question: the name of the rule, and "met" or "broken" with the confidence of the answer. Five chips in the first row.
          const per = 5, w = (PW - 0.5 - (per - 1) * 0.12) / per;
          r.chips.forEach(([name, state, conf], i) => {
            const broken = state === "broken";
            textBox(g, [
              { text: name, options: { fontSize: 14, color: C.muted, breakLine: true } },
              { text: `${state}  ${conf.toFixed(2)}`, options: { fontSize: 16, bold: true, color: broken ? tone.accent : C.navy } },
            ], PX + 0.25 + (i % per) * (w + 0.12), PY + 0.68 + Math.floor(i / per) * 0.68, w, 0.58, {
              shape: pres.ShapeType.roundRect, fill: broken ? tone.light : CHIP, line: broken ? tone.accent : CHIP, lineW: broken ? 3 : 1, margin: [0.03, 0.1, 0.03, 0.1], valign: "middle",
            });
          });
          textBox(g, r.rule, PX + 0.25, PY + 2.05, PW - 0.5, 0.28, { size: 16, bold: true, color: C.navy, valign: "middle" });
          textBox(g, r.note, PX + 0.25, PY + 2.33, PW - 0.5, 0.25, { size: 14, color: C.muted, valign: "middle" });
        } else {
          textBox(g, "No question is asked: the action is Send reply, and a reply changes nothing.", PX + 0.25, PY + 0.85, PW - 0.5, 0.9, { size: 18 });
        }
      } else if (node === 3) {
        g.addText(bullets(c.act), { x: PX + 0.25, y: PY + 0.85, w: PW - 0.5, h: 1.0, margin: 0, fontFace: FONT, fontSize: 18, color: C.text, paraSpaceAfter: 8, valign: "top" });
      } else if (node === 4) {
        textBox(g, `\u201C${c.final.text}\u201D`, PX + 0.25, PY + 0.72, PW - 0.5, 0.98, {
          shape: pres.ShapeType.roundRect, fill: CHIP, line: CHIP, size: 15, margin: [0.06, 0.15, 0.06, 0.15], valign: "middle",
        });
        textBox(g, c.final.meta, PX + 0.25, PY + 1.74, PW - 0.5, 0.25, { size: 14, color: C.muted, valign: "middle" });
      } else if (node === 5) {
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
      if (c.deny && node === 4) {
        sc.group("skipped", { in: click }, (g) => {
          textBox(g, "skipped", X[3], y0 + 1.02, wN[3], 0.28, { size: 14, bold: true, color: tone.line, align: "center", valign: "middle" });
        });
      }
      sc.group(`panel-${node}`, { in: click, out: last ? undefined : click + 1 }, (g) => panel(g, node));
    });

    // One ring that moves from state to state: Morph slides it from the old state to the new one. On the last slide it rests on Resolved.
    {
      const lastNode = c.path[show[K - 1]];
      const n = frame === 0 ? 0 : frame === K && lastNode === 5 ? 6 : c.path[show[frame - 1]];
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
      "Test data: 512 customers, 1,024 requests",
      "Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data. Public datasets have no SaaS accounts, so we built our own: 512 FrameForge customers. Each has one purchase of a personal plan (Plus, Pro, or Max), the state of the plan, a render-credit balance, and a log of password reset links. So the written rules can use real account fields, and the customers cover every branch of the rules. They send 1,024 requests of 21 types."
    );
    box(s, ML, 1.6, 6.3, 5.0);
    textBox(s, "One customer in the test data", ML + 0.3, 1.75, 5.7, 0.5, { size: 20, bold: true, color: C.navy, valign: "middle" });
    [
      ["LuDollarSign", "One purchase: a monthly or an annual plan (Plus, Pro, or Max)"],
      ["LuFileText", "A plan and the state of the plan"],
      ["LuCpu", "A render-credit balance"],
      ["LuLock", "A log of password reset links"],
    ].forEach(([ic, t], i) => {
      const y = 2.6 + i * 1.0;
      iconCircle(s, ic, ML + 0.3, y, 0.6, C.blue);
      textBox(s, t, ML + 1.15, y, 4.95, 0.6, { size: 17, valign: "middle" });
    });
    const gx = ML + 6.6, gw = (CW - 6.6 - 0.3) / 2, gh = 2.35;
    [
      ["LuUsers", "512", "FrameForge customers"],
      ["LuFileText", "1,024", "requests, one run and no split"],
      ["LuTags", "21", "request types"],
      ["LuUser", "1 to 3", "requests from each customer", 30],
    ].forEach(([ic, n, l, sz], i) => {
      statCard(s, gx + (i % 2) * (gw + 0.3), 1.6 + Math.floor(i / 2) * (gh + 0.3), gw, gh, { icon: ic, big: n, label: l, bigSize: sz || 30, labelY: 1.3 });
    });
  }

  // ---------- 12. Request families ----------
  {
    const s = base(
      13,
      "1,024 requests in ten families",
      "A seeded generator wrote the 1,024 requests. The 21 types form ten families. Questions and answers is the largest, with 288 requests, then refunds with 144, plan cancellations with 104, and password resets with 96. Every request has its own words. The correct answers come from the written rules, because the generator runs the real code. A rule denies the action on 248 of the 1,024 requests."
    );
    box(s, ML, 1.6, 7.9, 5.0);
    const fam = [
      ["Questions and answers", 288], ["Refund", 144], ["Cancel plan", 104], ["Reset password", 96], ["Invoice or request for a human", 96],
      ["Fraud or data loss", 96], ["Delete data", 56], ["Injection", 48], ["Two problems in one request", 48], ["Closing message", 48],
    ];
    s.addChart(pres.charts.BAR, [{ name: "Requests", labels: fam.map((f) => f[0]), values: fam.map((f) => f[1]) }], {
      ...chartBase, showLegend: false, x: ML + 0.2, y: 1.7, w: 7.5, h: 4.8, barDir: "bar", barGapWidthPct: 40, chartColors: [C.l3],
      dataLabelPosition: "outEnd", dataLabelFontSize: 14, catAxisLabelFontSize: 14, catAxisOrientation: "maxMin", valAxisMaxVal: 330,
      showTitle: true, title: "Requests per family (1,024 in total)",
    });
    const x = ML + 8.2, w = CW - 8.2;
    callout(s, x, 1.6, w, 1.5, { icon: "LuScale", big: "248 of 1,024", label: "requests where a written rule denies the action", color: C.teal, bigSize: 28 });
    callout(s, x, 3.3, w, 1.5, { icon: "LuCpu", big: "Real code", label: "the generator runs the code of the system to make the correct answer", color: C.l3, bigSize: 28 });
    callout(s, x, 5.0, w, 1.6, { icon: "LuShieldX", big: "48 attacks", label: "requests that hide an order in the message", color: C.l3, bigSize: 28 });
  }

  // ---------- 13. Outcomes ----------
  {
    const s = base(
      14,
      "Every request ends served, stopped, or in error",
      "Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run. A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report the machine time of one request, the API cost per 1,000 requests, and a sign test on the errors. Now my teammate Vu Van Son will explain the run."
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
      ["LuBadgeCheck", "Sign test", "on the errors of the two levels"],
    ].forEach(([ic, big, label], i) => {
      callout(s, ML + i * (cw + gap), 5.85, cw, 1.0, { icon: ic, big, label, color: C.l3, bigSize: 20, bigH: 0.42, bigY: 0.1, labelSize: 14 });
    });
  }

  // ---------- 13. The run ----------
  {
    const s = base(
      15,
      "Both levels run on the same 1,024 requests",
      "Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment. We call two hosted models for real: Jev, version 1.13.0, and DeepSeek V4.1 Flash. Both levels run on the same 1,024 requests. At Level 3, Jev answers the chat of every request once, and answers the rule questions on the 371 requests whose action changes the state: 1,395 Jev calls. Every count gets a 95% interval. We ask one question: what does each level buy and cost?"
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y = 1.55, h = 1.85;
    [
      ["LuCpu", "1,024", "requests at every level: staff, the LLM agent, and Jev"],
      ["LuBot", "1,395", "Jev calls: one per request, plus a second call on 371"],
      ["LuDatabase", "2,419", "model calls at Level 3: 1,395 to Jev and 1,024 to the LLM"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, ML + i * (cw + gap), y, cw, h, { icon: ic, big: n, label: l, bigSize: 32, labelY: 1.2 });
    });
    {
      const yy = 3.9;
      box(s, ML, yy, CW, 1.5);
      textBox(s, "Q1", ML + 0.35, yy + 0.4, 1.1, 0.7, { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, bold: true, size: 24, margin: 0, valign: "middle", align: "center" });
      textBox(s, "What does each level buy and cost? Served, stopped, errors, harm, time, and cost.", ML + 1.85, yy, CW - 2.15, 1.5, { size: 24, valign: "middle" });
    }
    textBox(s, "Calls to two hosted models: Jev (jev-1.13.0) and deepseek-v4.1-flash through the DeepSeek API. Every interval is a 95% interval.", ML, 6.15, CW, 0.7, { size: 15, color: C.muted, valign: "middle" });
  }

  // ---------- 15. Models, input, and prices ----------
  {
    const s = base(
      16,
      "Level 3 reads less, so it costs about half",
      "Level 2 reads the chat text, the sender, the channel, the matching help articles, the whole account, and the written rules. Level 3 reads less: the chat first, then only the account lines and the rule questions of one action. Jev costs 4.2 cents per million input tokens, and its output is free. The LLM costs 15 cents in and 60 cents out per million tokens, with high reasoning effort. The first Jev call reads 1,205 tokens and writes 196. The second call, on 371 of the 1,024 requests, reads 705 tokens and writes 97. One LLM agent call reads 1,229 tokens and writes 268, because reasoning counts. At list price, for 1,000 requests, Level 2 costs $0.61, and Level 3 costs $0.29: for each request, 1.4 calls to Jev and 1 to the LLM."
    );
    // One card for each level: the cost per 1,000 requests, a bar in proportion, the calls that one request makes, and what the level reads.
    const gap = 0.3, cw = (CW - gap) / 2, y = 1.6, h = 3.6, barW = cw - 0.7;
    [
      { x: ML, head: "Level 2: LLM agent", icon: "LuBot", col: C.l2, cost: "$0.61", share: 1, calls: [["LLM call", C.grey, 1.4], ["LLM call", C.grey, 1.4]], reads: "Reads the whole account and all the rules" },
      { x: ML + cw + gap, head: "Level 3: Jev + LLM", icon: "LuTags", col: C.l3, cost: "$0.29", share: 0.29 / 0.61, calls: [["Jev call \u00d7 1.4", C.l3, 2.0], ["LLM call", C.grey, 1.4]], reads: "Reads the chat first, then the rules of one action" },
    ].forEach((o) => {
      box(s, o.x, y, cw, h);
      iconCircle(s, o.icon, o.x + 0.35, y + 0.25, 0.65, o.col);
      textBox(s, o.head, o.x + 1.2, y + 0.25, cw - 1.5, 0.65, { size: 22, bold: true, color: C.navy, valign: "middle" });
      textBox(s, o.cost, o.x + 0.35, y + 1.0, 2.3, 0.95, { size: 54, bold: true, color: o.col, valign: "middle", margin: 0 });
      textBox(s, "per 1,000 requests", o.x + 2.7, y + 1.0, cw - 3.0, 0.95, { size: 18, color: C.muted, valign: "middle" });
      s.addShape(pres.ShapeType.roundRect, { x: o.x + 0.35, y: y + 2.05, w: barW, h: 0.3, rectRadius: 0.05, fill: { color: "E9EDF2" }, line: { color: "E9EDF2", width: 0 } });
      s.addShape(pres.ShapeType.roundRect, { x: o.x + 0.35, y: y + 2.05, w: barW * o.share, h: 0.3, rectRadius: 0.05, fill: { color: o.col }, line: { color: o.col, width: 0 } });
      let cx = o.x + 0.35;
      o.calls.forEach(([txt, fill, w]) => {
        textBox(s, txt, cx, y + 2.55, w, 0.36, { shape: pres.ShapeType.roundRect, fill, line: fill, color: C.white, bold: true, size: 14, margin: 0, valign: "middle", align: "center" });
        cx += w + 0.15;
      });
      textBox(s, "for each request", cx + 0.05, y + 2.55, 1.8, 0.36, { size: 14, color: C.muted, valign: "middle" });
      textBox(s, o.reads, o.x + 0.35, y + 3.0, cw - 0.7, 0.4, { size: 16, valign: "middle" });
    });
    // The list prices that the costs come from.
    {
      const py = 5.45, ph = 1.1;
      box(s, ML, py, CW, ph);
      [
        ["LuTags", C.l3, "Jev: $0.042 per million input tokens, output free"],
        ["LuBot", C.grey, "LLM agent (deepseek-v4.1-flash): $0.15 in, $0.60 out per million tokens"],
      ].forEach(([ic, col, txt], i) => {
        const x = ML + 0.35 + i * (CW / 2);
        iconCircle(s, ic, x, py + ph / 2 - 0.3, 0.6, col);
        textBox(s, txt, x + 0.8, py, CW / 2 - 1.4, ph, { size: 16, valign: "middle" });
      });
    }
  }

  // ---------- 7. Result 1: Jev ----------
  {
    const s = base(
      17,
      "Result 1: Jev is fast and cheap, and mostly right",
      "Now the first result, for Jev alone, over the 1,024 requests. One Jev call takes 0.31 seconds at the median, and the Jev calls cost 6 cents per 1,000 requests. Jev gives the right topic on 91% of the requests, the priority on 81%, the action on 87%, and the injection flag on 93%. The rule questions are always right: all 1,656 answers match the written rules. The action label is wrong on 125 requests, but none of them ends in a wrong outcome: when a rule would deny a request, Jev often picks Send reply, and the result is still a stop. The intervals are wide. Now my teammate Vuong Quang Quy will compare the two levels."
    );
    box(s, ML, 1.65, 7.6, 4.9);
    const labels = ["Topic", "Priority", "Action", "Injection flag", "Rule answers"];
    s.addChart(
      pres.charts.BAR,
      [{ name: "Jev", labels, values: [90.8, 80.7, 87.3, 93.1, 100.0] }],
      {
        ...chartBase, showLegend: false, x: ML + 0.2, y: 1.8, w: 7.2, h: 4.6, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
        chartColors: [C.l3, C.l3, C.l3, C.l3, C.teal], dataLabelPosition: "outEnd", dataLabelFontSize: 15, dataLabelFormatCode: "0.0",
        catAxisLabelFontSize: 14, valAxisHidden: false, valAxisMaxVal: 110, valAxisMajorUnit: 20, valAxisLabelFontSize: 14, valAxisLabelColor: C.text,
        valAxisLabelFormatCode: '0"%"', valAxisLineShow: true, valGridLine: { color: "D5DBE3", size: 0.75 }, title: "Percent correct over the 1,024 requests",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.5, { icon: "LuZap", big: "0.31 s", label: "median time for one Jev call", color: C.l3 });
    callout(s, x, 3.35, w, 1.5, { icon: "LuDollarSign", big: "$0.061", label: "per 1,000 requests for the Jev calls", color: C.l3 });
    callout(s, x, 5.05, w, 1.5, { icon: "LuBadgeCheck", big: "0 of 125", label: "wrong action labels end in a wrong outcome", color: C.teal, bigSize: 30, labelSize: 14 });
  }

  // ---------- 8. Result 2: the ladder ----------
  {
    const s = base(
      18,
      "Result 2: Level 3 is faster, cheaper, and makes fewer errors",
      "Thank you, Son. My name is Vuong Quang Quy. I will compare the two levels on the same 1,024 requests. Level 2 serves 728, stops 235, and makes 61 errors, about 13 of them harmful. Level 3 serves 776, stops 248, and makes no error, and none is harmful. Level 3 is 1.8 times faster, 4.28 seconds against 7.85, and 2.1 times cheaper, 29 cents against 61 cents per 1,000 requests. The two levels fail on different requests: Level 2 fails on 48 injection requests and on 13 refund requests, where it cancelled the plan. Level 2 was wrong and Level 3 right on 61 of the 1,024 requests, and the reverse on none. The sign test gives p = 0.031, so Level 3 makes significantly fewer errors on these requests. Level 3 uses two Jev calls on 4 requests in 10, and that adds little time and cost. Now Nguyen Phuong Nam will explain how Level 3 limits each model, and why it stays safe."
    );
    box(s, ML, 1.65, 7.6, 3.95);
    const cats = ["Level 2: LLM agent", "Level 3: Jev + LLM"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Served", labels: cats, values: [728, 776] },
        { name: "Stopped by a rule", labels: cats, values: [235, 248] },
        { name: "Errors", labels: cats, values: [61, null] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.75, w: 7.2, h: 3.75, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 45,
        chartColors: [C.l3, C.teal, C.red], dataLabelPosition: "ctr", dataLabelColor: C.white, dataLabelFontSize: 15, dataLabelFormatCode: "0;-0;;@",
        catAxisOrientation: "maxMin", valAxisMaxVal: 1300, title: "Outcome of the 1,024 requests",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.25, { icon: "LuTimer", big: "1.8x", label: "faster: 4.28 s against 7.85 s of machine time", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 3.0, w, 1.25, { icon: "LuDollarSign", big: "2.1x", label: "cheaper: $0.29 against $0.61 per 1,000 requests", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 4.35, w, 1.25, { icon: "LuBadgeCheck", big: "61 vs 0", label: "errors at Level 2 and Level 3. Sign test: p = 0.031", color: C.teal, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    // The result of Level 3 has no bar, so it gets a label at the end of its row.
    textBox(s, "0 errors", ML + 6.4, 4.1, 0.95, 0.5, { size: 16, bold: true, color: C.teal, valign: "middle", align: "right", margin: 0 });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "Harmful runs: ", options: { bold: true } }, { text: "0 at Level 3, about 13 at Level 2." }]);
  }

  // ---------- 17. Our idea: limit each model ----------
  // Our own design only, no outside source: what each part of Level 3 may do, and what it may not do.
  {
    const s = base(
      19,
      "Our idea: limit what each model can trigger",
      "Thank you, Quy. My name is Nguyen Phuong Nam. I will explain how Level 3 limits each model, and why it stays safe. " +
        "Text in a request can give orders to a model. So at Level 3, no model decides alone. " +
        "Jev only answers typed questions. It cannot run an action. The process checks the written rules and runs the action. One broken rule is enough to stop it. " +
        "The LLM only writes the final message. It does not change any decision. Result 2 shows what this design buys."
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y0 = 1.6, h0 = 3.95;
    [
      ["LuTags", "Jev", C.l3, "Answers typed questions: topic, priority, action, injection flag, and one yes or no for each rule. It cannot run an action."],
      ["LuShieldCheck", "Process", C.teal, "Reads the account, checks the written rules, and runs the action. One broken rule is enough to stop it."],
      ["LuBot", "LLM", C.blue, "Writes the final message. It does not change any decision."],
    ].forEach(([ic, big, col, text], i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y0, cw, h0);
      iconCircle(s, ic, x + 0.3, y0 + 0.3, 0.9, col);
      textBox(s, big, x + 1.45, y0 + 0.3, cw - 1.65, 0.9, { size: 30, bold: true, color: col, valign: "middle" });
      textBox(s, text, x + 0.3, y0 + 1.6, cw - 0.6, 2.2, { size: 22 });
    });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "No model decides alone: ", options: { bold: true } }, { text: "the process decides if an action runs." }]);
  }

  // ---------- 9. Why it stays safe ----------
  // Three guards between a wrong answer of Jev and the customer. Every figure is on Result 1 (slide 26).
  {
    const s = base(
      20,
      "Why Level 3 stays safe when Jev is wrong",
      "Jev is not always right. So three guards stand between a wrong answer and the customer. " +
        "First, the injection flag. Jev sets it right on 93 percent of the requests. When it is on, the process sets the action to Send reply. " +
        "Second, the rule questions. Jev answers all of them as the written rules do: 1,656 of 1,656. One broken rule stops the action. " +
        "Third, the outcome. The action label is wrong on 125 requests, and none of them ends in a wrong outcome. " +
        "That is why Level 3 makes no error and no harmful run."
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y0 = 1.6, h0 = 3.95;
    [
      ["LuShieldX", "Injection flag", "93%", C.red, "of the flags are right. When the flag is on, the process sets the action to Send reply."],
      ["LuScale", "Rule questions", "100%", C.teal, "of the answers match the written rules. One broken rule stops the action."],
      ["LuTarget", "Outcome", "0 of 125", C.l3, "wrong action labels end in a wrong outcome."],
    ].forEach(([ic, head, big, col, text], i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y0, cw, h0);
      iconCircle(s, ic, x + 0.3, y0 + 0.3, 0.7, col);
      textBox(s, head, x + 1.2, y0 + 0.3, cw - 1.4, 0.7, { size: 22, bold: true, color: C.navy, valign: "middle" });
      textBox(s, big, x + 0.3, y0 + 1.3, cw - 0.6, 0.9, { size: 54, bold: true, color: col, valign: "middle" });
      textBox(s, text, x + 0.3, y0 + 2.3, cw - 0.6, 1.5, { size: 18 });
    });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "The result: ", options: { bold: true } }, { text: "Level 3 makes 0 errors and 0 harmful runs." }]);
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
        "Same 1,024 requests at every level. Level 2: 728 served, 235 stopped, 61 errors. Level 3: 776 served, 248 stopped, 0 errors.",
        "Level 3 is 1.8x faster and 2.1x cheaper, with fewer errors (p\u00a0=\u00a00.031).",
        "Jev needs a question that we write for each rule.",
      ]),
      { x: M, y: 1.65, w: LW, h: 4.3, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, paraSpaceAfter: 9, valign: "top" }
    );
    s.addText("Next: real tickets and a larger set of requests.", { x: M, y: 6.0, w: LW, h: 0.8, margin: 0, fontFace: FONT, fontSize: 22, bold: true, color: C.white, valign: "bottom" });
    [
      { icon: "LuBadgeCheck", big: "61 vs 0", label: "errors at Level 2 and Level 3. Sign test: p\u00a0=\u00a00.031", color: C.teal },
      { icon: "LuTimer", big: "1.8x", label: "faster: 4.28 s against 7.85 s of machine time", color: C.l3 },
      { icon: "LuDollarSign", big: "2.1x", label: "cheaper: $0.29 against $0.61 per 1,000 requests", color: C.l3 },
    ].forEach((o, i) => callout(s, CX, 0.7 + i * 2.1, CWd, 1.9, { ...o, bigSize: 38, bigH: 0.8, bigY: 0.25, labelSize: 15 }));
    s.addNotes(
      `Speaker: ${PNAM}, about ${SPEAKER[20][1]} s. To finish, we tested three levels of customer support on the same 1,024 requests. Level 2 serves 728, stops 235, and makes 61 errors. Level 3 serves 776, stops 248, and makes no error. ` +
        "Level 3 is 1.8 times faster and 2.1 times cheaper, and it makes fewer errors: it was never wrong where Level 2 was right, and Level 2 was wrong on 61 requests where it was right. Jev needs a question that we write for each rule. The next step is real tickets and a larger set of requests. " +
        "Thank you for listening. Our leader, Tran Thanh Long, will now take your questions."
    );
  }


  // ---------- Questions ----------
  // The same grid as the title and the conclusion: the invitation on the deep blue field, and on the light panel the slides to open for the
  // four kinds of question that we expect.
  {
    const s = pres.addSlide();
    s.background = { color: C.l3 };
    const M = 0.7, LW = 5.9, PX = 6.9, CX = PX + 0.7, CWd = 13.333 - 0.7 - CX;
    s.addShape(pres.ShapeType.rect, { x: PX, y: 0, w: 13.333 - PX, h: 7.5, fill: { color: C.bg }, line: { color: C.bg, width: 0 } });
    s.addText("Questions?", { x: M, y: 0.7, w: LW, h: 1.2, margin: 0, fontFace: FONT, fontSize: 60, bold: true, color: C.white, valign: "top" });
    s.addText("Thank you for listening.", { x: M, y: 2.0, w: LW, h: 0.6, margin: 0, fontFace: FONT, fontSize: 24, color: "E3ECF6", valign: "top" });
    s.addText("Team", { x: M, y: 4.98, w: LW, h: 0.32, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: "E3ECF6", valign: "middle" });
    const team = [LONG, NAM, SON, QUY, PNAM];
    s.addText(team.map((n, i) => ({ text: n, options: { breakLine: i < team.length - 1 } })), {
      x: M, y: 5.3, w: LW, h: 1.5, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, valign: "top",
    });
    [
      { icon: "LuWorkflow", big: "Slide 6", label: "The flow of Level 3: why a state machine", color: C.l3 },
      { icon: "LuDatabase", big: "Slides 21 to 23", label: "Test data and how we score", color: C.l3 },
      { icon: "LuBadgeCheck", big: "Slides 26 and 27", label: "Results: Jev, and the two levels", color: C.teal },
      { icon: "LuScale", big: "Slide 29", label: "Why Level 3 stays safe when Jev is wrong", color: C.blue },
    ].forEach((o, i) => callout(s, CX, 0.7 + i * 1.55, CWd, 1.35, { ...o, bigSize: 28, bigH: 0.55, bigY: 0.12, labelSize: 15 }));
    s.addNotes("Question slide, not part of the timed talk. Tran Thanh Long answers; the other four stand beside him. The cards on the right say which slide to open for each kind of question.");
  }

  const file = await pres.write({ outputType: "nodebuffer" });
  fs.writeFileSync("deck.pptx", await addTransitions(await dropBlankPoints(file), transitions));
  console.log("wrote deck.pptx,", pres.slides.length, "slides");
})();
