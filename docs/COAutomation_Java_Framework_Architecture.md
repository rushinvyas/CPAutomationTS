# COAutomation Java Framework Architecture

## 1. Purpose

This document defines the recommended enterprise architecture for a new Java-based automation framework that can grow into a common platform for:
- Web application automation
- API and service automation
- Mobile automation
- Shared reporting, configuration, data, database, and secret-management capabilities

For the first implementation phase, only the Web module will be built, but the framework should be structured so API and Mobile can be added later without redesigning the foundation.

## 2. Recommended Technology Stack

### 2.1 Core Language and Build
- Java 17
  Why: LTS version, stable for enterprise teams, supported broadly in CI/CD and cloud runners.
- Maven
  Why: Standard dependency management, build lifecycle, profiles, and easy CI/CD integration.

### 2.2 Test Execution and BDD
- Cucumber JVM
  Why: Supports feature files, business-readable test definitions, tagging, and clean integration with web/API/mobile layers.
- JUnit 5
  Why: Best choice for modern Java test execution with Cucumber. Cleaner and simpler than TestNG for this use case.

### 2.3 Automation Engines
- Playwright for Java
  Why: Modern browser automation, built-in tracing/video/screenshot support, stable selectors, multi-browser support.
- Rest Assured
  Why: Best-in-class Java API automation library for REST services, schema checks, auth flows, and assertions.
- Appium Java Client
  Why: Industry-standard for Android/iOS automation when the Mobile module is added.

### 2.4 Configuration, Data, and Utilities
- Jackson
  Why: Robust JSON parsing and object mapping for base.json, Uat.json, Prod.json, and future config payloads.
- JDBC
  Why: Direct DB connectivity for select/update/verify flows against MySQL or compatible databases.
- Azure Key Vault SDK for Java
  Why: Secure secret resolution in local/CI/cloud runs.
- SLF4J + Logback
  Why: Standard logging abstraction and configurable logging output.

### 2.5 Reporting
- Cucumber JSON formatter
  Why: Standard execution output and source for downstream reporting.
- Allure
  Why: Rich test reporting, trends, attachments, and execution charts.
- Custom HTML summary report
  Why: Team-friendly report similar to the current TS framework, easier to tailor for business users.

## 3. Why JUnit 5 Instead of TestNG

Recommendation: Use JUnit 5, not TestNG.

Reasons:
- Cucumber JVM integrates very cleanly with JUnit 5.
- Simpler architecture and less framework complexity.
- Better long-term maintainability for a common enterprise framework.
- TestNG is most valuable when teams rely heavily on native TestNG suite orchestration, which is less important when Cucumber tags already drive test selection.

If there is a hard organizational standard for TestNG, it can be used, but JUnit 5 is the cleaner default.

## 4. Architectural Style

The framework should use:
- Page Object Model for Web
- Screen Object Model for Mobile in future
- Client/Service Object Model for APIs in future
- Shared common framework foundation for config, secrets, database, reporting, and execution

This means the framework is not only "POM". It is:
- POM + BDD + Service Layer + Data Layer + Reporting Layer

## 5. High-Level Architecture

```text
COAutomation/
+-- pom.xml
+-- run-tests.bat
+-- docs/
+-- artifacts/
+-- reports/
+-- allure-results/
+-- allure-report/
+-- src/
    +-- main/
    ¦   +-- java/
    ¦       +-- com/coautomation/
    ¦           +-- common/
    ¦           +-- config/
    ¦           +-- core/
    ¦           +-- db/
    ¦           +-- keyvault/
    ¦           +-- logging/
    ¦           +-- reporting/
    ¦           +-- utils/
    ¦           +-- web/
    ¦           ¦   +-- locators/
    ¦           ¦   +-- pages/
    ¦           ¦   +-- actions/
    ¦           ¦   +-- assertions/
    ¦           +-- api/
    ¦           ¦   +-- clients/
    ¦           ¦   +-- models/
    ¦           ¦   +-- assertions/
    ¦           ¦   +-- services/
    ¦           +-- mobile/
    ¦               +-- locators/
    ¦               +-- screens/
    ¦               +-- actions/
    ¦               +-- assertions/
    +-- test/
        +-- java/
        ¦   +-- com/coautomation/
        ¦       +-- hooks/
        ¦       +-- runners/
        ¦       +-- stepdefinitions/
        ¦       ¦   +-- web/
        ¦       ¦   +-- api/
        ¦       ¦   +-- mobile/
        ¦       +-- contexts/
        +-- resources/
            +-- config/
            ¦   +-- base.json
            ¦   +-- Uat.json
            ¦   +-- Prod.json
            ¦   +-- Test.json
            +-- features/
            ¦   +-- web/
            ¦   ¦   +-- 01CandidateLogin/
            ¦   ¦       +-- LoginVerify.feature
            ¦   +-- api/
            ¦   +-- mobile/
            +-- logback.xml
```

