const { AllureRuntime } = require("allure-js-commons");
const { CucumberJSAllureFormatter } = require("allure-cucumberjs");

class Reporter extends CucumberJSAllureFormatter {
  constructor(options) {
    super(
      options,
      new AllureRuntime({ resultsDir: "./allure-results" }),
      {
        labels: [
          {
            pattern: [/@owner:(.*)/],
            name: "owner",
          },
          {
            pattern: [/@severity:(.*)/],
            name: "severity",
          },
        ],
      }
    );
  }
}

module.exports = Reporter;
