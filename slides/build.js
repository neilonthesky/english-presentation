// Builds slides/deck.pptx: the FrameForge SaaS customer support presentation.
// Run: node build.js   (from the slides/ directory), or ./render.sh to also validate and render.
// Style: light-to-mid blue/grey/teal tones, borderless cards, solid fills, no glow or shadow,
// no dark theme, no yellow/orange. Photographs live in assets/ and are generated for this deck.
// Color code (same meaning as the paper's Figure 1): grey = fixed code, blue = model, teal = support agent.
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const lu = require("react-icons/lu");

const C = {
  bg: "E3EAF2", // soft cool light tone (slide background)
  card: "FFFFFF",
  border: "C5D0DC",
  navy: "1B365D", // titles
  text: "2B3440",
  muted: "56636F",
  blue: "2F5F98", // model, primary
  blueM: "3E6A9A", // mid-tone background for title/closing slides
  blueL: "D6E4F3",
  grey: "5F6B7A", // fixed code
  greyL: "DFE4EA",
  teal: "1F7A7A", // person
  tealL: "D3EBE8",
  white: "FFFFFF",
};
const FONT = "Calibri";
const TITLE = "From Human-Only to LLM-plus-Jev Support: A Four-Step Ladder for SaaS Request Triage";

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

  // Preload every icon once (white on a coloured circle, or coloured for plain use).
  const ICONS = [
    "LuBot", "LuUsers", "LuTags", "LuScale", "LuMessageSquareText", "LuUserCheck", "LuShieldCheck", "LuClipboardCheck",
    "LuHistory", "LuMail", "LuDatabase", "LuRoute", "LuCode", "LuZap", "LuFileText", "LuTarget", "LuCpu", "LuTimer",
    "LuBadgeCheck", "LuHourglass", "LuTriangleAlert", "LuFlaskConical", "LuShieldX",
  ];
  const img = {};
  for (const n of ICONS) img[n] = await iconPng(n);
  const shots = {
    title: await photo("assets/title.jpg", 5.2, 5.2),
    machine: await photo("assets/machine.jpg", 2.4, 2.4),
    human: await photo("assets/human.jpg", 2.4, 2.4),
    closing: await photo("assets/closing.jpg", 4.9, 4.9),
  };

  function base(title, notes) {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addText(title, { x: ML, y: 0.4, w: CW, h: 0.95, margin: 0, fontFace: FONT, fontSize: 36, bold: true, color: C.navy, valign: "middle" });
    s.slideNumber = { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted };
    if (notes) s.addNotes(notes);
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

  // Card with an icon circle, a big figure, and a caption.
  function statCard(s, x, y, w, h, o) {
    box(s, x, y, w, h);
    iconCircle(s, o.icon, x + 0.3, y + 0.28, 0.75, o.bg || C.blue);
    textBox(s, o.big, x + 1.3, y + 0.2, w - 1.5, 0.95, { size: o.bigSize || 36, bold: true, color: o.color || C.blue, valign: "middle" });
    textBox(s, o.label, x + 0.3, y + (o.labelY ?? 1.3), w - 0.6, h - (o.labelY ?? 1.3) - 0.1, { size: 15 });
  }

  const line = (s, x, y, w, h, o = {}) =>
    s.addShape(pres.ShapeType.line, {
      x, y, w, h, flipH: o.flipH,
      line: { color: o.color || C.grey, width: 2, endArrowType: o.arrow ? "triangle" : undefined },
    });

  const bullets = (items, o = {}) =>
    items.map((t, k) => ({ text: t, options: { bullet: o.bullet !== false, breakLine: k < items.length - 1 } }));

  // ---------- 1. Title ----------
  {
    const s = pres.addSlide();
    s.background = { color: C.blueM };
    s.addText(TITLE, {
      x: 0.8, y: 0.9, w: 6.5, h: 2.5, margin: 0, fontFace: FONT, fontSize: 38, bold: true, color: C.white, valign: "top",
    });
    s.addText("FrameForge Support: from a person who reads every request to an AI agent, one part at a time", {
      x: 0.8, y: 3.55, w: 6.5, h: 0.9, margin: 0, fontFace: FONT, fontSize: 19, color: "E3ECF6", valign: "top",
    });
    s.addText(
      [
        { text: "Trần Thành Long · Nguyễn Thanh Nam", options: { breakLine: true } },
        { text: "Vũ Văn Sơn · Vương Quang Quý", options: { breakLine: true } },
        { text: "Nguyễn Phương Nam" },
      ],
      { x: 0.8, y: 4.75, w: 6.3, h: 1.1, margin: 0, fontFace: FONT, fontSize: 18, bold: true, color: C.white, paraSpaceAfter: 2, valign: "top" }
    );
    s.addText("Phenikaa School of Computing\nEnglish Writing and Presentation Skills · October 2026", {
          x: 0.8, y: 6.2, w: 6.3, h: 0.6, margin: 0, fontFace: FONT, fontSize: 16, color: C.white, valign: "top",
        });
    s.addImage({ data: shots.title, x: 7.5, y: 0.95, w: 5.2, h: 5.2 });
    s.addNotes(
      "Good morning. We present four steps that improve customer support, from the old way to a modern AI-agent way. " +
        "Our case is FrameForge, a made-up AI video-generation service: users turn a text prompt or reference images into short video clips and pay with a subscription plus render credits. " +
        "Step 0: a person reads every request. Step 1: an LLM reads the request and acts at once. Step 2: we add written rules and a person for risky requests. Step 3: Jev, a fast classifier, replaces the LLM as classifier and the LLM only writes text. " +
        "Each step adds one part to the step before it. We ran all steps on the same 84 synthetic test requests with real model calls and measured each step."
    );
  }

  // ---------- 2. Where we start ----------
  {
    const s = base(
      "Where we start: two old ways",
      "Support chatbots read customer requests. In step 0, a support agent reads every request: no wrong results are assumed, but the cost and the waiting time grow with every request, and we assume 90 seconds per request. " +
        "In step 1, an LLM reads the request and acts at once. It is fast, but one wrong answer can start a refund or delete workspace data. " +
        "For FrameForge, the risks are a wrong subscription or credit-pack refund and the loss of uploaded assets or generated videos. Our question is how to get from step 0 to a safe automatic step, adding one part at a time."
    );
    const cw = (CW - 0.4) / 2, y = 1.65, h = 3.4;
    const panels = [
      { x: ML, shot: shots.human, head: "Step 0: a person reads every request",
        items: ["No wrong results (assumed)", "Cost and waiting time grow with every request", "An assumed 90 s per request"] },
      { x: ML + cw + 0.4, shot: shots.machine, head: "Step 1: the LLM acts at once",
        items: ["Can give a confident wrong answer", "Prompt injection: text gives orders to the model", "A wrong refund or deleted videos do real harm"] },
    ];
    panels.forEach((p) => {
      box(s, p.x, y, cw, h);
      s.addImage({ data: p.shot, x: p.x + 0.35, y: y + 0.5, w: 2.4, h: 2.4 });
      textBox(s, p.head, p.x + 3.0, y + 0.5, cw - 3.25, 1.0, { size: 21, bold: true, color: C.navy });
      s.addText(bullets(p.items), {
              x: p.x + 3.0, y: y + 1.50, w: cw - 3.2, h: 1.7, margin: 0, fontFace: FONT, fontSize: 14, color: C.text, paraSpaceAfter: 6, valign: "top",
            });
    });
    textBox(
      s,
      [{ text: "Our question: ", options: { bold: true } }, { text: "can we add one part at a time and avoid wrong actions on money and data, without sending every request to a person?" }],
      ML, 5.35, CW, 1.2,
      { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, size: 22, margin: 0.35, valign: "middle" }
    );
  }

  // ---------- 3. The ladder ----------
  {
    const s = base(
      "Four steps, one new part at each step",
      "This is the story of the study. Step 0: a person reads every request. Step 1 adds an LLM that reads the request and acts at once, with no rules and no person. " +
        "Step 2 adds written rules for refunds and data deletion and fixed routing rules, and a person who takes risky or unsure requests; the LLM still classifies. " +
        "Step 3 replaces the LLM as classifier with Jev, a fast model that gives typed answers with probabilities. The LLM then only writes text. A confidence floor sends a request to a person when Jev is less than 70% sure of the queue, the action, or the risk flag. " +
        "Every step is measured on the same 84 test requests."
    );
    const gap = 0.45, cw = (CW - 3 * gap) / 4, y = 1.65, h = 3.95;
    const steps = [
      { n: "Step 0", head: "Human only", icon: "LuUsers", bg: C.teal, body: "A person reads every request. Nothing is automatic." },
      { n: "Step 1", head: "LLM only", icon: "LuBot", bg: C.blue, body: "Adds an LLM. It reads the request and acts at once." },
      { n: "Step 2", head: "LLM + written rules + person", icon: "LuScale", bg: C.grey, body: "Adds written rules. They check every action; a person takes risky requests." },
      { n: "Step 3", head: "LLM + Jev + person", icon: "LuZap", bg: C.blue, body: "Adds Jev as classifier. The LLM only writes text; a floor sends unsure requests to a person." },
    ];
    steps.forEach((p, i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, p.icon, x + 0.3, y + 0.3, 0.8, p.bg);
      textBox(s, p.n, x + 0.3, y + 1.25, cw - 0.6, 0.35, { size: 15, bold: true, color: p.bg });
      textBox(s, p.head, x + 0.3, y + 1.6, cw - 0.6, 0.95, { size: 20, bold: true, color: C.navy });
      textBox(s, p.body, x + 0.3, y + 2.6, cw - 0.6, 1.25, { size: 15 });
      if (i < 3) line(s, x + cw + 0.05, y + h / 2, gap - 0.1, 0, { arrow: true });
    });
    box(s, ML, 5.85, CW, 0.9, { fill: C.teal });
    s.addImage({ data: img.LuTarget, x: ML + 0.3, y: 6.05, w: 0.5, h: 0.5 });
    textBox(
      s,
      [{ text: "One change at a time: ", options: { bold: true } }, { text: "every step runs on the same 84 test requests, so we can see what each part buys and what it costs." }],
      ML + 1.05, 5.85, CW - 1.35, 0.9, { size: 18, color: C.white, valign: "middle" }
    );
  }

  // ---------- 4. Step 2: written rules ----------
  {
    const s = base(
      "Step 2 adds written rules for the two risky actions",
      "Step 2 of the ladder adds fixed written rules. Only refunds and deleting data have written rules. For FrameForge, deleting data means the uploaded assets and generated videos of a workspace. Each rule returns pass, deny, or review. " +
        "Deny means the action cannot be done and nothing runs. Review means a person takes over (path C). In step 2 the LLM still classifies; the rules and fixed routing rules check every action, and a person reads the risky requests."
    );
    const hd = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.blue }, fontFace: FONT, fontSize: 15 } });
    const cell = (t, o = {}) => ({ text: t, options: { fontFace: FONT, fontSize: 14, color: C.text, fill: { color: C.card }, valign: "middle", ...o } });
    const rows = [
      [hd("Action"), hd("Written rule"), hd("Outcome")],
      [cell("Both", { bold: true }), cell("Only the account owner can ask"), cell("teammate: deny")],
      [cell("Both", { bold: true }), cell("Only the account of the sender"), cell("another customer named: deny")],
      [cell("Refund", { bold: true }), cell("Within 14 days (monthly plan) or 30 days (annual plan) of the charge"), cell("inside: pass · outside, unused: review · outside, used: deny")],
      [cell("Refund", { bold: true }), cell("Credit pack only while none is used; a renewal not charged yet can be cancelled"), cell("unused or not charged: pass · used or not settled: deny")],
      [cell("Refund", { bold: true }), cell("A purchase is refunded once; over $100, or 2+ refunds in 90 days"), cell("done before: deny · over limit: review")],
      [cell("Delete data", { bold: true }), cell("Deleting cannot be undone; done once"), cell("done before: deny · else review")],
    ];
    s.addTable(rows, {
      x: ML, y: 1.65, w: CW, colW: [1.7, 5.6, CW - 7.3], rowH: [0.42, 0.5, 0.5, 0.65, 0.65, 0.65, 0.5],
      border: { type: "solid", color: C.border, pt: 1 }, margin: [0.04, 0.12, 0.04, 0.12],
    });
    textBox(s, "The written rules never use the classifier's confidence. Only the routing floor, added in step 3, does. They are the rules of FrameForge, a made-up AI video SaaS.", ML, 6.45, CW, 0.4, { size: 14, color: C.muted, valign: "middle" });
  }

  // ---------- 5. Step 3: Jev classifies, the LLM writes text ----------
  {
    const s = base(
      "Step 3: Jev decides labels; the LLM only writes text",
      "Step 3 of the ladder replaces the LLM as classifier with Jev, a fast classifier that gives five typed answers with probabilities. The workflow is a state machine of seven flow steps and a handoff, here for the FrameForge customer support system. Flow step 3 is the routing: " +
        "written rules and fixed routing rules decide the verdict, the path, and the action. One routing rule is the confidence floor: if Jev is less than 70% sure of the queue, the action, or the risk flag, a person reads the request. " +
        "The LLM, Gemini 3.8 Flash, only writes answers, replies, and summaries. " +
        "A person takes over the risky cases, the cases where Jev is not sure, and the cases that the user says are not solved."
    );
    const gap = 0.35, cw = (CW - 2 * gap) / 3, y = 1.65, h = 4.05;
    const cols = [
      { head: "Classifier (Jev)", tag: "Replaces the LLM as classifier", icon: "LuTags", bg: C.blue,
        lines: ["Five typed answers in one call, each with a probability", "Queue, action, priority, risk flag, injection flag"] },
      { head: "Written rules and code", tag: "Decide everything else", icon: "LuScale", bg: C.grey,
        lines: ["Verdict: allow, deny, or review", "Routing: path A, B, or C; C if Jev is under 70% sure", "The action runs only if the rules allow it"] },
      { head: "LLM", tag: "Only writes text", icon: "LuMessageSquareText", bg: C.blue,
        lines: ["Answers from the help articles", "Writes the reply after the action", "Writes a summary for a person"] },
    ];
    cols.forEach((c, i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, c.icon, x + 0.3, y + 0.3, 0.9, c.bg);
      textBox(s, c.head, x + 0.3, y + 1.4, cw - 0.6, 0.5, { size: 24, bold: true, color: C.navy });
      textBox(s, c.tag, x + 0.3, y + 1.9, cw - 0.6, 0.35, { size: 15, color: C.muted });
      s.addText(bullets(c.lines), {
        x: x + 0.3, y: y + 2.4, w: cw - 0.6, h: 1.4, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 6, valign: "top",
      });
    });
    box(s, ML, 5.85, CW, 0.9, { fill: C.teal });
    s.addImage({ data: img.LuUserCheck, x: ML + 0.3, y: 6.05, w: 0.5, h: 0.5 });
    textBox(
      s,
      [{ text: "Support agent: ", options: { bold: true } }, { text: "on path C, or when the user says not solved, the LLM writes a summary and a support agent takes over. The LLM does not decide." }],
      ML + 1.05, 5.85, CW - 1.35, 0.9, { size: 18, color: C.white, valign: "middle" }
    );
  }

  // ---------- 4. Flow ----------
  {
    const s = base(
      "The flow of one request: seven flow steps and a handoff",
      "This is the flow of step 3 of the ladder. Flow step 1: the user writes a request. Flow step 2: the system saves it and looks up the account (plan, render credits, purchase). Flow step 3 is the routing: Jev gives five answers, " +
        "then the written rules and the routing rules pick path A, B, or C. A request goes to path C when the injection flag is on, the priority is Critical, a written rule asks for a person, " +
        "or Jev is less than 70% sure of the queue, the action, or the risk flag. Path A (flow step 4A) is fixed code with no model, path B (flow step 4B) is an LLM answer, " +
        "and path C goes straight to the handoff, step H, and nothing runs. Flow step 5: the system does the action, only if the written rules allow it. " +
        "Flow step 6: the user gets the result and says if it solved the request. Yes: flow step 7. No: step H, where the LLM writes a summary for a person and the bot says a person will join. " +
        "Flow step 7 writes a log. In step 2 of the ladder the flow is the same, and an LLM classifies in flow step 3."
    );
    const kinds = { fx: [C.greyL, C.grey], md: [C.blueL, C.blue], pr: [C.tealL, C.teal], us: [C.card, C.grey] };
    const node = (k, x, y, w, h, num, text, icon) => {
      const [fill, ln] = kinds[k];
      box(s, x, y, w, h, { fill, line: ln });
      iconCircle(s, icon, x + 0.12, y + h / 2 - 0.26, 0.52, ln);
      textBox(s, [{ text: num + "  ", options: { bold: true } }, { text }], x + 0.75, y, w - 0.85, h, { size: 14, valign: "middle" });
    };
    const tag = (t, x, y, w, color = C.muted, align = "left") => textBox(s, t, x, y, w, 0.28, { size: 12, bold: true, color, valign: "middle", align });
    const W = 2.7, H = 1.0;
    const X = [0.6, 3.75, 6.9, 10.05];
    const cx = X.map((x) => x + W / 2);
    const y1 = 1.65;
    node("us", X[0], y1, W, H, "1", "User writes a request", "LuMail");
    node("fx", X[1], y1, W, H, "2", "System saves it and looks up the account", "LuDatabase");
    node("md", X[2], y1, W, H, "3", "Routing: Jev classifies, fixed rules choose path A, B, or C", "LuRoute");
    for (let i = 0; i < 2; i++) line(s, X[i] + W, y1 + H / 2, X[i + 1] - X[i] - W, 0, { arrow: true });
    // Paths A and B leave step 3 on a bus; path C goes right, then straight down to the handoff.
    const busY = 2.9, y2 = 3.25, H2 = 1.15;
    line(s, cx[2], y1 + H, 0, busY - (y1 + H));
    line(s, cx[1], busY, cx[2] - cx[1], 0);
    line(s, cx[1], busY, 0, y2 - busY, { arrow: true });
    line(s, cx[2], busY, 0, y2 - busY, { arrow: true });
    node("fx", X[1], y2, W, H2, "4A", "Path A: fixed code writes a plan (no model)", "LuCode");
    node("md", X[2], y2, W, H2, "4B", "Path B: LLM answers from the help articles", "LuBot");
    tag("A: action", cx[1] + 0.08, busY + 0.03, 1.2);
    tag("B: question", cx[2] + 0.08, busY + 0.03, 1.3);
    const y3 = 4.85, H3 = 1.15, bus2 = 4.65;
    line(s, cx[1], y2 + H2, 0, y3 - (y2 + H2), { arrow: true });
    line(s, cx[2], y2 + H2, 0, bus2 - (y2 + H2));
    line(s, cx[1], bus2, cx[2] - cx[1], 0);
    node("fx", X[1], y3, W, H3, "5", "System does the action only if the written rules allow it", "LuZap");
    node("md", X[2], y3, W, H3, "6", "User gets the result and says if it solved the request", "LuMessageSquareText");
    node("pr", X[3], y3, W, H3, "H", "Handoff: LLM summarizes the chat; a support agent takes over", "LuUserCheck");
    line(s, X[1] + W, y3 + H3 / 2, X[2] - (X[1] + W), 0, { arrow: true });
    line(s, X[2] + W, y3 + H3 / 2, X[3] - (X[2] + W), 0, { arrow: true, color: C.teal });
    tag("No", X[2] + W, y3 + H3 / 2 - 0.32, X[3] - (X[2] + W), C.teal, "center");
    // Path C: from step 3 to the right, then straight down to the handoff; nothing runs.
    line(s, X[2] + W, y1 + H / 2, cx[3] - (X[2] + W), 0, { color: C.teal });
    line(s, cx[3], y1 + H / 2, 0, y3 - (y1 + H / 2), { arrow: true, color: C.teal });
    textBox(s, "C: support agent\nNothing runs", cx[3] + 0.08, 3.15, CW + ML - (cx[3] + 0.08), 0.7, { size: 12, bold: true, color: C.teal, valign: "middle", margin: 0 });
    textBox(s, [{ text: "Path C if:", options: { bold: true, breakLine: true } }, { text: "injection or Critical", options: { breakLine: true } }, { text: "a rule asks", options: { breakLine: true } }, { text: "Jev is under 70% sure" }], X[2] + W + 0.12, 2.3, cx[3] - (X[2] + W) - 0.2, 1.0, { size: 12, color: C.teal, margin: 0, align: "right" });
    const y4 = 6.3, H4 = 0.6;
    line(s, cx[2], y3 + H3, 0, y4 - (y3 + H3), { arrow: true });
    tag("Yes", cx[2] + 0.1, y3 + H3 + 0.01, 0.6);
    node("fx", X[2], y4, W, H4, "7", "System writes a log", "LuHistory");
    line(s, cx[3], y3 + H3, 0, y4 + H4 / 2 - (y3 + H3), { color: C.teal });
    line(s, X[2] + W, y4 + H4 / 2, cx[3] - (X[2] + W), 0, { arrow: true, flipH: true, color: C.teal });
    [["Fixed code", C.greyL, C.grey], ["Model", C.blueL, C.blue], ["Support agent", C.tealL, C.teal]].forEach(([t, f, l], i) => {
      textBox(s, t, X[0], y3 + 0.1 + i * 0.4, 1.4, 0.3, { shape: pres.ShapeType.roundRect, fill: f, line: l, size: 12, margin: [0, 0.1, 0, 0.1], valign: "middle" });
    });
  }

  // ---------- 6. Step 5: the system does the action only if the rules allow it ----------
  {
    const s = base(
      "Step 5: the system does only allowed actions",
      "Step 5 sits between the models and the action. The verdict of the written rules decides, whatever the models said. " +
        "Allow: the system does the action and writes the ledger. Deny: nothing runs and the customer is told why. " +
        "Review: the request never reaches step 5, because a written rule that asks for a person sends it to path C and step H."
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y = 1.65, h = 3.2;
    [
      ["LuBadgeCheck", "Allow", "The system does the action and writes the ledger", C.blue],
      ["LuShieldX", "Deny", "Nothing runs; the reply tells the customer why", C.blue],
      ["LuUserCheck", "Review", "A support agent takes over at step H; nothing runs", C.teal],
    ].forEach(([ic, head, body, bg], i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y, cw, h);
      iconCircle(s, ic, x + 0.3, y + 0.3, 0.9, bg);
      textBox(s, head, x + 0.25, y + 1.4, cw - 0.5, 0.45, { size: 22, bold: true, color: C.navy });
      textBox(s, body, x + 0.25, y + 1.95, cw - 0.5, 1.1, { size: 16 });
    });
    box(s, ML, 5.2, CW, 1.1, { fill: C.teal });
    s.addImage({ data: img.LuShieldCheck, x: ML + 0.3, y: 5.5, w: 0.5, h: 0.5 });
    textBox(
      s,
      [
        { text: "A deny rule means nothing runs, whatever the models said. ", options: { bold: true } },
        { text: "The ledger stops the same action from running twice." },
      ],
      ML + 1.05, 5.2, CW - 1.35, 1.1, { size: 18, color: C.white, valign: "middle" }
    );
  }

  // ---------- 7. Experiment ----------
  {
    const s = base(
      "Experiment: synthetic data, real model calls",
      "Everything is made by us. The world has 72 customers of FrameForge, a made-up AI video-generation product, 21 request types, and 84 test requests. " +
        "We call two hosted models for real. Both classifiers get the same short label definitions and the help articles that match the request. We wrote the definitions and chose the 0.70 floor on the dev split, then ran the test split once with the final setup. " +
        "Dev and test have the same 21 request types and differ only in wording. A request that goes to a person costs an assumed 90 seconds; no real person took part. So the study cannot tell how real staff would perform."
    );
    const gap = 0.3, cw = (CW - 3 * gap) / 4, y = 1.65, h = 1.95;
    [
      ["LuUsers", "72", "synthetic customers"],
      ["LuFileText", "21", "request types"],
      ["LuTarget", "84", "test requests"],
      ["LuCpu", "2", "hosted models: Jev and an LLM"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, ML + i * (cw + gap), y, cw, h, { icon: ic, big: n, label: l, bigSize: 44 });
    });
    [
      ["RQ1", "Same system, only the classifier changes: Jev or an LLM. How do silent errors, requests sent to a person, and machine time compare? An ablation removes the 70% floor."],
      ["RQ2", "Is a probability of 0.90 right about 90 times in 100? The floor uses the probability that Jev gives to its own answer."],
      ["RQ3", "If the classifier is wrong or an LLM reply lies, can the system still run an action that the rules forbid?"],
    ].forEach(([tag, t], i) => {
      const yy = 3.95 + i * 0.95;
      box(s, ML, yy, CW, 0.8);
      textBox(s, tag, ML + 0.25, yy + 0.15, 0.9, 0.5, { shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, bold: true, size: 16, margin: 0, valign: "middle", align: "center" });
      textBox(s, t, ML + 1.4, yy, CW - 1.65, 0.8, { size: 16, valign: "middle" });
    });
  }

  // ---------- 8. Results: classifier ----------
  {
    const s = base(
      "Result 1: labels are close; Jev is 25 times faster",
      "Both classifiers get the same label definitions and help articles. Compared alone, they tie on queue (97.5% each, on the 80 requests that have a queue) and on the risk flag (92.9% each). The LLM is a little better on action (92.9% against 91.7%) and Jev on the injection flag (100% against 98.8%). " +
        "Jev is much better on priority (84.5% against 61.9%). Priority changes the path only when it is Critical, and both systems send all eight critical requests to a person. " +
        "The LLM gave one answer that the system could not read: R0044, a missing injection flag. The system fails closed, and the request goes to a person. Jev gave no invalid answer. " +
        "A wrong queue or action is the error that matters most: it happens in 9 of 84 requests with Jev and 7 of 84 with the LLM. " +
        "At the median, one Jev call takes 0.25 seconds and one LLM call 6.13 seconds, which is about 25 times faster. " +
        "RQ2: Jev gives a probability for each answer, and the floor of step 3 uses it. In the 0.9 to 1.0 bin, which holds 65 of 80 queue answers, the mean probability is 0.992 and the answer is right 98.5% of the time. " +
        "The calibration error of that probability is 0.052 for queue, 0.053 for action, 0.088 for priority, 0.099 for risk, and 0.087 for injection. " +
        "The confidence that Jev reports next to its answer gives 0.063, 0.065, 0.082, 0.099, and 0.087. So the probability is a little better on queue and action, a little worse on priority, and equal on risk and injection. We tested no significance."
    );
    box(s, ML, 1.65, 8.0, 4.9);
    const labels = ["Queue", "Action", "Priority", "Risk flag", "Injection flag"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Jev", labels, values: [97.5, 91.7, 84.5, 92.9, 100.0] },
        { name: "LLM", labels, values: [97.5, 92.9, 61.9, 92.9, 98.8] },
      ],
      {
        x: ML + 0.2, y: 1.8, w: 7.6, h: 4.6, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
        chartColors: [C.blue, "9AA7B5"], showLegend: true, legendPos: "b", legendFontSize: 14, legendFontFace: FONT, legendColor: C.text,
        showTitle: true, title: "Percent correct on the 84 test requests (queue: 80)", titleFontSize: 15, titleFontFace: FONT, titleColor: C.text,
        showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelFontFace: FONT, dataLabelColor: C.text, dataLabelFormatCode: "0.0",
        catAxisLabelColor: C.text, catAxisLabelFontSize: 13, catAxisLabelFontFace: FONT,
        valAxisLabelColor: C.muted, valAxisLabelFontSize: 12, valAxisMinVal: 0, valAxisMaxVal: 110, valAxisMajorUnit: 20, valAxisHidden: true,
        valGridLine: { style: "none" }, catGridLine: { style: "none" },
      }
    );
    const x = ML + 8.35, w = CW - 8.35;
    [
      ["LuZap", "0.25 s", "Jev, median time per classifier call", C.blue],
      ["LuTimer", "6.13 s", "LLM, median time per classifier call", C.grey],
      ["LuBadgeCheck", "0 and 1", "invalid answers (Jev, LLM)", C.blue],
    ].forEach(([ic, n, l, col], i) => {
      statCard(s, x, 1.65 + i * 1.7, w, 1.5, { icon: ic, big: n, label: l, color: col, bg: col, bigSize: 34, labelY: 1.08 });
    });
  }

  // ---------- 9. Results: three methods ----------
  {
    const s = base(
      "Result 2: Jev made no silent error; the sample is small",
      "RQ1. In this test run the Jev system makes 0 silent errors in 84 requests and the LLM-classifier system 2, and neither has a harmful error. " +
        "The two LLM errors are R0022, a render question that the system put in a queue, and R0164, a mixed billing and render request that the system answered with text, where a person should read it. " +
        "The paired sign test counts the requests where only one system errs: Jev alone in 0, the LLM system alone in 2, so p = 0.5. There is no significant difference. " +
        "The four requests of one type differ only in wording, so the sample is closer to 21 cases than to 84, and 0 errors is not proof of zero. " +
        "The floor matters. Without it, Jev makes 2 silent errors, R0162 and R0164. Both are mixed billing and render requests, and the confidence of the risk flag is 0.52 and 0.56. The floor sends them to a person. " +
        "The cost is the person rate: 41.7% with the floor and 35.7% without it, which is 6.0 points more. The floor sent 10 requests to a person; 3 of them were not needed. " +
        "The LLM baseline reports no confidence, so a floor never applies to it. That is a fairness limit. " +
        "Jev needs 2.65 seconds of machine time per request and the LLM system 10.63 seconds, which is 7.98 seconds less. Jev sends 4 more requests in 84 to a person (35 against 31). At the assumed 90 seconds per person, that adds 4.29 seconds. " +
        "The mean total time is 40.15 against 43.84 seconds, 3.70 seconds less. Both are under the 90 seconds of sending every request to a person. The final result is correct in 84 of 84 requests for Jev and 82 of 84 for the LLM system. This time is not tested for significance."
    );
    const hd = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.blue }, fontFace: FONT, fontSize: 15, align: "center", valign: "middle" } });
    const hdl = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.blue }, fontFace: FONT, fontSize: 15, valign: "middle" } });
    const c = (t, o = {}) => ({ text: t, options: { fontFace: FONT, fontSize: 16, color: C.text, fill: { color: C.card }, valign: "middle", align: "center", ...o } });
    const cl = (t) => c(t, { align: "left", bold: true });
    s.addTable(
      [
        [hdl("Method"), hd("Sent to a person"), hd("Silent errors"), hd("Harmful"), hd("Machine time"), hd("Total time")],
        [cl("All to a person"), c("100%"), c("0"), c("0"), c("0 s"), c("90.0 s")],
        [cl("LLM-classifier system"), c("36.9%"), c("2"), c("0"), c("10.63 s"), c("43.84 s")],
        [cl("Jev system (floor 0.70)"), c("41.7%"), c("0"), c("0"), c("2.65 s"), c("40.15 s")],
        [cl("Jev without the floor"), c("35.7%"), c("2"), c("0"), c("2.86 s"), c("35.00 s")],
      ],
      { x: ML, y: 1.6, w: CW, colW: [3.6, 1.9, 1.7, 1.3, 1.8, CW - 10.3], rowH: [0.5, 0.48, 0.48, 0.48, 0.48], border: { type: "solid", color: C.border, pt: 1 }, margin: [0.03, 0.12, 0.03, 0.12] }
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3;
    [
      ["LuScale", "0 vs 2", "silent errors (Jev, LLM); none harmful; sign test p = 0.5"],
      ["LuTimer", "2.65 s", "machine time per request with Jev, against 10.63 s for the LLM system"],
      ["LuHourglass", "+6.0 pts", "person rate from the floor (3 reads not needed); 2 Jev errors removed"],
    ].forEach(([ic, n, l], i) => {
      statCard(s, ML + i * (cw + gap), 4.3, cw, 1.95, { icon: ic, big: n, label: l, bigSize: 36 });
    });
    textBox(
      s,
      "LLM errors: R0022 (a render question put in a queue), R0164 (a mixed billing and render request answered by text). Jev without the floor: R0162, R0164. Only about 21 distinct cases. The LLM reports no confidence, so a floor cannot apply to it.",
      ML, 6.4, CW - 0.8, 0.55, { size: 14, color: C.muted, valign: "middle" }
    );
  }

  // ---------- 10. Results: safety ----------
  {
    const s = base(
      "Result 3: forged requests never ran an unsafe action",
      "RQ3. We forged the classifier answers by hand, so no model runs and only the written rules stand in the way. This part does not depend on which classifier is used, and its numbers did not change. " +
        "In six groups of requests where nothing may run, 365 of 365 stay safe: 264 are blocked at step 5, 101 are sent to a person at path C, and none runs an unsafe action. " +
        "We also replaced the reply with a lie in 72 requests: the action and the ledger do not change, because the reply is written after the action. " +
        "Without the rules and the flags, the final result would be wrong in 52 of 84 requests for Jev and 53 of 84 for the LLM. " +
        "The rules stop the unsafe actions they cover. They do not stop a valid action that the classifier chose wrongly. For that case, the flags and the confidence floor send the request to a person. " +
        "This shows what the design does on this data, not what it would do in real traffic."
    );
    const hd = (t, al) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.blue }, fontFace: FONT, fontSize: 14, align: al || "left", valign: "middle" } });
    const c = (t, al) => ({ text: t, options: { fontFace: FONT, fontSize: 13, color: C.text, fill: { color: C.card }, valign: "middle", align: al || "left" } });
    const data = [
      ["A teammate asks for a refund or a deletion", 144, 144, 0],
      ["The text names another customer", 72, 72, 0],
      ["A charge that the bank has not settled", 5, 5, 0],
      ["The same state change sent twice", 25, 25, 0],
      ["A refund that the written rules deny", 18, 18, 0],
      ["A rule asks for a person: path C, nothing runs", 101, 0, 101],
      ["A lying reply (separate text check)", 72, 0, 0],
    ];
    s.addTable(
      [[hd("Forged case"), hd("Cases", "center"), hd("Unsafe", "center"), hd("Blocked at step 5", "center"), hd("To a person", "center")],
        ...data.map(([t, n, b, p]) => [c(t), c(String(n), "center"), c("0", "center"), c(String(b), "center"), c(String(p), "center")])],
      { x: ML, y: 1.65, w: 7.6, colW: [3.7, 1.0, 0.8, 1.1, 1.0], rowH: [0.7, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], border: { type: "solid", color: C.border, pt: 1 }, margin: [0.03, 0.1, 0.03, 0.1] }
    );
    const x = ML + 7.95, w = CW - 7.95;
    statCard(s, x, 1.65, w, 2.3, { icon: "LuShieldCheck", big: "365 / 365", label: "365 action cases: 264 blocked, 101 to a support agent. The 72 reply-text cases are separate.", bigSize: 34 });
    statCard(s, x, 4.15, w, 2.3, { icon: "LuTriangleAlert", big: "52 and 53", label: "of 84 final results would be wrong without the rules and the flags (Jev, LLM)", bigSize: 34, color: C.navy, bg: C.grey });
  }

  // ---------- 11. Limits and future work ----------
  {
    const s = base(
      "Limits and future work",
      "The evidence is small-sample, and we list the limits. " +
        "(a) 0 silent errors in 84 requests is not proof of zero. The four requests of one type differ only in wording, so the sample is closer to 21 cases. A 95% upper bound by the rule of three is 14% for 21 cases (3 of 21) and 3.6% for 84 requests (3 of 84). " +
        "(b) We chose the label definitions, the help articles in the prompt, and the 0.70 floor on the dev split, and we saw an earlier test run with a first version of the definitions. So the test split is not a pure hold-out. Dev and test share the same 21 request types and differ in wording only. " +
        "(c) Two dev templates were reworded after the dev run, because both classifiers read them the other way from the gold label: an injection template that gave no order, and a refund question that asked for a refund. " +
        "(d) The floor is a trade: 3 person reads that were not needed, and 6.0 points more person rate, for 2 fewer silent errors. The LLM baseline reports no confidence, so it cannot use a floor. " +
        "(e) Jev is faster: 2.65 seconds against 10.63 seconds of machine time per request. " +
        "Other limits: synthetic data and our own labels, an assumed 90 seconds per person, two hosted models, and written rules for only two actions that do not read replies."
    );
    const gapC = 0.3, cwL = 6.9, cwR = CW - cwL - gapC;
    const rowsR = [
      { y: 1.65, h: 2.85, icon: "LuScale", bg: C.grey, head: "Trade-offs", items: [
        "(d) The floor: +6.0 points of person rate and 3 reads not needed, for 2 fewer silent errors; the LLM has no confidence, so no floor",
        "(e) Jev is faster: 2.65 s against 10.63 s of machine time"] },
      { y: 4.7, h: 2.05, icon: "LuFlaskConical", bg: C.blue, head: "Future work", items: [
        "Real requests, new types, independent labels", "A real-staff study; several runs; other LLMs"] },
    ];
    {
      const p = { x: ML, y: 1.65, h: 5.1, icon: "LuTriangleAlert", bg: C.grey, head: "Limits", items: [
        "(a) 0 silent errors in 84 requests is not proof of zero: about 21 distinct cases; 95% upper bound 14% (3 of 21) or 3.6% (3 of 84)",
        "(b) Definitions, help articles, and the 0.70 floor were set on the dev split; an earlier test run was seen, so the test is not a pure hold-out",
        "(c) Two dev templates were reworded after the dev run, because both classifiers read them the other way from the gold label",
        "Synthetic data, our own labels, an assumed 90 s per person, two hosted models"] };
      box(s, p.x, p.y, cwL, p.h);
      iconCircle(s, p.icon, p.x + 0.35, p.y + 0.25, 0.7, p.bg);
      textBox(s, p.head, p.x + 1.3, p.y + 0.25, cwL - 1.6, 0.7, { size: 24, bold: true, color: C.navy, valign: "middle" });
      s.addText(bullets(p.items), { x: p.x + 0.35, y: p.y + 1.15, w: cwL - 0.7, h: p.h - 1.3, margin: 0, fontFace: FONT, fontSize: 17, color: C.text, paraSpaceAfter: 10, valign: "top" });
    }
    rowsR.forEach((p) => {
      const x = ML + cwL + gapC;
      box(s, x, p.y, cwR, p.h);
      iconCircle(s, p.icon, x + 0.3, p.y + 0.2, 0.6, p.bg);
      textBox(s, p.head, x + 1.1, p.y + 0.2, cwR - 1.3, 0.6, { size: 22, bold: true, color: C.navy, valign: "middle" });
      s.addText(bullets(p.items), { x: x + 0.3, y: p.y + 0.95, w: cwR - 0.6, h: p.h - 1.05, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 8, valign: "top" });
    });
  }

  // ---------- 12. Conclusion ----------
  {
    const s = pres.addSlide();
    s.background = { color: C.blueM };
    s.addText("Conclusion", { x: 0.8, y: 0.7, w: 6.6, h: 0.9, margin: 0, fontFace: FONT, fontSize: 38, bold: true, color: C.white });
    s.addText(
      bullets([
        "A model decides labels; written rules and a 70% confidence floor decide the verdict, the path, and the action. The LLM only writes text.",
        "Silent errors: Jev 0, LLM classifier 2, none harmful (sign test p = 0.5, no significant difference). About 21 distinct cases, so 0 is not proof of zero.",
        "The floor removed 2 Jev errors and cost 6.0 points of person rate (3 reads not needed). Jev was faster: 2.65 s against 10.63 s.",
        "The 365 forged action cases ran nothing. Settings were tuned on dev and an earlier test run was seen; real data remain open.",
      ]),
      { x: 0.8, y: 1.8, w: 6.5, h: 4.0, margin: 0, fontFace: FONT, fontSize: 17, color: C.white, paraSpaceAfter: 12, valign: "top" }
    );
    s.addText("Thank you. Questions?", { x: 0.8, y: 6.0, w: 6.6, h: 0.7, margin: 0, fontFace: FONT, fontSize: 30, bold: true, color: C.white });
    s.addImage({ data: shots.closing, x: 7.7, y: 1.3, w: 4.9, h: 4.9 });
    s.addNotes(
      "To conclude: a model decides labels, written rules and a confidence floor decide everything that matters, and the LLM only writes text. " +
        "On this small synthetic study the Jev system made no silent error and the LLM classifier made 2, none harmful. A paired sign test gives p = 0.5, so there is no significant difference. The sample is closer to 21 cases than to 84, so 0 errors is not proof of zero. " +
        "Without the floor, Jev made 2 silent errors; the floor removed them and cost 6.0 points of person rate, with 3 reads that were not needed. The LLM baseline reports no confidence, so it cannot use a floor. " +
        "We set the definitions, the help articles, and the floor on the dev split and saw an earlier test run, so the test is not a pure hold-out. Jev was faster: 2.65 seconds of machine time per request against 10.63. The 365 action cases ran nothing, and the 72 reply-text cases changed no action or ledger. " +
        "The saving with real staff and real data remains open. Thank you. We are happy to take questions."
    );
  }

  const f = await pres.writeFile({ fileName: "deck.pptx" });
  console.log("wrote", f);
})();