## 6. Module Responsibilities

### 6.1 common
Purpose: Shared constants, mutable state, enums, and reusable domain-neutral helpers.

Suggested files:
- ConstantVariables.java
- CommonVariables.java
- ExecutionCategory.java
- EnvironmentType.java
- PortalType.java

Use cases:
- Shared constant values
- Cross-step transient state
- Framework-level enumerations

### 6.2 config
Purpose: Configuration loading and resolution.

Suggested files:
- ConfigManager.java
- BaseConfig.java
- EnvironmentConfig.java
- JsonConfigLoader.java
- PropertyResolver.java

Responsibilities:
- Load base.json
- Resolve selected environment file like Uat.json / Prod.json / Test.json
- Support precedence:
  1. Runtime env vars from Azure/AWS/local shell
  2. base.json environment
  3. default fallback
- Provide strongly typed getters

Recommended precedence model:
1. CP_ENV
2. TEST_ENV
3. base.json -> environment
4. default UAT

### 6.3 core
Purpose: Runtime lifecycle and driver setup.

Suggested files:
- PlaywrightManager.java
- BrowserFactory.java
- ScenarioContext.java
- TestContext.java
- WorldContext.java

Responsibilities:
- Launch browser based on config
- Create browser/context/page
- Configure screenshots/videos/tracing
- Reuse browser if suite-level reuse is enabled
- Close resources properly

### 6.4 db
Purpose: Data retrieval, updates, and verification.

Suggested files:
- DbConnectionManager.java
- QueryRepository.java
- DbDataService.java
- ResultSetMapper.java

Responsibilities:
- Create DB connections
- Run select/update/verify operations
- Execute stored procedures
- Supply test data to step logic
- Verify application side effects in DB

### 6.5 keyvault
Purpose: Secret management.

Suggested files:
- KeyVaultService.java
- SecretResolver.java

Responsibilities:
- Authenticate with Azure Key Vault
- Resolve runtime secrets
- Allow future support for AWS Secrets Manager if needed

Design note:
Create an interface like SecretProvider so Azure can later be swapped or extended.

### 6.6 logging
Purpose: Framework logs.

Suggested files:
- LoggerFactory.java
- logback.xml in resources

Responsibilities:
- Console logs
- File logs if needed
- Structured diagnostic messages

### 6.7 reporting
Purpose: Execution outputs and user-facing reports.

Suggested files:
- ReportManager.java
- ScreenshotManager.java
- VideoManager.java
- ExecutionSummaryWriter.java
- HtmlReportGenerator.java
- AllureAttachmentManager.java

Responsibilities:
- Save screenshots
- Manage videos
- Generate summary.txt
- Generate custom HTML report
- Publish Allure results
- Archive per-run reports with timestamp

### 6.8 utils
Purpose: Generic helper utilities not tied to one module.

Suggested files:
- WaitUtils.java
- FileUtils.java
- DateUtils.java
- StringUtils.java
- RandomUtils.java
- PathUtils.java

### 6.9 web
Purpose: Actual Web automation implementation.

Suggested subfolders:
- locators/
- pages/
- actions/
- assertions/

Responsibilities:
- Hold page selectors
- Encapsulate page interactions
- Implement page validations
- Keep step definitions thin

### 6.10 api
Purpose: Future API/service layer.

Suggested subfolders:
- clients/
- models/
- services/
- assertions/

Responsibilities:
- Request building
- Response validation
- Auth flows
- Shared API test data setup

### 6.11 mobile
Purpose: Future Appium-based automation.

Suggested subfolders:
- screens/
- locators/
- actions/
- assertions/

Responsibilities:
- Mobile driver/session setup
- Screen objects
- Mobile gestures and validations

## 7. Test Resources Structure

```text
src/test/resources/
+-- config/
¦   +-- base.json
¦   +-- Uat.json
¦   +-- Prod.json
¦   +-- Test.json
+-- features/
¦   +-- web/
¦       +-- 01CandidateLogin/
¦           +-- LoginVerify.feature
+-- logback.xml
```

## 8. Configuration Design

### 8.1 base.json
Purpose:
- Global defaults
- Default environment
- Browser defaults
- Reporting defaults
- Runtime behavior flags

Example fields:
```json
{
  "environment": "Uat",
  "browser": "chromium",
  "headless": false,
  "slowMo": 300,
  "timeout": 30000,
  "reuseBrowser": true,
  "reportSubject": "COAutomation Report"
}
```

### 8.2 Uat.json / Prod.json / Test.json
Purpose:
- Environment-specific non-secret values
- URLs
- usernames if non-sensitive
- portal-specific details
- DB host alias if non-secret

Example fields:
```json
{
  "IsAzure": "Yes",
  "KeyVaultUrl": "https://example.vault.azure.net/",
  "ClientID": "...",
  "TenantID": "...",
  "ClientSecret": "...",
  "CPURL": "compliance-uat.example.com/login",
  "CPLoginURL": "compliance-uat.example.com/login",
  "CPRegisteURL": "compliance-uat.example.com/register",
  "CPHOLTCandidate": "CPHOLTCandidate",
  "password": "password",
  "DbConnectionString": "..."
}
```

