// Google Slides drops native pptx charts and misdraws some line shapes, so this
// script writes a second deck where every slide is one full-bleed image. Google
// Slides renders those without any loss. Run after render.sh; keep deck.pptx as
// the editable master.
//
//   pdftoppm -jpeg -r 150 deck.pdf /tmp/gimg/s
//   node make_image_deck.js /tmp/gimg
//
// The speaker notes are copied from deck.pptx (the "Speaker: name, about N s."
// prefix is stripped).

const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const pptxgen = require("pptxgenjs");

const SLIDES = 29;
const TITLE = "Structured Decision Gates for Customer Support Agents";

async function notesOf(deckPath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath));
  const notes = [];
  for (let i = 1; i <= SLIDES; i++) {
    const f = zip.file(`ppt/notesSlides/notesSlide${i}.xml`);
    if (!f) {
      notes.push("");
      continue;
    }
    const xml = await f.async("string");
    const txt = xml
      .replace(/<\/a:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    const lines = txt.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.length && /^Speaker:/.test(lines[0])) lines[0] = lines[0].replace(/^Speaker: [^,]+, about \d+ s\. */, "");
    notes.push(lines.join("\n"));
  }
  return notes;
}

(async () => {
  const dir = process.argv[2] || "/tmp/gimg";
  const notes = await notesOf(path.join(__dirname, "deck.pptx"));
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = TITLE;
  for (let i = 1; i <= SLIDES; i++) {
    const s = p.addSlide();
    s.background = { color: "FFFFFF" };
    s.addImage({ path: path.join(dir, `s-${String(i).padStart(2, "0")}.jpg`), x: 0, y: 0, w: 13.333, h: 7.5 });
    if (notes[i - 1]) s.addNotes(notes[i - 1]);
  }
  await p.writeFile({ fileName: path.join(__dirname, "deck-images.pptx") });
  console.log(`wrote deck-images.pptx, ${SLIDES} slides`);
})();
