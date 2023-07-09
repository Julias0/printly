const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const upload = require("express-fileupload");
const csvtojson = require("csvtojson");
const ejs = require("ejs");
const crypto = require("crypto");
const fs = require("fs");
const puppeteer = require("puppeteer");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(upload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function createFile(renderedFile, path) {
  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--single-process",
    ],
    ignoreHTTPSErrors: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(renderedFile, {
      timeout: 30000,
      waitUntil: "load", // or one of 'domcontentloaded' | 'networkidle0' | 'networkidle2'
    });

    await page.pdf({
      path,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
    });
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

app.get("/", (req, res) => {
  res.render("pages/home");
});

app.post("/csv", async (req, res) => {
  const csvData = req.files.csvfile.data.toString("utf8");
  const jsonifiedCsv = await csvtojson().fromString(csvData);
  ejs.renderFile(
    "./views/templates/1.ejs",
    {
      uploadedData: jsonifiedCsv,
    },
    (err, renderedFile) => {
      const filename = crypto.randomBytes(16).toString("hex");
      if (process.env.DEBUG || true) {
        fs.writeFileSync(`./debug/${filename}.html`, renderedFile);
      }

      createFile(renderedFile, `./public/pdf/${filename}.pdf`).then(
        function () {
          res.render("partials/upload_success", {
            filename,
          });
        }
      );
    }
  );
});

app.listen(process.env.PORT, () => {
  console.log(`Application running on port ${process.env.PORT}`);
});