### 8.3 Secret and Config Strategy
Recommended rule:
- JSON stores non-secret or secret-key references
- Key Vault stores actual secrets
- Env vars override JSON when running in Azure/AWS/local CI

Recommended precedence for a value:
1. Explicit env var override
2. Environment JSON
3. base.json default
4. Key Vault resolved value if the field is a secret reference

## 9. Database Strategy

The framework should support:
- Fetching data before test execution
- Updating records during test flow when required
- Verifying records after UI/API operations
- Calling stored procedures

Suggested classes:
- DbConnectionManager
- QueryRepository
- DbDataService

Example responsibilities:
- executeQuery(String sql)
- executeStoredProcedure(String name, Map<String, Object> params)
- fetchSingleValue(...)
- fetchRows(...)
- updateAndVerify(...)

## 10. Web Automation Layer Design

### 10.1 Locator Classes
Example:
- CPLocators.java

Responsibilities:
- Only selectors
- No business logic

### 10.2 Page Classes
Example:
- CandidateLoginPage.java

Responsibilities:
- Open page
- Enter username/password
- Click buttons
- Verify messages
- Verify redirection

### 10.3 Step Definitions
Example:
- CandidateLoginSteps.java

Responsibilities:
- Call page/service methods
- Keep steps readable
- Avoid heavy locator logic in step files

## 11. Hooks and Lifecycle

Suggested hooks:
- BeforeAll
  - initialize report folders
  - initialize metadata
- Before
  - initialize browser/context/page
  - attach scenario context
- AfterStep
  - attach step screenshot if required
- After
  - take failure screenshot
  - attach video/traces
  - reset scenario state
- AfterAll
  - close shared resources
  - finalize reports

## 12. Runner Strategy

Recommended runner style:
- Cucumber + JUnit 5 suite runner
- Tags drive category selection
- Batch file drives ENV and CATEGORY

Example category:
- @CompliancePortalRegression
- @SmokeRegression
- @AgileSmokeRegression

Recommended batch pattern:
```bat
run-tests.bat UAT CompliancePortalRegression
```

Recommended pipeline pattern:
```yaml
- script: run-tests.bat UAT CompliancePortalRegression
```

## 13. Reporting Strategy

Recommended outputs:
- artifacts/cucumber-report.json
- artifacts/summary.txt
- artifacts/screenshots/
- artifacts/videos/
- report.html
- reports/<timestamp>/...
- allure-results/
- allure-report/

Recommended report content:
- Environment
- Category
- Duration
- Scenario pass/fail counts
- Step pass/fail counts
- Failure reason
- Screenshot links
- Video links
- HTML summary for business users
- Allure for engineering/deep review

## 14. Execution Modes

### 14.1 Local
- Reads base.json and env json
- Can use local browser and local credentials/secrets

### 14.2 Windows Task Scheduler
- Calls fixed wrapper or run-tests.bat directly
- Example:
```bat
run-tests.bat UAT CompliancePortalRegression
```

### 14.3 Azure DevOps
- Use Windows agent
- Pass CP_ENV or use batch parameters
- Use secure pipeline variables / Key Vault integration

### 14.4 AWS
- Use Windows runner or EC2 Windows host
- Same batch pattern
- Secrets can later be abstracted for AWS Secrets Manager if required

## 15. First Implementation Scope

Phase 1 should include only:
- Common framework foundation
- Web module only
- LoginVerify.feature only
- DB connectivity
- Key Vault integration
- Screenshot/video/reporting
- Batch execution by ENV and CATEGORY

## 16. Future Expansion Plan

### Phase 2
- Smoke pack folder and tags
- Additional web features
- Better report UI and charts

### Phase 3
- API module with Rest Assured
- Shared auth and contract validation support

### Phase 4
- Mobile module with Appium
- Shared config and reporting reuse

## 17. Final Recommendation

Use this stack:
- Java 17
- Maven
- Cucumber JVM
- JUnit 5
- Playwright for Java
- Jackson
- JDBC
- Azure Key Vault SDK
- SLF4J + Logback
- Allure + custom HTML report

Use this architectural principle:
- Common enterprise framework
- Web implementation first
- API and Mobile prepared for later

This gives:
- strong local usability
- Azure/AWS readiness
- maintainable codebase
- reusable cross-channel architecture
- business-friendly reporting

## 18. Immediate Next Step

After approving this architecture, implementation should start in this order:
1. Create Maven project skeleton
2. Create config/base/env loaders
3. Create Playwright core and hooks
4. Create reporting and artifacts model
5. Create DB and Key Vault layers
6. Port LoginVerify.feature
7. Port related locators/page/steps/common files
8. Add run-tests.bat and reporting generation
