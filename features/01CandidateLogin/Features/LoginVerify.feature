@CompliancePortalRegression
Feature: 02 Login Screen Functionality

Background: Open/going to CP Login screen
  Given I am on CP Login screen

Scenario: 01 Verify Sign In and Sign Out functionality for HOLT Candidate
  When I am going to login to CP with "HOLT Candidate" credentials
  Then I verify the Candidate should be login and Dashboard page should be open
  And I verify that user should be logout from CP and redirect to Login page

Scenario: 02 Verify Login screen validation functionality with blank validation for Username & Password
  When I click on LOG IN button without inserting "Username and Password"
  Then I verify that "validation" messages should be display

Scenario: 03 Verify Login screen validation functionality with blank validation for Username
  When I click on LOG IN button without inserting "Username"
  Then I verify that "validation" messages should be display

Scenario: 04 Verify Login screen validation functionality with blank validation for Password
  When I click on LOG IN button without inserting "Password"
  Then I verify that "validation" messages should be display

Scenario: 05 Verify Login screen validation functionality with wrong Username
  When I click on LOG IN button with inserting "Wrong Username"
  Then I verify that "error" messages should be display

Scenario: 06 Verify Login screen validation functionality with wrong Password
  When I click on LOG IN button with inserting "Wrong Password"
  Then I verify that "error" messages should be display

Scenario: 07 Verify Login screen validation functionality with wrong Username and Password
  When I click on LOG IN button with inserting "Wrong Username and Password"
  Then I verify that "error" messages should be display

Scenario: 08 Verify Sign In and Sign Out functionality for HOLT Staff user
  When I am going to login to CP with "HOLT Staff" credentials
  Then I verify that "HOLT Staff" should be login and Dashboard page should be open
  And I verify that user should be logout from CP and redirect to Login page

Scenario: 09 Verify Sign In functionality for Agency user
  When I am going to login to CP with "Agency User" credentials
  Then I verify that "Agency User" should not login and error messages should be display

Scenario: 10 Verify Sign In functionality for Client Person
  When I am going to login to CP with "Client Person" credentials
  Then I verify that "Client Person" should not login and error messages should be display

Scenario: 11 Verify redirection to Forgot Username Screen after click on Forgot Username link
  When I am going to click on "Forgot username" link
  Then I verify that "Forgot username" screen should be open

Scenario: 12 Verify Validation message with blank email id and clicks on SEND EMAIL button for Forgot Username
  When I am going to click on "Forgot username" link
  And I click on SEND EMAIL button without inserting "email"
  Then I verify that "blank email validation" messages should be display

Scenario: 13 Verify Thanks Message after entered valid email id and clicks on SEND EMAIL button for Forgot Username
  When I am going to click on "Forgot username" link
  And I click on SEND EMAIL button with inserting "email"
  Then I verify that "Check your email" messages should be display

Scenario: 14 Verify redirection to Forgot Password Screen after click on Forgot Password link
  When I am going to click on "Forgot password" link
  Then I verify that "Forgot password" screen should be open

Scenario: 15 Verify validation message with blank username and clicks on SEND EMAIL button for Forgot Password
  When I am going to click on "Forgot password" link
  And I click on SEND EMAIL button without inserting "username"
  Then I verify that "blank username validation" messages should be display

Scenario: 16 Verify Thanks Message after entered valid username and clicks on SEND EMAIL button for Forgot Password
  When I am going to click on "Forgot password" link
  And I click on SEND EMAIL button with inserting "username"
  Then I verify that "Check your email" messages should be display
