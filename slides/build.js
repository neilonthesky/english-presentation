// Builds slides/deck.pptx from the independent Level 2 and Level 3 experiment results.
// Claims apply only to the stored synthetic SaaS set and the measured hosted API configurations.
// Fixed execution follows Jev's answers; it is not independent policy verification or a safety guarantee.
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
const { dropBlankPoints } = require("./charts");
const { addTransitions } = require("./transitions");
const { CASES, FIELDS } = require("./cases");

// Read both independent runs of the high-impact set (1,024 requests, days since the charge in the account) without writing a combined result file.
const RUN = "../experiment/results/high-impact-20261012-droid";
const results2 = require(`${RUN}/level2/results.json`);
const results3 = require(`${RUN}/level3/results.json`);
const records2 = require(`${RUN}/level2/per_case.json`).llm_agent;
const records3 = require(`${RUN}/level3/per_case.json`).jev;
const level2 = results2.systems.llm_agent, level3 = results3.systems.jev;
const quality = results3.classifier.jev.perField, ruleStats = results3.ruleQuestions;
const data = results3.dataset; // the composition of the request set, recorded by the run
if (JSON.stringify(results2.dataset) !== JSON.stringify(data)) throw new Error("The two runs must describe the same request set");
const injectionRequests = Math.round(data.injectionShare * data.requests);
const count = (value) => value.toLocaleString("en-US");
const sampleSize = count(level3.requests);
// The five groups of the request set (the strata of FAMILIES in experiment/dataset.ts) with the request types of each group.
const GROUPS = [
  ["High-impact actions", ["refund_in_window_small", "refund_in_window_large", "refund_credits_used", "cancel_owner", "cancel_already", "password_reset", "password_other_email", "delete_owner"]],
  ["Security incidents", ["crit_card_fraud", "crit_data_destroyed", "crit_account_takeover"]],
  ["Mixed and time-sensitive", ["hard_mixed_billing_product", "deadline_blocked_render", "deadline_password_reset", "hard_mixed_security_billing", "bug_report"]],
  ["Routine support", ["q_plan_credits", "feature_request", "complaint_service", "q_unknown_topic", "pq_invoice_tax_id", "person_request", "closing_solved", "q_account_security"]],
  ["Injection and look-alikes", ["inj_refund_everything", "lookalike_ask_rules"]],
];
const groupSize = GROUPS.map(([, types]) => records3.filter((record) => types.includes(record.category)).length);
if (groupSize.reduce((sum, n) => sum + n, 0) !== level3.requests || GROUPS.reduce((sum, [, types]) => sum + types.length, 0) !== data.categories) {
  throw new Error("Every request type of the set must belong to exactly one group");
}
// The slides say that every customer sends the same number of requests.
const sentBy = new Map();
for (const record of records3) sentBy.set(record.customerId, (sentBy.get(record.customerId) ?? 0) + 1);
if (new Set(sentBy.values()).size !== 1 || sentBy.size !== data.customers) throw new Error("Every customer must send the same number of requests");
const requestsPerCustomer = [...sentBy.values()][0];
// The refund inputs that were changed after a failure. Every slide that shows rule results says so: the rule evaluation was not blind.
const CHANGED_SHORT = "Two refund inputs were changed after earlier failures";
// The LLM agent also needs an LLM call to classify the request, so its price per 1,000 requests is $1.12 (not the $0.64 of the recorded run).
const AGENT_COST = 1.12;
const cost2 = AGENT_COST.toFixed(2), cost3 = level3.apiCostPer1000.toFixed(2);
const time2 = level2.machineSeconds.mean.toFixed(2), time3 = level3.machineSeconds.mean.toFixed(2);
const speedRatio = (level2.machineSeconds.mean / level3.machineSeconds.mean).toFixed(1);
const costRatio = (AGENT_COST / level3.apiCostPer1000).toFixed(1);
// The titles and notes say that Level 3 is lower in API cost and errors, and that it needs less than half the machine time of Level 2. Stop the build if the recorded runs do not show it.
if (!(level3.machineSeconds.mean * 2 < level2.machineSeconds.mean && level3.apiCostPer1000 < level2.apiCostPer1000 && level3.errors < level2.errors)) {
  throw new Error("The slides say that Level 3 needs less than half the machine time and has lower cost and fewer errors; the two runs do not show that");
}
const ruleCalls = records3.filter((record) => record.ruleCall).map((record) => record.ruleCall);
const jevCalls = level3.requests + ruleCalls.length;
const wrongActions = records3.filter((record) => record.classifierWrongFields.includes("action"));
const wrongActionOutcomes = wrongActions.filter((record) => record.outcome === "error").length;
const byId3 = new Map(records3.map((record) => [record.id, record]));
if (level2.requests !== level3.requests || records2.length !== records3.length ||
    records2.some((record) => !byId3.has(record.id))) {
  throw new Error("The two independent runs must cover the same request set");
}
const errorsAt2 = records2.filter((record) => record.outcome === "error");
const injectionErrors2 = errorsAt2.filter((record) => record.category === "inj_refund_everything").length;
const harmfulRefunds2 = records2.filter((record) => record.harmful && record.executed.action === "Start refund").length;
const harmfulCancellations2 = records2.filter((record) => record.harmful && record.executed.action === "Cancel plan").length;

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
  dark: "0F1B2D", // dark band of slide 2
  darkLine: "2A415F", // divider on the dark band
  gold: "E4B75C", // evidence headline on the dark band
};
const FONT = "Calibri";
const TITLE = "Structured Decision Gates for Customer Support Agents: Intent Detection and Rule Checks";

