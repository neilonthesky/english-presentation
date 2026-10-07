// Builds slides/deck.pptx: the FrameForge SaaS customer support presentation (paper v35, three levels).
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

const C = {
  bg: "D6DDE5", // soft cool light tone (slide background)
  card: "FFFFFF",
  border: "8C9BAD",
  navy: "1B365D", // titles
  text: "2B3440",
  muted: "56636F",
  blue: "2F5F98", // model, primary
  blueM: "3E6A9A", // mid-tone background for title/closing slides
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
  [LONG, 75], [LONG, 110], [LONG, 117], [NAM, 45], [NAM, 72],
  [SON, 162], [QUY, 30], [QUY, 60], [PNAM, 75], [PNAM, 40],
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
    "LuCpu", "LuGauge", "LuLock",
  ];
  const img = {};
  for (const n of ICONS) img[n] = await iconPng(n);
  const shots = {
    title: await photo("assets/title.jpg", 5.2, 5.2),
    machine: await photo("assets/machine.jpg", 2.4, 2.4),
    human: await photo("assets/human.jpg", 2.4, 2.4),
    closing: await photo("assets/closing.jpg", 4.9, 4.9),
  };

  // Speaker line at the bottom left of every slide (light text on the mid-tone title and closing slides).
  function speakerTag(s, n, light) {
    const [name, secs] = SPEAKER[n - 1];
    s.addText(`Speaker: ${name} · ${secs} s`, {
      x: light ? 0.8 : ML, y: 7.0, w: 6, h: 0.3, margin: 0, fontFace: FONT, fontSize: 11, color: light ? "E3ECF6" : C.muted, valign: "middle",
    });
  }

  function base(n, title, notes) {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addText(title, { x: ML, y: 0.4, w: CW, h: 0.95, margin: 0, fontFace: FONT, fontSize: 34, bold: true, color: C.navy, valign: "middle" });
    s.slideNumber = { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted };
    speakerTag(s, n, false);
    const [name, secs] = SPEAKER[n - 1];
    s.addNotes(`Speaker: ${name}, about ${secs} s. ${notes}`);
    return s;
  }

  // Cards are solid white with no outline; the tinted background separates them.
  const box = (s, x, y, w, h, o = {}) =>
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h, rectRadius: o.radius ?? 0.08, fill: { color: o.fill || C.card },
      ...(o.line ? { line: { color: o.line, width: 1 } } : {}),
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
      line: { color: o.color || C.grey, width: 2, endArrowType: o.arrow ? "triangle" : undefined },
    });

  const bullets = (items) =>
    items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1 } }));

  const band = (s, y, h, icon, runs) => {
    box(s, ML, y, CW, h, { fill: C.teal });
    s.addImage({ data: img[icon], x: ML + 0.3, y: y + h / 2 - 0.25, w: 0.5, h: 0.5 });
    textBox(s, runs, ML + 1.05, y, CW - 1.35, h, { size: 18, color: C.white, valign: "middle" });
  };

  const chartBase = {
    showTitle: true, titleFontSize: 15, titleFontFace: FONT, titleColor: C.text,
    showLegend: true, legendPos: "b", legendFontSize: 14, legendFontFace: FONT, legendColor: C.text,
    showValue: true, dataLabelFontSize: 13, dataLabelFontFace: FONT, dataLabelColor: C.text,
    catAxisLabelColor: C.text, catAxisLabelFontSize: 14, catAxisLabelFontFace: FONT,
    valAxisLabelColor: C.muted, valAxisLabelFontSize: 12, valAxisMinVal: 0, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
  };

  // ---------- 1. Title and team ----------
  {
    const s = pres.addSlide();
    s.background = { color: C.blueM };
    s.addText(TITLE, { x: 0.8, y: 0.5, w: 6.5, h: 2.2, margin: 0, fontFace: FONT, fontSize: 32, bold: true, color: C.white, valign: "top" });
    s.addText("FrameForge, an AI video-generation SaaS: support staff, one LLM agent, then Jev with fixed code and an LLM", {
      x: 0.8, y: 2.4, w: 6.5, h: 0.8, margin: 0, fontFace: FONT, fontSize: 17, color: "E3ECF6", valign: "top",
    });
    s.addText("Task allocation (bar = share of the work and of the talk)", {
      x: 0.8, y: 3.6, w: 6.5, h: 0.3, margin: 0, fontFace: FONT, fontSize: 13, bold: true, color: "E3ECF6", valign: "middle",
    });
    const team = [
      ["Tran Thanh Long (Leader)", 28], ["Nguyen Thanh Nam", 22], ["Vu Van Son", 18], ["Vuong Quang Quy", 17], ["Nguyen Phuong Nam", 15],
    ];
    team.forEach(([name, pct], i) => {
      const y = 4.0 + i * 0.44;
      s.addText(name, { x: 0.8, y, w: 2.7, h: 0.32, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, valign: "middle" });
      const bw = (pct / 28) * 2.6;
      s.addShape(pres.ShapeType.roundRect, { x: 3.6, y: y + 0.04, w: bw, h: 0.24, rectRadius: 0.05, fill: { color: i === 0 ? C.white : "C9DAEC" } });
      s.addText(pct + "%", { x: 3.6 + bw + 0.1, y, w: 0.7, h: 0.32, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, valign: "middle" });
    });
    s.addText("Phenikaa School of Computing\nEnglish Writing and Presentation Skills · October 2026", {
      x: 0.8, y: 6.3, w: 6.5, h: 0.55, margin: 0, fontFace: FONT, fontSize: 14, color: C.white, valign: "top",
    });
    s.addImage({ data: shots.title, x: 7.5, y: 0.95, w: 5.2, h: 5.2 });
    speakerTag(s, 1, true);
    s.addNotes(
      `Speaker: ${LONG}, about 75 s. Good morning. A customer waits two days for a refund; a chatbot that handles money can do harm. ` +
        "We study three levels of customer support for FrameForge, a made-up AI video-generation SaaS: support staff, one LLM agent, and Jev with fixed code and an LLM. " +
        "The bars show the task allocation of the paper: the leader has the largest share, and each member has a different share."
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
        "Level 3 splits the job: Jev gives five typed answers, each with a confidence, fixed code reads only the account fields that the action needs and checks the written rules, and the LLM writes the reply. " +
        "Every level runs on the same 50 requests. " +
        "Opening interaction by the leader: which level is faster and cheaper, Level 2 or Level 3? The answer is not given here; the results show it."
    );
    const gap = 0.45, cw = (CW - 2 * gap) / 3, y = 1.65, h = 4.05;
    [
      { n: "Level 1", head: "Staff only", icon: "LuUsers", bg: C.grey, body: "Support staff read every request. Baseline: 90 s each (assumed)." },
      { n: "Level 2", head: "One LLM agent", icon: "LuBot", bg: C.l2, body: "One LLM agent reads the account and applies the written rules itself. It runs an action or denies it." },
      { n: "Level 3", head: "Jev + fixed code + LLM", icon: "LuTags", bg: C.l3, body: "Jev gives five answers with confidence. Fixed code reads only the fields the action needs and checks the rules. The LLM writes the reply." },
    ].forEach((p, i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, p.icon, x + 0.3, y + 0.3, 0.8, p.bg);
      textBox(s, p.n, x + 0.3, y + 1.25, cw - 0.6, 0.35, { size: 15, bold: true, color: p.bg });
      textBox(s, p.head, x + 0.3, y + 1.6, cw - 0.6, 0.85, { size: 22, bold: true, color: C.navy });
      textBox(s, p.body, x + 0.3, y + 2.5, cw - 0.6, 1.45, { size: 16 });
      if (i < 2) line(s, x + cw + 0.05, y + h / 2, gap - 0.1, 0, { arrow: true });
    });
    band(s, 5.95, 0.8, "LuTarget", [{ text: "One change at a time: ", options: { bold: true } }, { text: "every level runs on the same 50 requests." }]);
  }

  // ---------- 4. The written rules ----------
  {
    const s = base(
      4,
      "The written rules: allow or deny",
      "Only the four actions that change state have written rules: refund, delete data, cancel plan, and reset password. Each rule gives allow or deny. Deny means nothing runs, and the reply gives the steps that the customer can take alone. " +
        "The Security rule is checked first for every state change: a request that reports that the account or the payment method was used by someone who is not the customer stops the action. " +
        "Deleting data is always denied, because it cannot be undone. At Level 2 the agent applies these rules itself; at Level 3 fixed code checks them."
    );
    const hd = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.blue }, fontFace: FONT, fontSize: 15 } });
    const cell = (t, o = {}) => ({ text: t, options: { fontFace: FONT, fontSize: 15, color: C.text, fill: { color: C.card }, valign: "middle", ...o } });
    const sec = (t, o = {}) => cell(t, { fill: { color: C.tealL }, ...o });
    const rows = [
      [hd("Action"), hd("Written rule"), hd("Outcome")],
      [sec("Any state change", { bold: true }), sec("Security rule, checked first: the account or the payment method was used by someone who is not the customer"), sec("deny; the reply gives the security steps", { bold: true })],
      [cell("Refund, delete, cancel", { bold: true }), cell("Only the owner can ask, and only for the account of the sender"), cell("teammate or another customer: deny")],
      [cell("Reset password", { bold: true }), cell("The link goes only to the e-mail on file"), cell("an address in the text: deny")],
      [cell("Refund", { bold: true }), cell("A credit pack: only while no credits are used. A charge: only after the bank settles it"), cell("used or not settled: deny")],
      [cell("Refund", { bold: true }), cell("Within 14 days (monthly plan) or 30 days (annual plan) of the charge"), cell("outside: deny")],
      [cell("Refund", { bold: true }), cell("Once for each purchase; not above $100; not after 2 refunds in 90 days"), cell("done before or over a limit: deny")],
      [cell("Delete data", { bold: true }), cell("Deleting cannot be undone, so this chat never does it"), cell("always: deny")],
      [cell("Cancel plan", { bold: true }), cell("A plan is cancelled once"), cell("already cancelled: deny; else allow")],
    ];
    s.addTable(rows, {
      x: ML, y: 1.55, w: CW, colW: [2.3, 6.3, CW - 8.6], rowH: [0.4, 0.66, 0.5, 0.45, 0.66, 0.5, 0.5, 0.45, 0.45],
      border: { type: "solid", color: C.border, pt: 1 }, margin: [0.03, 0.12, 0.03, 0.12],
    });
    textBox(
      s,
      [{ text: "Level 2: ", options: { bold: true } }, { text: "the agent applies these rules itself.   " }, { text: "Level 3: ", options: { bold: true } }, { text: "fixed code checks them." }],
      ML, 6.35, CW, 0.5, { size: 17, color: C.navy, valign: "middle" }
    );
  }

  // ---------- 5. Level 3 flow ----------
  {
    const s = base(
      5,
      "Level 3: Jev, fixed code, and an LLM",
      "This is the flow of Level 3 as a state machine with eight states. New saves the message. Triage: Jev answers five questions, each with a confidence, in one call and never reads the account; an injection flag ignores the orders in the text, and a fraud report has the topic Security. " +
        "Gather info is fixed code and reads only the account fields that the action needs. Rules check applies the written rules, the Security rule first: allow goes to Do action, deny goes to the Final message with nothing run. " +
        "The LLM writes the Final message only. A popup then asks if the issue is solved, and the chat resolves. The selected fields cut the Final message input from 617 to 590 tokens."
    );
    const nodes = [
      ["New", "message saved", "LuMail", "fx"],
      ["Triage", "Jev: five answers with confidence", "LuTags", "md"],
      ["Gather info", "only the fields the action needs", "LuDatabase", "fx"],
      ["Rules check", "written rules: allow or deny", "LuScale", "rl"],
      ["Do action", "refund, cancel plan, or reset", "LuZap", "fx"],
      ["Final message", "the LLM writes the reply", "LuMessageSquareText", "md"],
      ["Chat open", "popup: did this solve it?", "LuMessageCircle", "fx"],
      ["Resolved", "chat closed", "LuCircleCheck", "fx"],
    ];
    const kinds = { fx: [C.greyL, C.grey], md: [C.blueL, C.blue], rl: [C.tealL, C.teal] };
    const W = 1.3, gap = (CW - 8 * W) / 7, y0 = 1.85, H = 2.1;
    const X = nodes.map((_, i) => ML + i * (W + gap));
    const cx = X.map((x) => x + W / 2);
    nodes.forEach(([name, sub, icon, k], i) => {
      const [fill, ln] = kinds[k];
      box(s, X[i], y0, W, H, { fill });
      iconCircle(s, icon, cx[i] - 0.28, y0 + 0.15, 0.56, ln);
      textBox(s, name, X[i] + 0.04, y0 + 0.82, W - 0.08, 0.35, { size: 14, bold: true, color: C.navy, align: "center", valign: "middle" });
      textBox(s, sub, X[i] + 0.08, y0 + 1.2, W - 0.16, 0.85, { size: 12, align: "center" });
      if (i < 7) line(s, X[i] + W + 0.02, y0 + H / 2, gap - 0.04, 0, { arrow: true, color: i === 3 ? C.teal : C.grey });
    });
    textBox(s, "allowed", cx[3] + W / 2 + gap / 2 - 0.45, y0 - 0.3, 0.9, 0.25, { size: 12, bold: true, color: C.teal, align: "center", valign: "middle" });
    // Deny path: Rules check goes straight to the Final message; nothing runs.
    const yd = 4.4;
    line(s, cx[3], y0 + H, 0, yd - (y0 + H), { color: C.teal });
    line(s, cx[3], yd, cx[5] - cx[3], 0, { color: C.teal });
    line(s, cx[5], y0 + H, 0, yd - (y0 + H), { color: C.teal, arrow: true, flipV: true });
    textBox(s, "denied: nothing runs", cx[3], yd + 0.05, cx[5] - cx[3], 0.28, { size: 13, bold: true, color: C.teal, align: "center", valign: "middle" });
    // Loop: a customer who writes again in the same chat goes back to New.
    const yl = 5.0;
    line(s, cx[6], y0 + H, 0, yl - (y0 + H));
    line(s, cx[0], yl, cx[6] - cx[0], 0);
    line(s, cx[0], y0 + H, 0, yl - (y0 + H), { arrow: true, flipV: true });
    textBox(s, "same chat: the customer writes again", cx[0], yl + 0.05, cx[6] - cx[0], 0.28, { size: 13, color: C.muted, align: "center", valign: "middle" });
    [["Fixed code", C.greyL, C.grey], ["Model", C.blueL, C.blue], ["Written rules", C.tealL, C.teal]].forEach(([t, f, l], i) => {
      textBox(s, t, ML + i * 1.9, 5.5, 1.7, 0.32, { shape: pres.ShapeType.roundRect, fill: f, line: l, size: 13, margin: [0, 0.1, 0, 0.1], valign: "middle", align: "center" });
    });
    band(s, 6.0, 0.8, "LuDatabase", [{ text: "Jev never reads the account. ", options: { bold: true } }, { text: "Fixed code reads only the fields the action needs: the Final message input falls from 617 to 590 tokens." }]);
  }

  // ---------- 6. Experiment ----------
  {
    const s = base(
      6,
      "Experiment: synthetic data, real model calls",
      "We made all the data ourselves. The test data has 72 FrameForge customers. A seeded generator writes 50 requests in 24 types. A full run makes 300 model calls: 100 for each of three runs. " +
        "We call two hosted models for real: Jev (jev-1.13.0) and deepseek-v4.1-flash through the DeepSeek API. We record every call. An offline replay of the main run gives every number in the paper. " +
        "We ask two questions. What does each level give us, and what does it cost? What changes when Jev replaces the LLM as the classifier?"
    );
    const gap = 0.3, cw = (CW - 3 * gap) / 4, y = 1.55, h = 1.85;
    [
      ["LuUsers", "72", "synthetic customers"],
      ["LuFileText", "50", "requests in 24 types"],
      ["LuCpu", "300", "model calls: 100 for each of three runs"],
      ["LuBot", "2", "hosted models: Jev and an LLM"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, ML + i * (cw + gap), y, cw, h, { icon: ic, big: n, label: l, bigSize: 44, labelY: 1.2 });
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
    textBox(s, "Live calls to two hosted models: Jev (jev-1.13.0) and deepseek-v4.1-flash through the DeepSeek API. An offline replay gives the same numbers.", ML, 6.2, CW, 0.5, { size: 15, color: C.muted, valign: "middle" });
  }

  // ---------- 7. Result 1: classifier ----------
  {
    const s = base(
      7,
      "Result 1: Jev is 18x faster, 11x cheaper",
      "Both classifiers get the same input and the same criteria. One Jev call takes 0.241 s (median). One LLM call takes 4.410 s. Jev is 18 times faster. Jev costs $0.052 per 1,000 requests. The LLM costs $0.587. Jev is 11 times cheaper. " +
        "Jev is behind the LLM on four of five answers: action 86.0% against 92.0%, priority, risk flag, and injection flag. Jev is ahead on the topic: 91.7% against 85.4% of 48 scored requests. " +
        "Jev gives a wrong topic or action in 11 of 50 requests. None is an error at Level 3: the routing rule, the written rules, and the Security rule catch them."
    );
    box(s, ML, 1.65, 7.6, 4.9);
    const labels = ["Action", "Topic", "Priority", "Risk flag", "Injection flag"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Jev", labels, values: [86.0, 91.7, 84.0, 78.0, 94.0] },
        { name: "LLM as classifier", labels, values: [92.0, 85.4, 94.0, 84.0, 100.0] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.8, w: 7.2, h: 4.6, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
        chartColors: [C.l3, "9AA7B5"], dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelFormatCode: "0.0",
        catAxisLabelFontSize: 13, valAxisMaxVal: 112, title: "Percent correct on 50 requests (topic: 48 scored)",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.5, { icon: "LuZap", big: "18x", label: "faster: 0.241 s against 4.410 s, median for one classifier call", color: C.l3 });
    callout(s, x, 3.35, w, 1.5, { icon: "LuDollarSign", big: "11x", label: "cheaper: $0.052 against $0.587 per 1,000 requests", color: C.l3 });
    callout(s, x, 5.05, w, 1.5, { icon: "LuBadgeCheck", big: "11 of 50", label: "wrong topic or action from Jev. None is an error at Level 3.", color: C.teal });
  }

  // ---------- 8. Result 2: the ladder ----------
  {
    const s = base(
      8,
      "Result 2: Level 3 is never worse",
      "All levels use the same 50 requests. At Level 1, we assume staff need 90 s per request. It is an assumed number, not a measurement. Level 2 serves 32 of 50, stops 15, and makes 3 errors. It needs 6.85 s and costs $0.71 per 1,000 requests. " +
        "Level 3 serves 35, stops 15, and makes 0 errors. It needs 3.16 s and costs $0.30. So Level 3 is never worse in any column. It is 2.2 times faster and 2.4 times cheaper. " +
        "The sign test has 3 requests where only Level 2 makes an error. It gives p = 0.25. So we do not show an accuracy gap. Our strong claims are speed, cost, and never worse. No run is harmful at either level."
    );
    box(s, ML, 1.65, 7.6, 3.95);
    const cats = ["Level 2: LLM agent", "Level 3: Jev + LLM + rules"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Served", labels: cats, values: [32, 35] },
        { name: "Stopped by a rule", labels: cats, values: [15, 15] },
        { name: "Errors", labels: cats, values: [3, 0] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.75, w: 7.2, h: 3.75, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 45,
        chartColors: [C.l3, C.teal, C.red], dataLabelPosition: "ctr", dataLabelColor: C.white, dataLabelFontSize: 15, dataLabelFormatCode: "0;-0;;@",
        catAxisOrientation: "maxMin", valAxisMaxVal: 50, title: "Outcome of the 50 requests",
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.25, { icon: "LuTimer", big: "2.2x", label: "faster: 3.16 s against 6.85 s of machine time", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 3.0, w, 1.25, { icon: "LuDollarSign", big: "2.4x", label: "cheaper: $0.30 against $0.71 per 1,000 requests", color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1 });
    callout(s, x, 4.35, w, 1.25, { icon: "LuScale", big: "0 and 3", label: "errors at Level 3 and Level 2. Sign test: p = 0.25, not significant", color: C.teal, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 13 });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "Level 3 is never worse in any column. ", options: { bold: true } }, { text: "Harmful runs: 0 at both levels. Level 1 baseline: 90 s per request (assumed)." }]);
  }

  // ---------- 9. Limits and claims ----------
  {
    const s = base(
      9,
      "Limits and what we claim",
      "Our evidence is small: two hosted models, one synthetic SaaS product, and our own labels. We saw 0 harmful runs in 50 requests. That does not prove the real rate is zero. The 95% upper limit is about 6%. " +
        "Real users write slang and make spelling mistakes. Our test data does not. The 90 s at Level 1 is assumed. We did not simulate the popup or the silence timer. We used one prompt wording and one run for each request. " +
        "We added the Security rule after fraud reports showed a defect on these 50 requests. So the main numbers are not a blind test. The prompt cache covered 22.3% of the input tokens, so the real costs are lower than ours. With p = 0.25, we do not show an accuracy gap."
    );
    const gapC = 0.3, cwL = 6.9, cwR = CW - cwL - gapC;
    {
      const p = { x: ML, y: 1.65, h: 5.1 };
      box(s, p.x, p.y, cwL, p.h);
      iconCircle(s, "LuTriangleAlert", p.x + 0.35, p.y + 0.25, 0.7, C.grey);
      textBox(s, "Limits", p.x + 1.3, p.y + 0.25, cwL - 1.6, 0.7, { size: 24, bold: true, color: C.navy, valign: "middle" });
      s.addText(
        bullets([
          "Synthetic data and our own labels: 50 requests in 24 types",
          "0 harmful runs in 50 is not proof of zero: the 95% upper limit is about 6%",
          "The 90 s at Level 1 is assumed; the popup and the silence timer are not simulated",
          "One prompt wording and one run for each request; two hosted models",
          "The Security rule was added after fraud reports showed a defect on these 50 requests, so the main numbers are not a blind test",
        ]),
        { x: p.x + 0.35, y: p.y + 1.15, w: cwL - 0.7, h: p.h - 1.3, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, paraSpaceAfter: 12, valign: "top" }
      );
    }
    [
      { y: 1.65, h: 2.55, icon: "LuBadgeCheck", bg: C.l3, head: "What we claim", items: ["Level 3 is 2.2x faster, 2.4x cheaper, and never worse", "p = 0.25: no accuracy gap is shown"] },
      { y: 4.4, h: 2.35, icon: "LuFlaskConical", bg: C.teal, head: "Next", items: ["Real tickets and more request types", "Adversarial inputs", "Real customers for the popup and timer"] },
    ].forEach((p) => {
      const x = ML + cwL + gapC;
      box(s, x, p.y, cwR, p.h);
      iconCircle(s, p.icon, x + 0.3, p.y + 0.2, 0.6, p.bg);
      textBox(s, p.head, x + 1.1, p.y + 0.2, cwR - 1.3, 0.6, { size: 22, bold: true, color: C.navy, valign: "middle" });
      s.addText(bullets(p.items), { x: x + 0.3, y: p.y + 0.95, w: cwR - 0.6, h: p.h - 1.05, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, paraSpaceAfter: 8, valign: "top" });
    });
  }

  // ---------- 10. Conclusion ----------
  {
    const s = pres.addSlide();
    s.background = { color: C.blueM };
    s.addText("Conclusion", { x: 0.8, y: 0.7, w: 6.6, h: 0.9, margin: 0, fontFace: FONT, fontSize: 38, bold: true, color: C.white });
    s.addText(
      bullets([
        "Same 50 requests at every level. Level 2: 32 served, 15 stopped, 3 errors. Level 3: 35 served, 15 stopped, 0 errors.",
        "Level 3 is never worse, 2.2x faster, and 2.4x cheaper: 3.16 s and $0.30 against 6.85 s and $0.71. The sign test (p = 0.25) shows no accuracy gap.",
        "A Security rule stops state changes on fraud reports. We added it after we saw a defect on these 50 requests.",
        "Jev is less accurate than the LLM on four of five fields, but the written rules catch its wrong answers, so Level 3 makes 0 errors.",
      ]),
      { x: 0.8, y: 1.75, w: 6.5, h: 4.15, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, paraSpaceAfter: 12, valign: "top" }
    );
    s.addText("Thank you. Questions?", { x: 0.8, y: 6.0, w: 6.6, h: 0.7, margin: 0, fontFace: FONT, fontSize: 30, bold: true, color: C.white });
    s.addImage({ data: shots.closing, x: 7.7, y: 1.3, w: 4.9, h: 4.9 });
    speakerTag(s, 10, true);
    s.addNotes(
      `Speaker: ${PNAM}, about ${SPEAKER[9][1]} s. To finish, we tested three levels of customer support on the same 50 requests. Level 3 serves 35, stops 15, and makes 0 errors. Level 2 serves 32, stops 15, and makes 3. ` +
        "Level 3 is never worse in any column. It is 2.2 times faster and 2.4 times cheaper. The sign test (p = 0.25) does not show an accuracy gap. " +
        "The Security rule stops state changes on fraud reports. We added it after we saw a defect on these 50 requests. So the main numbers are not a blind test. Jev is less accurate than the LLM on four of five answers, but the written rules catch its wrong answers. " +
        "Thank you for listening. Our leader, Tran Thanh Long, will now take your questions."
    );
  }

  const f = await pres.writeFile({ fileName: "deck.pptx" });
  console.log("wrote", f);
})();
