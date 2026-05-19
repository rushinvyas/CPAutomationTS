const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const artifactsDir = path.join(rootDir, "artifacts");
const reportPath = path.join(artifactsDir, "cucumber-report.json");
const reportsDir = path.join(rootDir, "reports");
const runTimestamp = process.env.CP_RUN_TIMESTAMP || new Date().toISOString().replace(/[:.-]/g, "").slice(0, 15);

function loadReport() {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Cucumber report not found at ${reportPath}`);
  }

  const raw = fs.readFileSync(reportPath, "utf8").trim();

  if (!raw) {
    throw new Error(`Cucumber report is empty at ${reportPath}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Cucumber report is not valid JSON at ${reportPath}: ${error.message}`);
  }
}

function buildSummary(report) {
  let scenarioPassed = 0;
  let scenarioFailed = 0;
  let scenarioSkipped = 0;
  let stepPassed = 0;
  let stepFailed = 0;
  let stepSkipped = 0;
  let totalDurationNs = 0;

  const scenarioLines = [];

  for (const feature of report) {
    for (const element of feature.elements || []) {
      const visibleSteps = (element.steps || []).filter((step) => !step.hidden);
      const failedStep = visibleSteps.find((step) => step.result?.status === "failed");
      const hasPassedSteps = visibleSteps.some((step) => step.result?.status === "passed");
      const allSkipped = visibleSteps.length > 0 && visibleSteps.every((step) => step.result?.status === "skipped");

      if (failedStep) {
        scenarioFailed += 1;
      } else if (allSkipped && !hasPassedSteps) {
        scenarioSkipped += 1;
      } else {
        scenarioPassed += 1;
      }

      for (const step of visibleSteps) {
        if (step.result?.status === "passed") stepPassed += 1;
        else if (step.result?.status === "failed") stepFailed += 1;
        else if (step.result?.status === "skipped") stepSkipped += 1;

        if (typeof step.result?.duration === "number") {
          totalDurationNs += step.result.duration;
        }
      }

      scenarioLines.push({
        feature: feature.name,
        scenario: element.name,
        status: failedStep ? "FAILED" : allSkipped && !hasPassedSteps ? "SKIPPED" : "PASSED",
        failedStep: failedStep?.name || "",
        error: failedStep?.result?.error_message || "",
      });
    }
  }

  const totalScenarios = scenarioPassed + scenarioFailed + scenarioSkipped;
  const totalSteps = stepPassed + stepFailed + stepSkipped;

  return {
    runTimestamp,
    environment: process.env.CP_ENV || "Not Set",
    portal: process.env.CP_PORTAL || "Not Set",
    scenarioPassed,
    scenarioFailed,
    scenarioSkipped,
    stepPassed,
    stepFailed,
    stepSkipped,
    totalScenarios,
    totalSteps,
    scenarioPassPercentage: totalScenarios === 0 ? 0 : (scenarioPassed / totalScenarios) * 100,
    scenarioFailPercentage: totalScenarios === 0 ? 0 : (scenarioFailed / totalScenarios) * 100,
    stepPassPercentage: totalSteps === 0 ? 0 : (stepPassed / totalSteps) * 100,
    stepFailPercentage: totalSteps === 0 ? 0 : (stepFailed / totalSteps) * 100,
    totalDurationNs,
    scenarioLines,
  };
}

function formatDuration(totalDurationNs) {
  const totalMs = Math.round(totalDurationNs / 1_000_000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  return `${minutes}m ${seconds}s ${milliseconds}ms`;
}

function formatSummary(summary) {
  const lines = [
    "CP Automation TS Execution Summary",
    `Run Timestamp: ${summary.runTimestamp}`,
    `Environment: ${summary.environment}`,
    `Portal: ${summary.portal}`,
    `Duration: ${formatDuration(summary.totalDurationNs)}`,
    "",
    `Scenarios -> Passed: ${summary.scenarioPassed}, Failed: ${summary.scenarioFailed}, Skipped: ${summary.scenarioSkipped}`,
    `Scenario Percentages -> Pass: ${summary.scenarioPassPercentage.toFixed(2)}%, Fail: ${summary.scenarioFailPercentage.toFixed(2)}%`,
    `Steps -> Passed: ${summary.stepPassed}, Failed: ${summary.stepFailed}, Skipped: ${summary.stepSkipped}`,
    `Step Percentages -> Pass: ${summary.stepPassPercentage.toFixed(2)}%, Fail: ${summary.stepFailPercentage.toFixed(2)}%`,
    "",
    "Scenario Details:",
  ];

  for (const item of summary.scenarioLines) {
    lines.push(`- [${item.status}] ${item.feature} :: ${item.scenario}`);
    if (item.failedStep) {
      lines.push(`  Failed Step: ${item.failedStep}`);
    }
  }

  return lines.join("\n");
}

function main() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  
  try {
    const report = loadReport();
    const summary = buildSummary(report);
    const output = formatSummary(summary);

    fs.writeFileSync(path.join(artifactsDir, "summary.txt"), output);
    fs.writeFileSync(path.join(reportsDir, `${runTimestamp}_summary.txt`), output);

    console.log(output);
  } catch (error) {
    const fallback = [
      "CP Automation TS Execution Summary",
      `Run Timestamp: ${runTimestamp}`,
      `Environment: ${process.env.CP_ENV || "Not Set"}`,
      `Portal: ${process.env.CP_PORTAL || "Not Set"}`,
      "",
      "Summary could not be generated from cucumber-report.json.",
      `Reason: ${error.message}`
    ].join("\n");

    fs.writeFileSync(path.join(artifactsDir, "summary.txt"), fallback);
    fs.writeFileSync(path.join(reportsDir, `${runTimestamp}_summary.txt`), fallback);

    console.warn(fallback);
  }
}

main();