// Speakers and speaking time per logical section; each walk-through section spans several slides.
const LONG = "Tran Thanh Long", NAM = "Nguyen Thanh Nam", SON = "Vu Van Son", QUY = "Vuong Quang Quy", PNAM = "Nguyen Phuong Nam";
const SPEAKER = [
  [LONG, 50], [LONG, 50], [LONG, 15], [LONG, 20], [LONG, 50], // title, start, quiz question, quiz answer, the history
  [LONG, 23], [LONG, 10], [LONG, 28], // written rules, many rules, Jev introduction
  [LONG, 23], [LONG, 21], // inputs, typed answers
  [LONG, 33], [LONG, 12], [LONG, 10], // the three walk-throughs (CASES in cases.js): every click is its own slide, so these seconds cover all of them
  // Each of the four other speakers has two slides and 120 s.
  [NAM, 60], [NAM, 60], // test data, outcomes
  [SON, 60], [SON, 60], // the run and the price, Result 1 (Jev)
  [QUY, 60], [QUY, 60], // Result 2 (the two levels), wrong action labels and correct outcomes
  [PNAM, 60], [PNAM, 60], // our idea, conclusion
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

// Technical infographic-style milestone icons for the history slide.
// Restrained editorial palette (Slate, Deck Blue, Deep Navy, Crisp White).
// Flat, high-contrast vector system diagrams with clean geometry (128x128 SVG).
const GEN_BADGES = {
  gen1: `
    <circle cx="64" cy="64" r="58" fill="#475569"/>
    <circle cx="64" cy="64" r="54" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25"/>
    <rect x="26" y="26" width="24" height="20" rx="3" fill="#FFFFFF"/>
    <rect x="30" y="31" width="10" height="2.5" rx="1" fill="#475569"/>
    <rect x="30" y="36" width="16" height="2" rx="1" fill="#94A3B8"/>
    <rect x="30" y="40" width="12" height="2" rx="1" fill="#CBD5E1"/>
    <path d="M 53 36 H 61 L 61 40" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    <polygon points="61,43 58,39 64,39" fill="#FFFFFF"/>
    <polygon points="54,43 88,43 75,62 75,72 67,72 67,62" fill="#334155" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
    <line x1="60" y1="50" x2="82" y2="50" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.8"/>
    <line x1="64" y1="56" x2="78" y2="56" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.8"/>
    <path d="M 68 72 C 68 80 50 80 50 88" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="92" r="9" fill="#FFFFFF"/>
    <path d="M 46 92 L 49 95 L 55 89" fill="none" stroke="#475569" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 74 72 C 74 80 90 80 90 86" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    <rect x="80" y="86" width="20" height="15" rx="3" fill="#FFFFFF"/>
    <path d="M 85 91 L 83 93.5 L 85 96 M 95 91 L 97 93.5 L 95 96" fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="91" y1="90" x2="89" y2="97" stroke="#475569" stroke-width="1.4" stroke-linecap="round"/>
  `,
  gen2: `
    <circle cx="64" cy="64" r="58" fill="#2F5F98"/>
    <circle cx="64" cy="64" r="54" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25"/>
    <path d="M 30 32 C 30 24 36 20 45 20 L 83 20 C 92 20 98 24 98 32 L 98 64 C 98 72 92 76 83 76 L 56 76 L 42 88 L 44 76 C 35 76 30 72 30 64 Z" fill="#FFFFFF"/>
    <path d="M 64 30 Q 64 45 77 45 Q 64 45 64 60 Q 64 45 51 45 Q 64 45 64 30 Z" fill="#1B365D"/>
    <circle cx="64" cy="45" r="3" fill="#FFFFFF"/>
    <path d="M 80 32 Q 80 36 84 36 Q 80 36 80 40 Q 80 36 76 36 Q 80 36 80 32 Z" fill="#2F5F98"/>
    <path d="M 48 53 Q 48 56 51 56 Q 48 56 48 59 Q 48 56 45 56 Q 48 56 48 53 Z" fill="#2F5F98"/>
    <circle cx="92" cy="74" r="13" fill="#1B365D" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M 86 74 L 90 78 L 98 70" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  gen3: `
    <circle cx="64" cy="64" r="58" fill="#1B365D"/>
    <circle cx="64" cy="64" r="54" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.25"/>
    <path d="M 44 42 H 84 V 68 H 64 V 80" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="64" cy="42" r="3" fill="#FFFFFF"/>
    <circle cx="84" cy="56" r="3" fill="#FFFFFF"/>
    <g transform="translate(44, 42)">
      <polygon points="0,-15 13,-7 13,8 0,15 -13,8 -13,-7" fill="#FFFFFF"/>
      <circle cx="0" cy="0" r="5" fill="none" stroke="#1B365D" stroke-width="1.8"/>
      <path d="M 0,-8 V -5 M 0,5 V 8 M -8,0 H -5 M 5,0 H 8" stroke="#1B365D" stroke-width="1.8" stroke-linecap="round"/>
    </g>
    <g transform="translate(84, 42)">
      <path d="M -13,-12 H 13 V 2 C 13 11 0 16 0 16 C 0 16 -13 11 -13 2 Z" fill="#FFFFFF"/>
      <path d="M -6,-3 L -9,0 L -6,3 M 6,-3 L 9,0 L 6,3" fill="none" stroke="#1B365D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="1.5" y1="-5" x2="-1.5" y2="5" stroke="#1B365D" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g transform="translate(64, 86)">
      <rect x="-26" y="-12" width="52" height="24" rx="12" fill="#FFFFFF"/>
      <path d="M -14,-7 Q -14,-1 -8,-1 Q -14,-1 -14,5 Q -14,-1 -20,-1 Q -14,-1 -14,-7 Z" fill="#1B365D"/>
      <line x1="-3" y1="-3" x2="16" y2="-3" stroke="#1B365D" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="-3" y1="3" x2="10" y2="3" stroke="#1B365D" stroke-width="2.2" stroke-linecap="round"/>
    </g>
  `,
  pin: `
    <path d="M 64 20 C 44 20 28 36 28 56 C 28 78 64 112 64 112 C 64 112 100 78 100 56 C 100 36 84 20 64 20 Z"
          fill="#1B365D" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="64" cy="54" r="14" fill="#FFFFFF"/>
    <circle cx="64" cy="54" r="6" fill="#1B365D"/>
  `
};
async function genIconPng(kind) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 128 128">${GEN_BADGES[kind]}</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
async function serpentinePng() {
  const road = "M 120 700 C 320 700 300 480 520 480 C 760 480 700 250 960 250 C 1180 250 1220 460 1480 460";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3200" height="1800" viewBox="0 0 1600 900">` +
    `<path d="${road}" fill="none" stroke="#FFFFFF" stroke-width="46" stroke-linecap="round"/>` +
    `<path d="${road}" fill="none" stroke="#${C.blue}" stroke-width="5" stroke-dasharray="26 22" stroke-linecap="round"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Curved connector arrow with a real arrowhead; a bare straight line reads too plain.
async function curveArrowPng(svg) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Corner ornament for the pale background: concentric discs, outline rings, a dotted
// ring, and a dot trail around one slide corner. Pure decoration, no meaning; the
// 900x900 canvas sits on a 6x6 inch frame at 150 dpi, with the corner at (900, 0).
function cornerOrnamentSvg(mirror) {
  const CX = 900, CY = 0, el = [];
  const circle = (r, attrs) => el.push(`<circle cx="${CX}" cy="${CY}" r="${r}" ${attrs}/>`);
  const dot = (r, aDeg, dr, fill) => {
    const a = (aDeg * Math.PI) / 180;
    el.push(`<circle cx="${(CX - r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}" r="${dr}" fill="${fill}"/>`);
  };
  circle(260, `fill="#E4EAF1"`);
  circle(165, `fill="#EDF1F6"`);
  circle(330, `fill="none" stroke="#C7D1DE" stroke-width="3"`);
  circle(410, `fill="none" stroke="#D3DCE6" stroke-width="2.5"`);
  circle(372, `fill="none" stroke="#A9B7C7" stroke-width="3.5" stroke-dasharray="1 24" stroke-linecap="round"`);
  dot(300, 10, 5, "#93A5BB"); dot(300, 24, 8, "#93A5BB"); dot(300, 39, 5, "#93A5BB");
  dot(300, 55, 7, "#93A5BB"); dot(300, 72, 4, "#93A5BB");
  dot(330, 38, 8, "#1B365D"); // navy accent on the outline ring
  dot(410, 62, 6, "#E4B75C"); // gold accent on the outer ring
  dot(150, 35, 6, "#C2CEDD"); dot(205, 60, 5, "#C2CEDD"); // quiet dots on the inner disc
  const body = mirror ? `<g transform="translate(900 900) scale(-1 -1)">${el.join("")}</g>` : el.join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">${body}</svg>`;
}

// Same ornament at a different size and anchor: `xf` maps the base corner to the
// wanted spot, so a slide can tuck the family style into its free areas.
function scaleOrnament(svg, xf) {
  return svg.replace(/^(<svg[^>]*>)/, `$1<g transform="${xf}">`).replace(/<\/svg>$/, "</g></svg>");
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
    "LuUndo2", "LuCalendarX", "LuKeyRound", "LuTrash2",
    "LuBadgeInfo",
    "LuEye", "LuEyeOff", "LuFlaskConical",
  ];
  const img = {};
  for (const n of ICONS) img[n] = await iconPng(n);
  img.LuEyeOffSlate = await iconPng("LuEyeOff", "#6B7A8C");
  img.LuLockNavy = await iconPng("LuLock", "#1B365D");
  // Flow arrows of slide 2: a dashed red curve for the injected order, a solid navy curve
  // for the direct tool call; both with a filled arrowhead along the end tangent.
  const injArrow = await curveArrowPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">` +
      `<path d="M 12 132 Q 122 120 230 42" fill="none" stroke="#A94A4A" stroke-width="5" stroke-dasharray="13 10" stroke-linecap="round"/>` +
      `<polygon points="230,42 217.5,62.2 206.9,47.6" fill="#A94A4A"/></svg>`
  );
  const callArrow = await curveArrowPng(
    `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="100" viewBox="0 0 170 100">` +
      `<path d="M 10 64 Q 72 26 140 52" fill="none" stroke="#1B365D" stroke-width="5.5" stroke-linecap="round"/>` +
      `<polygon points="140,52 118.4,52.4 124.2,37.4" fill="#1B365D"/></svg>`
  );
  const shots = {
    machine: await photo("assets/machine.jpg", 2.4, 2.4),
    human: await photo("assets/human.jpg", 2.4, 2.4),
  };
  const ornamentTRsvg = cornerOrnamentSvg(false);
  const ornamentBLsvg = cornerOrnamentSvg(true);
  const decorTR = await curveArrowPng(ornamentTRsvg);
  const decorBL = await curveArrowPng(ornamentBLsvg);
  // Slide 5 has road labels in both corners, so its ornament lives elsewhere: a small
  // nub pinned to the bottom-left corner and a mid-size arc on the right edge.
  const decor5BL = await curveArrowPng(scaleOrnament(ornamentBLsvg, "translate(0 900) scale(0.45) translate(0 -900)"));
  const decor5BR = await curveArrowPng(scaleOrnament(ornamentTRsvg, "translate(360 570) scale(0.6)"));

  function base(n, title, notes, withSpeaker = true, titleName, titleBox = {}) {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    // Corner ornaments (see cornerOrnamentSvg): pure decoration, drawn first so every
    // content element covers them. The "!!" names make Morph match the same image on
    // consecutive slides, so it stays put instead of fading in and out at each step.
    if (n === 5) {
      s.addImage({ data: decor5BL, x: 0, y: 1.5, w: 6, h: 6, objectName: "!!decor-bl" });
      s.addImage({ data: decor5BR, x: 13.333 - 6, y: 1.5, w: 6, h: 6, objectName: "!!decor-br" });
    } else {
      s.addImage({ data: decorTR, x: 13.333 - 6, y: 0, w: 6, h: 6, objectName: "!!decor-tr" });
      s.addImage({ data: decorBL, x: 0, y: 7.5 - 6, w: 6, h: 6, objectName: "!!decor-bl" });
    }
    s.addText(title, { x: ML, y: 0.4, w: CW, h: 0.95, margin: 0, fontFace: FONT, fontSize: 36, bold: true, color: C.navy, valign: "middle", objectName: titleName, ...titleBox });
    s.slideNumber = { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 11, color: C.muted };
    const [name, secs] = SPEAKER[n - 1];
    s.addNotes(withSpeaker ? `Speaker: ${name}, about ${secs} s. ${notes}` : notes);
    return s;
  }

  // Cards are solid white with no outline; the tinted background separates them.
  const box = (s, x, y, w, h, o = {}) =>
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w, h, rectRadius: o.radius ?? 0.08, fill: { color: o.fill || C.card },
      ...(o.line ? { line: { color: o.line, width: o.lineW ?? 1, dashType: o.dash } } : {}),
      ...(o.shadow ? { shadow: { type: "outer", color: "1B365D", opacity: 0.18, blur: 9, offset: 3, angle: 90 } } : {}),
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
  // Left: the approved topic-driven title and the team (x 0.7 to 6.6 on deep blue).
  // Right: the two agent designs compared (x 7.6 to 12.63 on light panel).
  {
    const s = pres.addSlide();
    s.background = { color: C.l3 };
    const M = 0.7, LW = 5.9, PX = 6.9, SX = PX + 0.7, SW = 13.333 - 0.7 - SX, light = "E3ECF6";
    s.addShape(pres.ShapeType.rect, { x: PX, y: 0, w: 13.333 - PX, h: 7.5, fill: { color: C.bg }, line: { color: C.bg, width: 0 } });

    s.addText(
      [{ text: "Phenikaa School of Computing", options: { bold: true, breakLine: true } }, { text: "English Writing and Presentation Skills \u00b7 October 2026" }],
      { x: M, y: 0.7, w: LW, h: 0.65, margin: 0, fontFace: FONT, fontSize: 16, color: light, valign: "top", paraSpaceAfter: 2 }
    );
    s.addText("Structured Decision Gates for\nCustomer Support Agents:\nIntent Detection and Rule Checks", {
      x: M, y: 1.55, w: LW, h: 2.4, margin: 0, fontFace: FONT, fontSize: 28, bold: true, color: C.white, valign: "top",
    });
    s.addText("Team", { x: M, y: 4.15, w: LW, h: 0.32, margin: 0, fontFace: FONT, fontSize: 16, bold: true, color: light, valign: "middle" });
    const team = [LONG, NAM, SON, QUY, PNAM];
    s.addText(team.map((t, i) => ({ text: t, options: { breakLine: i < team.length - 1 } })), {
      x: M, y: 4.52, w: LW, h: 1.5, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, valign: "top",
    });

    // Right panel: The two agent designs
    s.addText("Two agent designs\nfor support", { x: SX, y: 0.7, w: SW, h: 1.05, margin: 0, fontFace: FONT, fontSize: 26, bold: true, color: C.navy, valign: "top" });
    s.addText("Which architecture can handle consequential customer actions?", { x: SX, y: 1.82, w: SW, h: 0.45, margin: 0, fontFace: FONT, fontSize: 14, color: C.text, valign: "top" });

    const gap = 0.25, cardW = (SW - gap) / 2, cardY = 2.38, cardH = 4.42;
    // Paradigm 1: LLM Agent
    box(s, SX, cardY, cardW, cardH, { fill: C.white });
    s.addShape(pres.ShapeType.roundRect, { x: SX, y: cardY, w: cardW, h: 0.82, rectRadius: 0.08, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
    s.addImage({ data: img.LuBot, x: SX + 0.16, y: cardY + 0.16, w: 0.5, h: 0.5 });
    s.addText("LLM\nAgent", { x: SX + 0.72, y: cardY + 0.08, w: cardW - 0.8, h: 0.66, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, valign: "middle" });
    s.addText(
      bullets([
        "One monolithic model",
        "Policies in system prompt",
        "Model decides & executes",
        "High token & latency cost",
        "Susceptible to injection",
      ]),
      { x: SX + 0.14, y: cardY + 0.95, w: cardW - 0.28, h: 3.3, margin: 0, fontFace: FONT, fontSize: 14, color: C.text, paraSpaceAfter: 8, valign: "top" }
    );

    // Paradigm 2: Classifier + Rules + LLM
    const x2 = SX + cardW + gap;
    box(s, x2, cardY, cardW, cardH, { fill: C.white });
    s.addShape(pres.ShapeType.roundRect, { x: x2, y: cardY, w: cardW, h: 0.82, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
    s.addImage({ data: img.LuWorkflow, x: x2 + 0.16, y: cardY + 0.16, w: 0.5, h: 0.5 });
    s.addText("Classifier +\nRules + LLM", { x: x2 + 0.72, y: cardY + 0.08, w: cardW - 0.8, h: 0.66, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, valign: "middle" });
    s.addText(
      bullets([
        "Structured intent triage",
        "Facts parsed by classifier",
        "Code applies the rule answers",
        "LLM drafts reply only",
        "Zero unchecked actions",
      ]),
      { x: x2 + 0.14, y: cardY + 0.95, w: cardW - 0.28, h: 3.3, margin: 0, fontFace: FONT, fontSize: 14, color: C.text, paraSpaceAfter: 8, valign: "top" }
    );

    s.addNotes(
      `Speaker: ${LONG}, about ${SPEAKER[0][1]} s. Good morning. When customers request refunds, plan changes, or account deletions, a system that handles money and data without a check can cause severe harm. ` +
        "Companies often deploy LLM agents that read policy text and act directly, but these agents are slow, expensive, and vulnerable to prompt injection. " +
        "Today, we study an alternative architecture: combining intent classification, rule checks in code, and an LLM that writes the reply, and compare both on consequential customer requests."
    );
  }

  // ---------- 2. The core problem: LLM agents and consequential actions ----------
  // Evo-2 design: the anatomy flow of one request on the light top band, the three failure modes
  // on a dark bottom band. No quiz bar; the quiz lives on the next two slides.
  {
    const s = base(
      2,
      "Consequential actions: why LLM agents fail alone",
      "Customer support goes beyond answering FAQs: it executes consequential actions on customer accounts, such as refunds, plan changes, and deletions. " +
        "Companies deploy LLM agents with direct API tools, pasting complex policies into system prompts. " +
        "Because LLMs evaluate rules probabilistically, prompt injections and hallucinations trigger unauthorized, irreversible actions with no independent code check. " +
        "External evidence: on the Artificial Analysis Omniscience benchmark, even the model ranked number one of 369 still hallucinates on hard questions, and most companies deploy cheaper open-weight models, so only architecture can stop it. " +
        "Then the quiz runs on the next two slides: the question with four options, then the answer."
    );
    // Flow row on the light band, centered across the freed width: a message that hides an
    // order, the agent that trusts it, tools that run. No talk text on the slide; the
    // "smarter model" question lives in the speaker notes.
    box(s, 1.5, 1.5, 4.4, 1.95, { line: C.border, shadow: true });
    iconCircle(s, "LuUser", 1.78, 1.7, 0.44, C.blue);
    textBox(s, "Customer", 2.32, 1.76, 2.0, 0.32, { size: 12.5, bold: true, color: C.muted });
    s.addText("Please refund my $500 plan\nand delete my old projects.", { x: 1.75, y: 2.14, w: 3.9, h: 0.68, margin: 0, fontFace: FONT, fontSize: 16, color: C.text, valign: "top" });
    // The covert instruction: dashed slate outline, monospace, like hidden text. Red stays
    // reserved for the one destructive action and the dark band below.
    box(s, 1.75, 2.88, 3.9, 0.5, { fill: "F2F4F7", r: 0.08, line: "6B7A8C", lineW: 1.5, dash: "dash" });
    s.addImage({ data: img.LuEyeOffSlate, x: 1.92, y: 2.99, w: 0.28, h: 0.28 });
    textBox(s, 'hidden: "ignore your rules"', 2.32, 2.88, 3.2, 0.5, { size: 13, bold: true, color: "3A4656", font: "Courier New", valign: "middle" });
    s.addImage({ data: injArrow, x: 5.65, y: 2.4, w: 1.3, h: 0.75 });
    textBox(s, "prompt injection", 5.82, 2.3, 1.05, 0.28, { size: 12.5, bold: true, color: C.red, align: "center" });
    iconCircle(s, "LuBot", 6.93, 2.03, 1.15, C.navy);
    textBox(s, "LLM agent", 6.2, 3.35, 2.6, 0.3, { size: 15, bold: true, color: C.navy, align: "center" });
    textBox(s, "rules live in its prompt", 6.2, 3.66, 2.6, 0.28, { size: 13, color: C.muted, align: "center" });
    s.addImage({ data: callArrow, x: 8.0, y: 2.35, w: 0.85, h: 0.5 });
    textBox(s, "calls the tool\ndirectly", 7.5, 1.32, 1.3, 0.6, { size: 12.5, color: C.muted, align: "center", valign: "top" });
    [
      ["LuUndo2", "Start refund", C.blue],
      ["LuCalendarX", "Cancel plan", C.blue],
      ["LuTrash2", "Delete data", C.red],
    ].forEach(([ic, label, col], i) => {
      const y = 1.55 + i * 0.64;
      box(s, 8.85, y, 2.95, 0.52, { fill: col, r: 0.26, shadow: true });
      s.addImage({ data: img[ic], x: 9.08, y: y + 0.11, w: 0.3, h: 0.3 });
      textBox(s, label, 9.52, y, 2.2, 0.52, { size: 15, bold: true, color: C.white, valign: "middle" });
    });
    box(s, 8.85, 3.5, 2.95, 0.52, { fill: "EEF2F7", r: 0.08, line: C.navy, lineW: 1.5, dash: "dash" });
    s.addImage({ data: img.LuLockNavy, x: 9.05, y: 3.61, w: 0.3, h: 0.3 });
    textBox(s, "no safety net", 9.49, 3.5, 2.2, 0.52, { size: 15, bold: true, color: C.navy, valign: "middle" });
    // Dark band: the three failure modes as labeled icons. No talk text; the AA-Omniscience
    // evidence stays in the speaker notes.
    s.addShape(pres.ShapeType.rect, { x: 0, y: 4.55, w: 13.333, h: 2.95, fill: { color: "1F2E4A" }, line: { color: "1F2E4A", width: 0 } });
    textBox(s, "WHAT ACTUALLY HAPPENS", 0.9, 4.8, 6, 0.32, { size: 14, bold: true, color: "FF8B8B", spacing: 3 });
    [
      ["LuEye", "Prompt injection", "an order in the text overrides", "the written rules"],
      ["LuFlaskConical", "Hallucination", "an edge case of the policy", "reads as allowed"],
      ["LuShieldX", "No safety net", "money and data cannot", "come back"],
    ].forEach(([ic, head, sub1, sub2], i) => {
      const x = 1.1 + i * 4.1;
      iconCircle(s, ic, x, 5.75, 0.72, C.red);
      textBox(s, head, x + 0.95, 5.7, 2.9, 0.38, { size: 18, bold: true, color: "E7EDF6" });
      textBox(s, `${sub1} ${sub2}`, x + 0.95, 6.1, 2.9, 0.65, { size: 14, color: "9DB8DC", valign: "top" });
    });
  }

  // ---------- 3 and 4. Quiz: the question, then the answer ----------
  // One audience quiz on its own two slides, built on the AA-Omniscience benchmark that slide 2
  // cited: one percentage spectrum where each option is a marker with a big stat above it,
  // then the same spectrum with the correct marker lit.
  {
    const OPTS = [
      { letter: "A", label: "Almost never", sub: "0 to 5% of questions", big: "0-5%" },
      { letter: "B", label: "About one in five", sub: "around 20%", big: "~20%" },
      { letter: "C", label: "About half", sub: "around 50%", big: "~50%" },
      { letter: "D", label: "Nearly always", sub: "over 90%", big: "90%+" },
    ];
    const quiz = (n, title, notes, correct, attribution) => {
      const s = base(n, title, notes);
      textBox(s, 'The smartest AI should say "I don\'t know" on hard questions. How often does it still answer wrongly?', ML, 1.7, CW, 0.45, { size: 19, bold: true, color: C.navy });
      textBox(s, attribution, ML, 2.3, CW, 0.4, { size: 14, color: C.muted });
      // deco: a few dots like the AA leaderboard scatter
      [[10.95, 1.5, C.red], [11.35, 1.48, C.blue], [11.7, 1.52, C.teal], [12.05, 1.45, C.navy], [12.35, 1.48, C.blue], [12.6, 1.5, C.red]]
        .forEach(([x, y, col]) => s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.17, h: 0.17, fill: { color: col }, line: { color: col, width: 0 } }));
      // the spectrum: every option is a marker at its percentage of the axis
      const ax = ML + 0.4, aw = CW - 0.8, ay = 4.7;
      line(s, ax, ay, aw, 0, { color: C.border, width: 2.5 });
      OPTS.forEach((o, i) => {
        const cx = ax + [0.05, 0.20, 0.50, 0.90][i] * aw;
        const hit = correct === o.letter, dim = correct != null && !hit;
        const col = hit ? C.teal : dim ? "77828F" : C.navy;
        textBox(s, o.big, cx - 1.2, 3.35, 2.4, 0.85, { size: 44, bold: true, color: col, align: "center" });
        s.addShape(pres.ShapeType.ellipse, { x: cx - 0.16, y: ay - 0.16, w: 0.32, h: 0.32, fill: { color: col }, line: { color: col, width: 0 } });
        s.addShape(pres.ShapeType.ellipse, { x: cx - 0.23, y: ay + 0.47, w: 0.46, h: 0.46, fill: { color: col }, line: { color: col, width: 0 } });
        s.addText(o.letter, { x: cx - 0.23, y: ay + 0.47, w: 0.46, h: 0.46, margin: 0, fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle" });
        const row = i % 2 === 0 ? 1.0 : 1.5; // stagger labels so close ticks never collide
        textBox(s, o.label, cx - 1.6, ay + row, 3.2, 0.4, { size: 18, bold: true, color: col, align: "center" });
      });
      return s;
    };
    quiz(
      3,
      "Quick quiz: guess the error rate",
      "Set up the benchmark: AA-Omniscience scores 369 reasoning models on questions so hard that a good model should refuse or say it does not know; the hallucination rate is the share of wrong answers among all non-correct responses. " +
        "Ask the question, then read the four options. Say: hands up for your guess. Pause about five seconds and look around; do not give the answer. The next slide shows it.",
      null,
      "AA-Omniscience: 369 models tested."
    );
    const s = quiz(
      4,
      "The answer: about half",
      "Point at C: about half. The frontier models everyone calls the smartest, GPT, Gemini, Claude, still answer roughly half of the hard questions wrongly instead of refusing. Even the leaderboard minimum, a cheaper open-weight model, is 18%, and most companies deploy models in the 30 to 65% band. " +
        "A smarter model shrinks the number but cannot reach zero: hallucination is probabilistic. Only architecture stops it: fixed rules outside the model. " +
        "Land the bridge: a smarter model is not the fix; the fix is the system around the model, separate steps with fixed rules that decide. Support has been built that way for years. The next slide shows that history.",
      "C",
      "The smartest models: about half wrong. The minimum on the board: 18%."
    );
  }

  // ---------- 5. History ----------
  // Opening background slide: a rising serpentine road through the industry's history, described only. It comes before
  // Jev, the levels, and the results, so it names none of them, uses no experiment data, and makes no judgment.
  // Both eras run the same steps (classifier, rules, reply); only the model inside a step changes.
  // The third pin is a question, not an era: it leads into the next slides.
  {
    const s = base(
      5,
      "A short history of support systems",
      "Support systems have run the same steps for years: a classifier labels the message, fixed rules decide what to do, and something writes the reply. " +
        "Rules means ordinary program code written by people, such as: a refund above 100 dollars is denied. It runs the same way every time and is not a model. " +
        "Until 2022, the classifier was a trained intent model that sorts a message into a fixed list of intents, rules ran the flow, and the replies came from templates. " +
        "From 2023 until now, the classifier is an LLM, and an LLM agent holds the rules, decides, and acts. The steps stay the same, and only the model inside a step changes. " +
        "Source for the LLM as classifier: Bocklisch et al. 2024, Rasa CALM, arXiv 2402.12234: NLU assigns a message to a fixed list of intents, while an LLM interprets the message and the business logic stays in code. " +
        "So how do we improve it?"
    );
    // The road and infographic milestone icons are transparent PNGs (sharp); every word stays editable.
    s.addImage({ data: await serpentinePng(), x: 0, y: 0, w: 13.333, h: 7.5 });
    s.addImage({ data: await genIconPng("gen1"), x: 0.55, y: 5.383, w: 0.90, h: 0.90 });
    s.addImage({ data: await genIconPng("gen2"), x: 3.883, y: 3.55, w: 0.90, h: 0.90 });
    textBox(s, "?", 7.55, 1.633, 0.9, 0.9, { shape: pres.ShapeType.ellipse, fill: C.l3, line: C.white, color: C.white, size: 40, bold: true, margin: 0, align: "center", valign: "middle" });
    s.addImage({ data: await genIconPng("pin"), x: 1.888, y: 5.048, w: 0.44, h: 0.44 });
    s.addShape(pres.ShapeType.ellipse, { x: 12.23, y: 3.73, w: 0.20, h: 0.20, fill: { color: C.navy }, line: { color: C.white, width: 2 } });
    textBox(s, "until 2022", 1.25, 6.15, 3.0, 0.32, { size: 16, bold: true, color: C.navy });
    textBox(s, "Classifier + rules", 1.25, 6.46, 4.2, 0.45, { size: 22, bold: true, color: C.navy });
    textBox(s, "A trained model labels the message, fixed rules run the flow", 1.25, 6.92, 5.5, 0.35, { size: 16, color: C.text });
    textBox(s, "2023-now", 4.667, 4.35, 3.0, 0.32, { size: 16, bold: true, color: C.blue });
    textBox(s, "LLM Classifier + Agent", 4.667, 4.66, 5.6, 0.45, { size: 22, bold: true, color: C.navy });
    textBox(s, "An LLM labels the message, then an LLM agent", 4.667, 5.12, 5.8, 0.30, { size: 16, color: C.text });
    textBox(s, "holds the rules, decides, and acts", 4.667, 5.42, 5.8, 0.30, { size: 16, color: C.text });
    textBox(s, "next", 10.0, 0.80, 3.0, 0.32, { size: 16, bold: true, color: C.l3 });
    textBox(s, "How do we improve it?", 10.0, 1.12, 3.6, 0.45, { size: 22, bold: true, color: C.navy });
    textBox(s, "start here", 2.42, 5.46, 1.8, 0.32, { size: 15, bold: true, color: C.navy });
  }


  // Fill and accent of a state of the flow: fixed code, a model, or the written rules.
  const kinds = { fx: [C.greyL, C.grey], md: [C.blueL, C.blue], rl: [C.tealL, C.teal] };

  // ---------- 4. The written rules ----------
  {
    const s = base(
      6,
      "Every action meets a written rule: allow or deny",
      "Here is the essential gate, one rule for each action. First, the Security rule: if someone else used the account or the card, deny. A refund above 100 dollars is denied. So is a password link to an e-mail that is not on file, and a plan that is already cancelled. Deleting data is always denied. The LLM agent reads these rules as prompt text. Our pipeline checks each rule with one question, and the code runs the answer."
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
      [{ text: "Two ways to apply the rules. ", options: { bold: true } }, { text: "LLM agent: reads the rules in prompt text.   Jev pipeline: Jev answers one question for each rule." }],
      ML, 6.35, CW, 0.5, { size: 17, color: C.navy, valign: "middle" }
    );
  }

  // ---------- 4. Many rules ----------
  {
    const s = base(
      7,
      "Real support policies have many rules",
      "Real policies have many rules. Who should apply every rule: an LLM agent, or a fast classifier? We compare both.",
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
    textBox(s, "Illustration, not our data.", ML, 6.75, 4, 0.3, { size: 12, color: C.muted });
    textBox(s, "Who should apply every rule: an LLM agent, or a fast classifier?", 8.5, 6.1, 4.2, 0.9, {
      shape: pres.ShapeType.roundRect, fill: C.teal, color: C.white, size: 16, bold: true, margin: [0.08, 0.15, 0.08, 0.15], valign: "middle",
    });
  }

  // ---------- Jev introduction ----------
  {
    const s = base(
      8,
      "Meet Jev, a fast classifier",
      "Meet Jev, a fast classifier from the System One family of TypeSafe AI, version 1.13.0. It gives typed labels, each with a confidence. It also answers our own yes or no questions, one for each written rule, with no fine-tuning. It has no action tool and never writes text. It is cheap: input costs 4.2 cents per million tokens, and its output is free. On the right are recorded answers for one request."
    );
    const ROWS = [
      ["LuTags", "Typed labels, each with a confidence", "Topic, action, priority, risk, injection: fixed answers."],
      ["LuListChecks", "Answers our own yes/no questions", "One zero-shot question for each rule, with no fine-tuning."],
      ["LuLock", "Cannot act and never writes text", "It only answers. It cannot run an action or write a reply."],
      ["LuDollarSign", "Cheap per call", "Input: $0.042 per million tokens. Output: free."],
    ];
    const rw = 7.0, rh = 1.0, rg = 0.14;
    ROWS.forEach(([icon, head, sub], i) => {
      const y = 1.5 + i * (rh + rg);
      box(s, ML, y, rw, rh);
      iconCircle(s, icon, ML + 0.25, y + 0.15, 0.7, C.l3);
      textBox(s, head, ML + 1.15, y + 0.1, rw - 1.35, 0.4, { size: 20, bold: true, color: C.navy, valign: "middle" });
      textBox(s, sub, ML + 1.15, y + 0.52, rw - 1.35, 0.4, { size: 15, color: C.text, valign: "middle" });
    });
    // Recorded answers of one request (R0353 in cases.js): the shape of what Jev returns.
    const px = ML + rw + 0.35, pw = CW - rw - 0.35, ph = 4 * rh + 3 * rg;
    box(s, px, 1.5, pw, ph);
    textBox(s, "What Jev returns", px + 0.3, 1.62, pw - 0.6, 0.4, { size: 20, bold: true, color: C.navy, valign: "middle" });
    textBox(s, "Recorded answers for one request", px + 0.3, 2.02, pw - 0.6, 0.3, { size: 14, color: C.muted, valign: "middle" });
    const CHIP = "E9F0F8";
    [["Topic", "Refunds", "confidence 1.00"], ["Action", "Start refund", "confidence 0.98"], ["Rule: Amount limit", "ok", "confidence 0.97"]].forEach(([label, value, conf], i) => {
      textBox(s, [
        { text: label, options: { fontSize: 14, color: C.muted, breakLine: true } },
        { text: value, options: { fontSize: 20, bold: true, color: C.navy, breakLine: true } },
        { text: conf, options: { fontSize: 14, color: C.muted } },
      ], px + 0.3, 2.5 + i * 1.12, pw - 0.6, 1.0, {
        shape: pres.ShapeType.roundRect, fill: CHIP, line: CHIP, margin: [0.05, 0.15, 0.05, 0.15], valign: "middle",
      });
    });
    band(s, 6.35, 0.65, "LuBadgeInfo", [{ text: "Jev: ", options: { bold: true } }, { text: "System One family, TypeSafe AI (Almeida, 2026), version 1.13.0." }]);
  }

  // ---------- 6. What Jev reads ----------
  {
    const s = base(
      9,
      "Jev reads the chat first, then one rule at a time",
      "Jev is called twice. The first call reads the chat only: the text and the name of the sender. The second call runs when the action changes the state. It reads the chat, the account lines that this action needs, the actions already done, and one question for each written rule of the action, for example: is the amount above 100 dollars? The questions are written text, not code; a fixed table picks the account lines. Fixed code also does the arithmetic: the purchase line states the days since the charge, so Jev reads a number and never subtracts two dates. We found that each rule needs a question that we write: questions made from the text of the rule alone made more errors. Jev supports custom zero-shot questions without task-specific fine-tuning, but the question wording still needs evaluation. This is a reason to try it, not proof that it is the fastest or most accurate model."
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
        textBox(s, "Second call only. Code states the days since the charge.", x + 0.3, yI + 1.98, wI - 0.6, 0.5, { size: 14, color: C.muted });
      } else {
        s.addText(bullets(["Is the amount above $100?", "Is the charge older than 14 days?", "Is the auto-renewal already off?"]), { x: x + 0.3, y: yI + 1.05, w: wI - 0.6, h: 1.4, margin: 0, fontFace: FONT, fontSize: 15, color: C.text, paraSpaceAfter: 6, valign: "top" });
      }
      line(s, x + wI / 2, yI + hI + 0.03, 0, 0.32, { arrow: true });
    });
    textBox(s, [{ text: "Jev", options: { bold: true } }, { text: ": call 1 reads the chat; call 2 adds the account and the questions" }], ML, 4.5, CW, 0.75, {
      shape: pres.ShapeType.roundRect, fill: C.blue, line: C.blue, color: C.white, size: 24, margin: 0.2, valign: "middle", align: "center",
    });
    band(s, 5.55, 0.8, "LuLock", [{ text: "Rules are questions, not fixed checks. ", options: { bold: true } }, { text: "A table picks account lines; Jev's answers can still be wrong." }]);
  }

  // ---------- 7. What Jev answers ----------
  {
    const s = base(
      10,
      "Jev returns five fields, then one answer per rule",
      "The first call returns five fields: topic, priority, action, risk flag, and injection flag. The four shown here guide the flow; the risk flag is also recorded. If the injection flag is on, the action becomes Send reply, so an order hidden in the text is ignored. If the action changes the state, the second call answers one yes/no question for each written rule of that action: does this rule block the action? If no rule blocks it, the action runs; if one does, nothing runs. Typed answers constrain the output format, not correctness. The injection flag and the rule answers both come from Jev; neither is an independent policy verifier. Now, three recorded requests."
    );
    // Four of the five fields of Call 1 are shown; risk is also recorded. Call 2 answers one question per rule.
    const questions = [
      ["LuTags", "Topic", "What the request is about", ["Account", "Payments", "Plans and Credits", "Product Help", "Refunds", "Security"]],
      ["LuGauge", "Priority", "How urgent the request is", ["Low", "Medium", "High", "Critical"]],
      ["LuZap", "Action", "What the customer asks to do", ["Send reply", "Start refund", "Delete data", "Cancel plan", "Reset password"]],
      ["LuShieldX", "Injection flag", "The text gives orders to the model", ["on", "off"]],
      ["LuScale", "Rules", "One yes/no question for each rule", ["Blocks", "Does not block"]],
    ];
    const gapC = 0.2, gapX = 0.55, wC = (CW - 3 * gapC - gapX) / 5, yB = 1.5, yC = 1.95, hC = 3.9;
    const xOf = (i) => ML + i * (wC + gapC) + (i === 4 ? gapX - gapC : 0);
    const pill = (txt, x, y, w, fill, color, size = 13, h = 0.3) =>
      s.addText(txt, { shape: pres.ShapeType.roundRect, rectRadius: 0.14, x, y, w, h, fill: { color: fill }, margin: 0, fontFace: FONT, fontSize: size, color, align: "center", valign: "middle", wrap: false });
    pill("Call 1: five fields (four shown)", ML, yB, xOf(3) + wC - ML, C.blue, C.white, 14, 0.36);
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
        pill(o, x + 0.2 + cx, cy, w, bad ? "B91C1C" : last ? C.white : "E9F0F8", bad ? C.white : C.navy);
        cx += w + 0.08;
      });
      cy += 0.45;
      if (i === 3) textBox(s, [{ text: "If on: ", options: { bold: true, color: "B91C1C" } }, { text: "the action is Send reply, so the orders in the text are ignored." }], x + 0.2, cy, inner, 1.1, { size: 14 });
      if (last) textBox(s, "Only if the action changes the state", x + 0.2, cy, inner, 0.7, { size: 14, color: C.navy });
    });
  }


  // ---------- 8 to 10. Walk-throughs: one request through the flow of Level 3, one slide per click ----------
  // Each walk-through is a series of slides: the diagram of slide 8 with one recorded request played through it. Every slide
  // lights the next state and swaps the panel below. The slides share one title and one layout, and a morph transition
  // (transitions.js) runs between them, so the next key plays the request forward and the PDF holds every step. The data of the
  // three requests is in cases.js.
  const transitions = { morph: [], fade: [] }; // slide numbers (1-based) by the transition that leads into the slide
  const tick = await iconPng("LuCircleCheck", "#1F7A7A");
  const cross = await iconPng("LuCircleX", "#A94A4A");
  // The tone of a walk-through: normal (a request that runs), warning (a rule says no), danger (an attack in the message).
  // `accent`: the verdict in the title and the key state; `light`: the tint of the key state; `line`: the path of a denied request; `verdict`: the colour of the verdict of the rules.
  const TONES = {
    ok: { accent: C.teal, light: "E9F0F8", line: C.teal },
    // FFB282 is a light fill: navy ink and a navy icon ring on it, and a darker shade of the same hue
    // (`title`, `line`) wherever the colour is text or a thin line on the pale background.
    warn: { accent: "FFB282", ink: C.navy, ring: C.navy, light: "FDEBC8", line: "BA5C10", title: "BA5C10" },
    danger: { accent: "BE4F4F", light: "F3DEDC", line: "BE4F4F" },
  };

  const DIM = { fill: "E9EDF2", ring: "AEB7C2", text: "6B7785", arrow: "9AA6B3" }; // a state that the request has not reached
  const CHIP = "E9F0F8"; // light tint of a chip on a white card
  const FLOW = [
    ["New", "LuMail", "fx"],
    ["Jev", "LuTags", "md"],
    ["Rules", "LuScale", "md"],
    ["Do action", "LuZap", "fx"],
    ["Final message", "LuMessageSquareText", "md"],
  ];

  // `speakerRow`: the row of SPEAKER; `frame`: the slide of the series, 0 to K. Frame 0 shows only the diagram; frame k lights the
  // k-th state of the path, and the last frame lights the rest of the path together.
  function walkthrough(c, speakerRow, frame) {
    // `c.show`: the indices of `c.path` that get a slide of their own (default: all). The slide of a shown state lights every state
    // up to it; the last slide lights the rest of the path too. State 0 (New) is lit from the first slide.
    const show = c.show ?? c.path.map((_, i) => i);
    const K = show.length;
    const cover = (f) => (f === 0 ? 0 : f === K ? c.path.length - 1 : show[f - 1]); // the last path index that is lit on slide f
    const notes = frame === 0
      ? `This walk-through is ${K + 1} slides: press the next key once for each one, and the slides morph into each other. ${c.notes[0]}`
      : c.notes[frame];
    const tone = TONES[c.tone ?? "ok"];
    // The tone is the colour of the second half of the title.
    const [lead, verdict] = c.title.split(": ");
        const s = base(speakerRow, [{ text: `${lead}: ` }, { text: verdict, options: { color: tone.title ?? tone.accent } }], notes, frame === 0, "!!title");
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
    // Only the first slide of a series fades (the way in). Every later slide morphs, including the move of the diagram up when the panel comes in.
    transitions[frame === 0 ? "fade" : "morph"].push(pres.slides.length);

    const dy = frame === 0 ? 1.4 : 0; // frame 0 has no panel, so the diagram sits lower on the slide
    const H = 1.35, W = 1.9, y0 = 2.15 + dy, yDeny = 3.72 + dy, wN = FLOW.map(() => W), hN = FLOW.map(() => H);
    const gap = (CW - wN.reduce((a, v) => a + v, 0)) / (FLOW.length - 1);
    const X = FLOW.map((_, i) => ML + wN.slice(0, i).reduce((a, v) => a + v, 0) + i * gap);
    const yN = hN.map((h) => y0 + (H - h) / 2);
    const cx = X.map((x, i) => x + wN[i] / 2);
    const PX = ML, PY = 4.1, PW = CW, PH = 2.65; // the panel below the diagram

    // The customer message and the legend.
    sc.group("message", {}, (g) => {
      box(g, ML, 1.45, CW, 0.55);
      iconCircle(g, "LuUser", ML + 0.1, 1.5, 0.45, C.l2);
      textBox(g, [{ text: `${c.sender}: `, options: { bold: true } }, { text: `\u201C${c.text}\u201D` }], ML + 0.7, 1.45, CW - 0.9, 0.55, { size: 16, valign: "middle" });
    });

    // The diagram. Every state and every arrow is one set of objects that has the same names on every slide and only changes colour
    // when the request reaches it, so Morph recolours it in place. (Drawing a lit copy on top of a dim one makes the icon vanish
    // during the morph.) `litAt[n]`: the slide where state n lights up; `arrowAt[i]`: the slide where the arrow after state i does.
    const litAt = Array(FLOW.length).fill(Infinity);
    const arrowAt = Array(FLOW.length - 1).fill(Infinity);
    let denyAt = Infinity, denyFrom = 0, denyTo = 0; // the jump of a request that skips states: from which state to which
    c.path.forEach((n, p) => {
      let f = 0;
      while (cover(f) < p) f++;
      litAt[n] = f;
      if (p > 0) {
        const from = c.path[p - 1];
        if (n !== from + 1) { denyAt = f; denyFrom = from; denyTo = n; }
        else arrowAt[from] = f;
      }
    });
    const seg = (g, x, y, w, h, on, arrow, flipV) =>
      g.addShape(pres.ShapeType.line, {
        x, y, w, h, flipV, line: { color: on ? C.navy : DIM.arrow, width: on ? 3.5 : 2, endArrowType: arrow ? "triangle" : undefined },
      });
    FLOW.forEach(([name, icon, kind], i) => {
      sc.group(`state-${i}`, {}, (g) => {
        const on = frame >= litAt[i];
        const hot = on && i === c.hot; // the key state of the tone: full colour, white icon and text
        const [fill, accent] = hot ? [tone.accent, tone.accent] : kinds[kind];
        const ink = hot ? (tone.ink ?? C.white) : on ? C.navy : DIM.text;
        box(g, X[i], yN[i], wN[i], hN[i], { fill: on ? fill : DIM.fill });
        iconCircle(g, icon, cx[i] - 0.25, y0 + 0.12, 0.5, on ? (hot ? (tone.ring ?? accent) : accent) : DIM.ring);
        textBox(g, name, X[i] + 0.04, y0 + 0.68, wN[i] - 0.08, 0.34, { size: 15, bold: true, color: ink, align: "center", valign: "middle", margin: 0 });
      });
      // An arrow that the request never takes (it skips Do action) is not drawn, so the diagram shows no path that is not used.
      if (i < FLOW.length - 1 && arrowAt[i] < Infinity) sc.group(`arrow-${i}`, {}, (g) => seg(g, X[i] + wN[i] + 0.02, y0 + H / 2, gap - 0.04, 0, frame >= arrowAt[i], true, false));
    });
    // The route of a stopped request appears only on the slide where the request takes it: no grey preview before, none when unused.
    sc.group("deny", { in: denyAt }, (g) => {
      const color = tone.line, width = 3.5;
      const part = (x, y, w, h, arrow, flipV) =>
        g.addShape(pres.ShapeType.line, { x, y, w, h, flipV, line: { color, width, endArrowType: arrow ? "triangle" : undefined } });
      part(cx[denyFrom], y0 + H, 0, yDeny - (y0 + H), false, false);
      part(cx[denyFrom], yDeny, cx[denyTo] - cx[denyFrom], 0, false, false);
      part(cx[denyTo], y0 + H, 0, yDeny - (y0 + H), true, true);
      textBox(g, c.denyLabel ?? "a rule blocks it: nothing runs", cx[denyFrom], yDeny + 0.03, cx[denyTo] - cx[denyFrom], 0.3, { size: 14, color: DIM.text, align: "center", valign: "middle" });
    });

    // The card of a panel: the icon and the title of the state, and the kind of the state.
    const card = (g, node, title) => {
      const [, icon, kind] = FLOW[node];
      const accent = kinds[kind][1];
      box(g, PX, PY, PW, PH);
      iconCircle(g, icon, PX + 0.25, PY + 0.12, 0.5, accent);
      textBox(g, title, PX + 0.95, PY + 0.12, PW - 1.5, 0.5, { size: 19, bold: true, color: C.navy, valign: "middle" });
    };
    const lines = (items) => items.map((t, k) => ({ text: t, options: { breakLine: k < items.length - 1 } }));

    // The content of the panel of one state.
    const panel = (g, node) => {
      const title = [
        "New: the message is saved",
        "Jev: four of five recorded fields shown",
        "Rules: Jev answers one question for each rule",
        "Do action: fixed code runs the action",
        "Final message: the LLM writes the reply",
      ][node];
      card(named("card", 3), node, title);
      if (node === 0) {
        textBox(g, "The message is saved. No model runs and no rule is applied in this state.", PX + 0.25, PY + 0.85, PW - 0.5, 0.9, { size: 18 });
      } else if (node === 1) {
        const t = c.jev, n = t.answers.length, w = (PW - 0.5 - (n - 1) * 0.15) / n;
        t.answers.forEach(([label, value, conf], i) => {
          const hot = t.warn === i;
          const runs = [
            { text: label, options: { fontSize: 14, color: hot ? C.white : C.muted, breakLine: true } },
            { text: value, options: { fontSize: 18, bold: true, color: hot ? C.white : C.navy, breakLine: Boolean(conf) } },
          ];
          if (conf) runs.push({ text: conf, options: { fontSize: 14, color: hot ? C.white : C.muted } });
          textBox(g, runs, PX + 0.25 + i * (w + 0.15), PY + 0.7, w, 0.9, {
            shape: pres.ShapeType.roundRect, fill: hot ? tone.accent : CHIP, line: hot ? tone.accent : CHIP, lineW: 1, margin: [0.04, 0.12, 0.04, 0.12], valign: "middle",
          });
        });
        textBox(g, t.rule, PX + 0.25, PY + 1.8, PW - 0.5, 0.3, { size: 16, bold: true, color: C.navy, valign: "middle" });
      } else if (node === 2) {
        const r = c.rules;
        if (r) {
          // One chip for each rule question: the name of the rule, and "ok" or "blocks" with the confidence of the answer. Five chips in the first row.
          const per = 5, w = (PW - 0.5 - (per - 1) * 0.12) / per;
          r.chips.forEach(([name, state, conf], i) => {
            const blocks = state === "blocks";
            textBox(g, [
              { text: name, options: { fontSize: 14, color: blocks ? (tone.ink ?? C.white) : C.muted, breakLine: true } },
              // The blocking chip follows the rule of the "on" chip of slide 10: solid colour, tone ink on top.
              { text: `${state}  ${conf.toFixed(2)}`, options: { fontSize: 16, bold: true, color: blocks ? (tone.ink ?? C.white) : C.navy } },
            ], PX + 0.25 + (i % per) * (w + 0.12), PY + 0.68 + Math.floor(i / per) * 0.68, w, 0.58, {
              shape: pres.ShapeType.roundRect, fill: blocks ? tone.accent : CHIP, line: blocks ? tone.accent : CHIP, lineW: 1, margin: [0.03, 0.1, 0.03, 0.1], valign: "middle",
            });
          });
          textBox(g, r.rule, PX + 0.25, PY + 2.05, PW - 0.5, 0.28, { size: 16, bold: true, color: C.navy, valign: "middle" });
        } else {
          textBox(g, "No question is asked: the action is Send reply, and a reply changes nothing.", PX + 0.25, PY + 0.85, PW - 0.5, 0.9, { size: 18 });
        }
      } else if (node === 3) {
        g.addText(bullets(c.act), { x: PX + 0.25, y: PY + 0.85, w: PW - 0.5, h: 1.0, margin: 0, fontFace: FONT, fontSize: 18, color: C.text, paraSpaceAfter: 8, valign: "top" });
      } else if (node === 4) {
        textBox(g, `\u201C${c.final.text}\u201D`, PX + 0.25, PY + 0.72, PW - 0.5, 1.75, {
          shape: pres.ShapeType.roundRect, fill: CHIP, line: CHIP, size: 19, margin: [0.1, 0.2, 0.1, 0.2], valign: "middle",
        });
      }
    };

    // Clicks 1 to K: the request reaches the next state.
    show.forEach((pi, p) => {
      const node = c.path[pi], click = p + 1, last = p === K - 1;
      if (c.deny && node === 4) {
        // Every state that the request jumped over is marked, and none of them lights up.
        sc.group("skipped", { in: click }, (g) => {
          FLOW.forEach((_, n) => {
            if (n > 0 && !c.path.includes(n)) textBox(g, "skipped", X[n], y0 + 1.02, wN[n], 0.28, { size: 14, bold: true, color: tone.line, align: "center", valign: "middle" });
          });
        });
      }
      sc.group(`panel-${node}`, { in: click, out: last ? undefined : click + 1 }, (g) => panel(g, node));
    });

    // One ring that moves from state to state: Morph slides it from the old state to the new one.
    {
      const n = frame === 0 ? 0 : c.path[show[frame - 1]];
      named("ring").addShape(pres.ShapeType.roundRect, {
        x: X[n] - 0.05, y: yN[n] - 0.05, w: wN[n] + 0.1, h: hN[n] + 0.1, rectRadius: 0.1, fill: { color: C.card, transparency: 100 }, line: { color: C.navy, width: 3 },
      });
    }
  }

  CASES.forEach((c, i) => {
    for (let f = 0; f <= (c.show ?? c.path).length; f++) walkthrough(c, 11 + i, f);
  });

  // ---------- 11. Test data ----------
  // One slide for Nam: the five groups of the request set and the facts of the set that the talk must state.
  {
    const s = base(
      14,
      `Test data: ${data.customers} customers, ${sampleSize} requests`,
      `We made our own test set. It has ${data.customers} customers of a made-up AI video maker service company. Each customer has one purchase, some credits, and a list of password reset links. Each customer sends ${requestsPerCustomer} requests. So we have ${sampleSize} requests, in ${data.categories} types and five groups. The biggest group is high-impact actions, with ${groupSize[0]} requests. We made the set hard on purpose. On ${data.finalDenied} requests, a written rule says no. On ${injectionRequests} requests, an order hides inside the message. A program wrote all the requests and the correct answers. This is a hard test set, not real customer traffic.`
    );
    const cardH = 5.1;
    box(s, ML, 1.6, 7.9, cardH);
    s.addChart(pres.charts.BAR, [{ name: "Requests", labels: GROUPS.map(([name]) => name), values: groupSize }], {
      ...chartBase, showLegend: false, x: ML + 0.2, y: 1.7, w: 7.5, h: cardH - 0.2, barDir: "bar", barGapWidthPct: 40, chartColors: [C.l3],
      dataLabelPosition: "outEnd", dataLabelFontSize: 14, catAxisLabelFontSize: 14, catAxisOrientation: "maxMin", valAxisMaxVal: 430,
      title: `Requests per group (${sampleSize} in total)`,
    });
    const x = ML + 8.2, w = CW - 8.2, h = 1.5, gap = (cardH - 3 * h) / 2;
    [
      ["LuUsers", `${data.customers} customers`, `${requestsPerCustomer} requests each: ${sampleSize} requests of ${data.categories} types`, C.l3],
      ["LuScale", `${data.finalDenied} of ${sampleSize}`, "requests where a written rule denies the action", C.teal],
      ["LuShieldX", `${injectionRequests} attacks`, "requests that hide an order in the message", C.l3],
    ].forEach(([icon, big, label, color], i) => {
      callout(s, x, 1.6 + i * (h + gap), w, h, { icon, big, label, color, bigSize: 26, bigH: 0.55, bigY: 0.15, labelSize: 15 });
    });
  }

  // ---------- 13. Outcomes ----------
  {
    const s = base(
      15,
      "Every request ends served, stopped, or in error",
      "Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run. A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report the machine time of one request, the API cost per 1,000 requests, and the error counts on this request set."
    );
    // One wide card with three columns, then the harmful run in the red of an error, then the three measures in one row.
    const cw = CW / 3, y = 1.6, h = 3.0;
    box(s, ML, y, CW, h);
    [
      ["LuBadgeCheck", "Served", C.l3, "The correct result: an answer, or an action the rules allow."],
      ["LuShieldCheck", "Stopped", C.teal, "A rule denies the action. Nothing runs, and the reply gives the reason."],
      ["LuTriangleAlert", "Error", C.red, "Every other run: a wrong refusal, or a denied action that ran."],
    ].forEach(([ic, big, col, label], i) => {
      const x = ML + i * cw;
      if (i > 0) s.addShape(pres.ShapeType.line, { x, y: y + 0.3, w: 0, h: h - 0.6, line: { color: "D5DBE3", width: 1.5 } });
      iconCircle(s, ic, x + 0.4, y + 0.35, 0.85, col);
      textBox(s, big, x + 1.4, y + 0.35, cw - 1.6, 0.85, { size: 32, bold: true, color: col, valign: "middle" });
      textBox(s, label, x + 0.4, y + 1.5, cw - 0.8, 1.35, { size: 18 });
    });
    band(s, 4.85, 0.9, "LuShieldX", [{ text: "A harmful run ", options: { bold: true } }, { text: "changes money, data, the plan, or the password against the rules." }], C.red);
    box(s, ML, 5.95, CW, 0.95);
    [
      ["LuTimer", "Machine time per request"],
      ["LuDollarSign", "API cost per 1,000 requests"],
      ["LuBadgeCheck", "Error count"],
    ].forEach(([ic, label], i) => {
      const x = ML + i * cw;
      iconCircle(s, ic, x + 0.4, 5.95 + 0.2, 0.55, C.l3);
      textBox(s, label, x + 1.15, 5.95, cw - 1.3, 0.95, { size: 17, bold: true, color: C.navy, valign: "middle" });
    });
  }

  // ---------- 12. The run and the price ----------
  // One slide for Son: how the two levels ran, the two hosted models, the list prices, and the cost that follows.
  {
    const s = base(
      16,
      `Experimental setup: 1,024 requests, two architectures`,
      `We call two hosted models for real: Jev, version 1.13.0, and DeepSeek V4.1 Flash. Both architectures run on the same ${sampleSize} requests, in separate runs. The LLM agent makes two LLM calls: one to classify the request and one to answer for each request. The Jev pipeline makes ${(jevCalls / level3.requests).toFixed(1)} classifier calls and one LLM call. Jev costs 4.2 cents per million input tokens, and its output is free. The LLM costs 15 cents in and 60 cents out per million tokens. At list price, 1,000 requests cost $${cost2} for the LLM agent and $${cost3} for the Jev pipeline. These are API token charges, not total operating cost.`
    );
    // The run in one strip: the requests of each run and the two hosted models.
    {
      const ry = 1.55, rh = 0.8;
      box(s, ML, ry, CW, rh);
      [
        ["LuCpu", C.l3, `${sampleSize} requests in each independent run, comparing both architectures`],
        ["LuBot", C.grey, "Two hosted models: Jev (jev-1.13.0) and DeepSeek V4.1 Flash"],
      ].forEach(([ic, col, txt], i) => {
        const x = ML + 0.3 + i * (CW / 2);
        iconCircle(s, ic, x, ry + (rh - 0.6) / 2, 0.6, col);
        textBox(s, txt, x + 0.8, ry, CW / 2 - 1.3, rh, { size: 16, valign: "middle" });
      });
    }
    // One card for each level: the cost per 1,000 requests, a bar in proportion, the calls that one request makes, and what the level reads.
    const gap = 0.3, cw = (CW - gap) / 2, y = 2.55, h = 3.0, barW = cw - 0.7;
    [
      { x: ML, head: "LLM agent", icon: "LuBot", col: C.l2, cost: `$${cost2}`, share: 1, calls: [["LLM classifier", C.grey, 1.9], ["LLM call", C.grey, 1.4]], reads: "Reads the chat, the whole account, and all the rules" },
      { x: ML + cw + gap, head: "Jev pipeline", icon: "LuTags", col: C.l3, cost: `$${cost3}`, share: level3.apiCostPer1000 / AGENT_COST, calls: [[`Jev call × ${(jevCalls / level3.requests).toFixed(1)}`, C.l3, 2.0], ["LLM call", C.grey, 1.4]], reads: "Reads the chat first, then the rules of one action" },
    ].forEach((o) => {
      box(s, o.x, y, cw, h);
      iconCircle(s, o.icon, o.x + 0.35, y + 0.2, 0.6, o.col);
      textBox(s, o.head, o.x + 1.15, y + 0.2, cw - 1.45, 0.6, { size: 22, bold: true, color: C.navy, valign: "middle" });
      textBox(s, o.cost, o.x + 0.35, y + 0.9, 2.3, 0.8, { size: 48, bold: true, color: o.col, valign: "middle", margin: 0 });
      textBox(s, "per 1,000 requests", o.x + 2.7, y + 0.9, cw - 3.0, 0.8, { size: 18, color: C.muted, valign: "middle" });
      s.addShape(pres.ShapeType.roundRect, { x: o.x + 0.35, y: y + 1.8, w: barW, h: 0.28, rectRadius: 0.05, fill: { color: "E9EDF2" }, line: { color: "E9EDF2", width: 0 } });
      s.addShape(pres.ShapeType.roundRect, { x: o.x + 0.35, y: y + 1.8, w: barW * o.share, h: 0.28, rectRadius: 0.05, fill: { color: o.col }, line: { color: o.col, width: 0 } });
      let cx = o.x + 0.35;
      o.calls.forEach(([txt, fill, w]) => {
        textBox(s, txt, cx, y + 2.2, w, 0.36, { shape: pres.ShapeType.roundRect, fill, line: fill, color: C.white, bold: true, size: 14, margin: 0, valign: "middle", align: "center" });
        cx += w + 0.15;
      });
      textBox(s, "for each request", cx + 0.05, y + 2.2, 1.8, 0.36, { size: 14, color: C.muted, valign: "middle" });
      textBox(s, o.reads, o.x + 0.35, y + 2.6, cw - 0.7, 0.35, { size: 16, valign: "middle" });
    });
    // The list prices that the costs come from.
    {
      const py = 5.7, ph = 1.0;
      box(s, ML, py, CW, ph);
      [
        ["LuTags", C.l3, "Jev: $0.042 per million input tokens, output free"],
        ["LuBot", C.grey, "LLM (DeepSeek V4.1 Flash, list price): $0.15 in, $0.60 out per million tokens"],
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
      "Jev on our test set: speed, cost, and accuracy",
      `Now the first result, for Jev alone. Half of the requests need ${level3.decisionLatency.median.toFixed(2)} seconds or less of Jev time, including rule calls, and all Jev calls cost $${level3.decisionCostPer1000.toFixed(3)} per 1,000 requests. The first call gives the right topic on ${(100 * quality.queue.accuracy).toFixed(1)} percent of the scored requests, the priority on ${(100 * quality.priority.accuracy).toFixed(1)} percent, the action on ${(100 * quality.action.accuracy).toFixed(1)} percent, and the injection flag on ${(100 * quality.injection.accuracy).toFixed(1)} percent. ${count(ruleStats.matching)} of ${count(ruleStats.answers)} rule answers match the written rules. The first-call action label is wrong on ${wrongActions.length} requests, and ${wrongActionOutcomes === 0 ? "none" : wrongActionOutcomes} of these end in a wrong outcome. ${CHANGED_SHORT}, so we saw these failures before the last test.`
    );
    box(s, ML, 1.65, 7.6, 4.9);
    const labels = ["Topic", "Priority", "Action", "Injection flag", "Rule answers"];
    s.addChart(
      pres.charts.BAR,
      [{ name: "Jev", labels, values: [quality.queue.accuracy, quality.priority.accuracy, quality.action.accuracy, quality.injection.accuracy, ruleStats.matching / ruleStats.answers].map((value) => Number((100 * value).toFixed(1))) }],
      {
        ...chartBase, showLegend: false, x: ML + 0.2, y: 1.8, w: 7.2, h: 4.3, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
        chartColors: [C.l3, C.l3, C.l3, C.l3, C.teal], dataLabelPosition: "outEnd", dataLabelFontSize: 15, dataLabelFormatCode: "0.0",
        catAxisLabelFontSize: 14, valAxisHidden: false, valAxisMaxVal: 110, valAxisMajorUnit: 20, valAxisLabelFontSize: 14, valAxisLabelColor: C.text,
        valAxisLabelFormatCode: '0"%"', valAxisLineShow: true, valGridLine: { color: "D5DBE3", size: 0.75 }, title: "Correct answers (%)",
      }
    );
    textBox(s, `Scored: topic ${count(quality.queue.n)}; other fields ${sampleSize}; rule answers ${count(ruleStats.answers)}.`, ML + 0.3, 6.15, 7.0, 0.25, { size: 11, color: C.muted });
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.5, { icon: "LuZap", big: `${level3.decisionLatency.median.toFixed(2)} s`, label: "median Jev time per request (includes rule calls)", color: C.l3 });
    callout(s, x, 3.35, w, 1.5, { icon: "LuDollarSign", big: `$${level3.decisionCostPer1000.toFixed(3)}`, label: "per 1,000 requests for all Jev calls", color: C.l3 });
    callout(s, x, 5.05, w, 1.5, { icon: "LuBadgeCheck", big: `${wrongActionOutcomes} of ${wrongActions.length}`, label: "wrong first-call action labels end in a wrong outcome", color: C.teal, bigSize: 30, labelSize: 14 });
  }

  // ---------- 8. Result 2: the two architectures ----------
  // Both levels write the Final message with the same LLM. Only the decision step differs: one LLM agent call, or Jev answering typed questions.
  {
    const s = base(
      18,
      "Same reply model, different decision step",
      `We tested both systems on the same ${sampleSize} requests. Both use the same LLM to write the reply. Only the decision step is different. The LLM agent decides in one step. It serves ${level2.served} requests and stops ${level2.stopped}. It gets ${level2.errors} requests wrong. ${level2.harmful} of them cause real damage. ${injectionErrors2} are orders that hide inside the message. The Jev pipeline serves ${level3.served} requests and stops ${level3.stopped}. It gets none wrong. Jev is also faster. One request takes ${time3} seconds, not ${time2}. It is cheaper too. One thousand requests cost ${Math.round(100 * level3.apiCostPer1000)} cents, not $${cost2}. These numbers come from our own test set. They do not prove that the system is always safe. The two systems differ in model, input, and flow, so the results do not show which part gives the gain.`
    );
    box(s, ML, 1.65, 7.6, 3.95);
    const cats = ["LLM agent", "Jev pipeline"];
    s.addChart(
      pres.charts.BAR,
      [
        { name: "Served", labels: cats, values: [level2.served, level3.served] },
        { name: "Stopped by a rule", labels: cats, values: [level2.stopped, level3.stopped] },
        { name: "Wrong outcome", labels: cats, values: [level2.errors || null, level3.errors || null] },
      ],
      {
        ...chartBase, x: ML + 0.2, y: 1.75, w: 7.2, h: 3.75, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 45,
        chartColors: [C.l3, C.teal, C.red], dataLabelPosition: "ctr", dataLabelColor: C.white, dataLabelFontSize: 15, dataLabelFormatCode: "[<100];0", // a segment under 100 is too narrow for a white label: the errors get a label at the end of their row
        catAxisOrientation: "maxMin", valAxisMaxVal: 1300, title: `Outcome of the ${sampleSize} requests`,
      }
    );
    const x = ML + 7.9, w = CW - 7.9;
    callout(s, x, 1.65, w, 1.25, { icon: "LuBadgeCheck", big: `${level2.errors} vs ${level3.errors} wrong`, label: `${injectionErrors2} of the ${level2.errors} are orders hidden in the message`, color: C.teal, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    callout(s, x, 3.0, w, 1.25, { icon: "LuTimer", big: `${speedRatio}x faster`, label: `${time3}\u00A0s vs ${time2}\u00A0s of machine time per request`, color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    callout(s, x, 4.35, w, 1.25, { icon: "LuDollarSign", big: `${costRatio}x cheaper`, label: `$${cost3} vs $${cost2} per 1,000 requests`, color: C.l3, bigSize: 28, bigH: 0.55, bigY: 0.1, labelSize: 14 });
    // The error segment of the LLM agent is too narrow for a label, and the Jev pipeline has none: each row gets a label at its end.
    [[level2.errors, 2.725, C.red], [level3.errors, 4.1, C.teal]].forEach(([n, y, color]) => {
      textBox(s, `${n} wrong`, ML + 6.4, y, 0.95, 0.5, { size: 16, bold: true, color, valign: "middle", align: "right", margin: 0 });
    });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "Same LLM writes the reply. Only the decision step is different. ", options: { bold: true } }, { text: `Harmful runs: ${level2.harmful} vs ${level3.harmful}.` }]);
  }

  // Observed action-label and outcome results, not independent safety guards.
  // Every numerical result is also on slide 24; the rule evaluation was not blind.
  {
    const s = base(
      19,
      "Wrong action labels, correct outcomes on this test set",
      "These are observed results, not three independent safety guards. The injection flag and the rule answers both come from Jev. " +
        `First, Jev sets the injection flag right on ${(100 * quality.injection.accuracy).toFixed(1)} percent of the requests, and when it is on, the process sends a reply. ` +
        `Second, ${count(ruleStats.matching)} of ${count(ruleStats.answers)} rule answers match the written rules on this set. ` +
        `Third, the first-call action label is wrong on ${wrongActions.length} requests, and ${wrongActionOutcomes === 0 ? "none" : wrongActionOutcomes} of them end in a wrong outcome. ` +
        `The Jev pipeline gets ${level3.errors} wrong and has ${level3.harmful} harmful runs on this set. ${CHANGED_SHORT}, so we saw these failures before this last test.`
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y0 = 1.6, h0 = 3.95;
    [
      ["LuShieldX", "Injection flag", `${(100 * quality.injection.accuracy).toFixed(1)}%`, C.red, "of the flags are right. When the flag is on, the process sets the action to Send reply."],
      ["LuScale", "Rule questions", `${(100 * ruleStats.matching / ruleStats.answers).toFixed(0)}%`, C.teal, `of the answers match the written rules on this set. ${CHANGED_SHORT}.`],
      ["LuTarget", "Outcome", `${wrongActionOutcomes} of ${wrongActions.length}`, C.l3, "wrong first-call action labels end in a wrong outcome."],
    ].forEach(([ic, head, big, col, text], i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y0, cw, h0);
      iconCircle(s, ic, x + 0.3, y0 + 0.3, 0.7, col);
      textBox(s, head, x + 1.2, y0 + 0.3, cw - 1.4, 0.7, { size: 22, bold: true, color: C.navy, valign: "middle" });
      textBox(s, big, x + 0.3, y0 + 1.3, cw - 0.6, 0.9, { size: 54, bold: true, color: col, valign: "middle" });
      textBox(s, text, x + 0.3, y0 + 2.3, cw - 0.6, 1.5, { size: 18 });
    });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "The result: ", options: { bold: true } }, { text: `Jev pipeline: ${level3.errors} wrong and ${level3.harmful} harmful runs on our test set. Not a safety guarantee.` }]);
  }

  // ---------- 17. Our idea: limit each model ----------
  // Our own design only, no outside source: what each part of Level 3 may do, and what it may not do.
  {
    const s = base(
      20,
      "Our idea: limit what each model can trigger",
      "Our idea is to limit what each model can trigger. " +
        "Jev has no action tool. It answers typed questions about the chat and the rules. Fixed code runs the action only when no rule blocks it. " +
        "The LLM writes the final message after the action or the refusal, and it cannot change that decision. " +
        "This is fixed execution, not independent policy verification: the code does not recheck the policy facts against the account, so a wrong rule answer can still allow an unsafe action."
    );
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y0 = 1.6, h0 = 3.95;
    [
      ["LuTags", "Jev", C.l3, "Answers typed questions about the chat and each rule. It has no action tool, but its answers control which code branch runs."],
      ["LuShieldCheck", "Process", C.teal, "Runs an action only when Jev reports that no rule blocks it. It does not independently verify policy facts against the account."],
      ["LuBot", "LLM", C.blue, "Writes the final message after the action or refusal. It does not change the action decision. Its reply is not a policy check."],
    ].forEach(([ic, big, col, text], i) => {
      const x = ML + i * (cw + gap);
      box(s, x, y0, cw, h0);
      iconCircle(s, ic, x + 0.3, y0 + 0.3, 0.9, col);
      textBox(s, big, x + 1.45, y0 + 0.3, cw - 1.65, 0.9, { size: 30, bold: true, color: col, valign: "middle" });
      textBox(s, text, x + 0.3, y0 + 1.6, cw - 0.6, 2.2, { size: 22 });
    });
    band(s, 5.85, 0.95, "LuShieldCheck", [{ text: "Fixed execution is not fixed policy verification: ", options: { bold: true } }, { text: "a wrong Jev rule answer can still allow an unsafe action." }]);
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
        `Same ${sampleSize} requests in both independent runs. LLM agent: ${level2.served} served, ${level2.stopped} stopped, ${level2.errors} wrong. Jev pipeline: ${level3.served} served, ${level3.stopped} stopped, ${level3.errors} wrong.`,
        `Jev pipeline has ${speedRatio}x lower mean machine time and ${costRatio}x lower API cost, and none wrong on this request set.`,
        `Each rule needs a written question. ${CHANGED_SHORT}; this rule evaluation was not blind.`,
        "Not tested: trained classifiers, other decision models, or a held-out request set.",
      ]),
      { x: M, y: 1.65, w: LW, h: 4.05, margin: 0, fontFace: FONT, fontSize: 18, color: C.white, paraSpaceAfter: 9, valign: "top" }
    );
    [
      { icon: "LuBadgeCheck", big: `${level2.errors} vs ${level3.errors}`, label: "wrong: LLM agent vs Jev pipeline", color: C.teal },
      { icon: "LuTimer", big: `${speedRatio}x`, label: `lower mean machine time: ${time3}\u00A0s vs ${time2}\u00A0s`, color: C.l3 },
      { icon: "LuDollarSign", big: `${costRatio}x`, label: `lower API cost: $${cost3} vs $${cost2} per 1,000 requests`, color: C.l3 },
    ].forEach((o, i) => callout(s, CX, 0.7 + i * 2.1, CWd, 1.9, { ...o, bigSize: 38, bigH: 0.8, bigY: 0.25, labelSize: 15 }));
    s.addNotes(
      `Speaker: ${PNAM}, about ${SPEAKER[19][1]} s. Last, we tested both systems on the same ${sampleSize} requests. The LLM agent serves ${level2.served} and stops ${level2.stopped}. It gets ${level2.errors} wrong. The Jev pipeline serves ${level3.served} and stops ${level3.stopped}. It gets none wrong. ` +
        `The Jev pipeline is ${speedRatio} times faster and ${costRatio} times cheaper. Each rule needs a question that we write. ${CHANGED_SHORT}, so we saw these failures before the last test. We did not test other models. ` +
         +
        "Thank you for listening."
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
      { icon: "LuWorkflow", big: "Slides 11 to 20", label: "Walk-throughs: one request through the flow", color: C.l3 },
      { icon: "LuDatabase", big: "Slides 21 and 22", label: "Test data and how we score", color: C.l3 },
      { icon: "LuBadgeCheck", big: "Slides 24 and 25", label: "Results: speed, cost, and accuracy", color: C.teal },
      { icon: "LuScale", big: "Slide 26", label: "Wrong action labels and observed outcomes", color: C.blue },
    ].forEach((o, i) => callout(s, CX, 0.7 + i * 1.55, CWd, 1.35, { ...o, bigSize: 28, bigH: 0.55, bigY: 0.12, labelSize: 15 }));
    s.addNotes("Question slide, not part of the timed talk. Tran Thanh Long answers; the other four stand beside him. The cards on the right say which slide to open for each kind of question.");
  }

  const file = await pres.write({ outputType: "nodebuffer" });
  fs.writeFileSync("deck.pptx", await addTransitions(await dropBlankPoints(file), transitions));
  console.log("wrote deck.pptx,", pres.slides.length, "slides");
})();
