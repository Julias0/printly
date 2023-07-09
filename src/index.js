const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const upload = require("express-fileupload");
const csvtojson = require("csvtojson");
const ejs = require("ejs");
const crypto = require("crypto");
const fs = require("fs");
require('dotenv').config();
const path = require('path');

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(upload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
      fs.writeFileSync(`./public/html/${filename}.html`, renderedFile);

      res.sendFile(path.resolve(`./public/html/${filename}.html`));
    }
  );
});

app.listen(process.env.PORT, () => {
  console.log(`Application running on port ${process.env.PORT}`);
});
