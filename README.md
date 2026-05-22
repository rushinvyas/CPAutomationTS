•	**package.json:** entry scripts for build, Cucumber execution, Allure generation, summary generation, and custom HTML report.

•	**features/:** Gherkin feature files; this is the business-level test definition layer.

•	**src/core/:** runtime foundation. CustomWorld.ts creates browser/context/page, ScenarioContext.ts stores per-scenario state, ElementActions.ts wraps Playwright actions.

•	**src/pages/:** page-object layer. Each page class holds UI flow methods, validations, and locator usage.

•	**src/locators/:** locator constants only; selectors are centralized here to avoid duplication in steps/pages.

•	**src/steps/:** step-definition layer that maps feature steps to page methods and scenario actions.

•	**src/hooks/:** before/after lifecycle, screenshot capture, cleanup, and report attachments.

•	**src/utils/:** support services such as config loading, DB access, test-data access, OTP handling, and Key Vault integration.

•	**src/common/:** reusable framework constants and helper methods used across pages/steps/utils.

•	**test-data/:** environment files like Uat.json, Prod.json, base.json, plus shared test data.
