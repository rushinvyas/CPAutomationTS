const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const runTimestamp = process.env.CP_RUN_TIMESTAMP || new Date().toISOString().replace(/[:.-]/g, "").slice(0, 15);
const targetDir = path.join(rootDir, "reports", runTimestamp);

function copyIfExists(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
}

function main() {
  fs.mkdirSync(targetDir, { recursive: true });

  copyIfExists(path.join(rootDir, "artifacts"), path.join(targetDir, "artifacts"));
  copyIfExists(path.join(rootDir, "allure-results"), path.join(targetDir, "allure-results"));
  copyIfExists(path.join(rootDir, "allure-report"), path.join(targetDir, "allure-report"));

  const summaryPath = path.join(rootDir, "artifacts", "summary.txt");
  if (fs.existsSync(summaryPath)) {
    fs.copyFileSync(summaryPath, path.join(targetDir, "summary.txt"));
  }

  const htmlReportPath = path.join(rootDir, "report.html");
  if (fs.existsSync(htmlReportPath)) {
    fs.copyFileSync(htmlReportPath, path.join(targetDir, "report.html"));
  }

  console.log(`Archived report folder created at ${targetDir}`);
}

main();
