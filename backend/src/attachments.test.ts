import assert from "node:assert/strict";
import {
	AttachmentError,
	cleanFilename,
	figureKey,
	inspectPdf,
	looksLikePdf,
	parseCrop,
	renderFigure,
} from "./attachments.ts";

/** A valid two-page PDF with correct cross-reference offsets. */
function tinyPdf() {
	const objects = [
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] >>",
	];
	let body = "%PDF-1.4\n";
	const offsets = objects.map((object, index) => {
		const offset = body.length;
		body += `${index + 1} 0 obj\n${object}\nendobj\n`;
		return offset;
	});
	const xref = body.length;
	body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
	body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return new TextEncoder().encode(body);
}

assert.equal(looksLikePdf(tinyPdf()), true);
assert.equal(looksLikePdf(new TextEncoder().encode("<html>not a pdf</html>")), false);

assert.equal(cleanFilename("  UC3843.pdf "), "UC3843.pdf");
assert.equal(cleanFilename("../../etc/passwd\u0000.pdf"), "....etcpasswd.pdf");
assert.equal(cleanFilename(""), "document.pdf");

assert.equal(parseCrop(undefined), undefined);
assert.equal(parseCrop("0.1,0.2"), undefined);
assert.equal(parseCrop("0,0,0.01,0.5"), undefined, "slivers are refused");
assert.deepEqual(parseCrop("0.1234,0.5,0.4,2"), { x: 0.123, y: 0.5, width: 0.4, height: 0.5 });
assert.deepEqual(parseCrop("-1,0,5,1"), { x: 0, y: 0, width: 1, height: 1 });

assert.equal(figureKey("a1", 3, undefined), "figures/a1/3-page.png");
assert.equal(
	figureKey("a1", 3, { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }),
	"figures/a1/3-0.1-0.2-0.3-0.4.png",
);

assert.deepEqual(await inspectPdf(tinyPdf()), { pages: 2 });
await assert.rejects(inspectPdf(new TextEncoder().encode("hello")), AttachmentError);
await assert.rejects(
	inspectPdf(new TextEncoder().encode("%PDF-1.4\nbroken")),
	AttachmentError,
);

const png = [0x89, 0x50, 0x4e, 0x47];
const page = await renderFigure(tinyPdf(), 2, undefined);
assert.deepEqual([...page.subarray(0, 4)], png);
const crop = await renderFigure(tinyPdf(), 1, { x: 0, y: 0, width: 0.5, height: 0.5 });
assert.deepEqual([...crop.subarray(0, 4)], png);
assert.ok(crop.length < page.length, "a crop renders fewer pixels than the page");
