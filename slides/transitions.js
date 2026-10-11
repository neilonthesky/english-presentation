// Slide transitions for the deck written by pptxgenjs, which has no transition API.
// A walk-through is a series of slides (build.js). Morph between two of them makes the next key play the request forward
// (the first two slides of a series use a plain fade):
// the objects that have the same "!!" name on both slides stay or move (the ring glides from one state to the next), and the others
// fade in or out. Morph needs PowerPoint 2019 or Microsoft 365. Older PowerPoint, Keynote, and LibreOffice read the fallback: a fade.
const JSZip = require("jszip");
const crypto = require("crypto");

// Durations in ms: a fade takes 0.4 s, Morph 0.6 s. `spd` is what readers without p14:dur use.
const MC = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
const FADE =
  `<mc:AlternateContent ${MC}>` +
  '<mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14">' +
  '<p:transition spd="fast" p14:dur="400"><p:fade/></p:transition>' +
  "</mc:Choice>" +
  '<mc:Fallback><p:transition spd="fast"><p:fade/></p:transition></mc:Fallback>' +
  "</mc:AlternateContent>";
const MORPH =
  `<mc:AlternateContent ${MC}>` +
  '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">' +
  '<p:transition spd="med" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" p14:dur="600"><p159:morph option="byObject"/></p:transition>' +
  "</mc:Choice>" +
  '<mc:Fallback><p:transition spd="fast"><p:fade/></p:transition></mc:Fallback>' +
  "</mc:AlternateContent>";

/**
 * pptxgenjs writes every picture once per slide, so the same icon is a different file on every slide. Morph then sees two different
 * pictures with the same name, fades the old one out and the new one in, and the icon vanishes in the middle of the transition.
 * Make all pictures with the same bytes one file, so that Morph sees the same picture and keeps it.
 */
async function shareMedia(zip) {
  const canon = new Map(); // sha1 -> the media file that stays
  const rename = new Map(); // duplicate file name -> the media file that stays
  for (const path of Object.keys(zip.files).filter((p) => p.startsWith("ppt/media/") && !zip.files[p].dir).sort()) {
    const sha = crypto.createHash("sha1").update(await zip.file(path).async("nodebuffer")).digest("hex");
    if (canon.has(sha)) {
      rename.set(path.slice("ppt/media/".length), canon.get(sha));
      zip.remove(path);
    } else canon.set(sha, path.slice("ppt/media/".length));
  }
  for (const rels of Object.keys(zip.files).filter((p) => p.endsWith(".rels"))) {
    const xml = await zip.file(rels).async("string");
    const out = xml.replace(/Target="\.\.\/media\/([^"]+)"/g, (m, f) => `Target="../media/${rename.get(f) ?? f}"`);
    if (out !== xml) zip.file(rels, out);
  }
}

/**
 * Add a transition to slides. `slides`: { morph: [slide numbers], fade: [slide numbers] }, 1-based; a transition plays when the
 * slide appears. Returns the new file as a Buffer.
 */
async function addTransitions(buffer, slides) {
  const zip = await JSZip.loadAsync(buffer);
  await shareMedia(zip);
  for (const [kind, xmlBlock] of [["morph", MORPH], ["fade", FADE]]) {
    for (const n of slides[kind]) {
      const path = `ppt/slides/slide${n}.xml`;
      const xml = await zip.file(path).async("string");
      // The order inside <p:sld> is cSld, clrMapOvr, transition.
      if (!xml.endsWith("</p:clrMapOvr></p:sld>")) throw new Error(`${path} does not end as expected`);
      zip.file(path, xml.slice(0, -"</p:sld>".length) + xmlBlock + "</p:sld>");
    }
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

module.exports = { addTransitions };
