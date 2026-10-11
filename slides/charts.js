// Charts of the deck, after pptxgenjs wrote them.
//
// A stacked bar writes the error count of a level that makes no error as a zero. PowerPoint hides that label from the number
// format alone (`0;-0;;@`), but the converters that make the PDF (OnlyOffice, LibreOffice) ignore the format and draw a "0" next
// to the axis label. Drop the empty value from the numeric cache instead: a point that is not in the cache is blank, so no
// segment and no label are drawn, and PowerPoint reads the same thing.
const JSZip = require("jszip");

/** Remove every point of a chart numeric cache whose value is empty. Returns the new file as a Buffer. */
async function dropBlankPoints(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let dropped = 0;
  for (const path of Object.keys(zip.files).filter((p) => /^ppt\/charts\/chart\d+\.xml$/.test(p))) {
    const xml = await zip.file(path).async("string");
    const out = xml.replace(/<c:pt idx="\d+"><c:v><\/c:v><\/c:pt>/g, () => {
      dropped++;
      return "";
    });
    if (out !== xml) zip.file(path, out);
  }
  if (dropped === 0) throw new Error("no blank chart point found: the deck should hold one zero error bar");
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

module.exports = { dropBlankPoints };
