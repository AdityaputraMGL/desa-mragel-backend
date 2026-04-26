const puppeteer = require("puppeteer");
const hbs = require("handlebars");
const fs = require("fs-extra");
const path = require("path");

const generatePDF = async (templateName, data) => {
  try {
    // 1. Cari file template HTML
    const filePath = path.join(
      process.cwd(),
      "src",
      "templates",
      `${templateName}.html`,
    );

    // 2. Baca file HTML
    const html = await fs.readFile(filePath, "utf-8");

    // 3. Tempel data ke HTML (Compile Handlebars)
    const template = hbs.compile(html);
    const finalHtml = template(data);

    // 4. Jalankan Puppeteer (Browser bayangan)
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"], // Penting untuk server/hosting
    });
    const page = await browser.newPage();

    // 5. Render PDF
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2cm", right: "2cm", bottom: "2cm", left: "2cm" },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

module.exports = { generatePDF };
