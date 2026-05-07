import puppeteer from "puppeteer";

/**
 * Renders a full HTML document string to a single-page PDF (A4-style 595×842px).
 * Same pipeline as acknowledge invoice PDF and payment receipt PDF.
 */
export async function renderHtmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "595px",
      height: "842px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
